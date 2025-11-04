/**
 * Config Sidebar Methods - дополнительные методы для ConfigSidebar
 */

import type { 
  ElementSelectedMessage, 
  TestResult,
  ParserConfig
} from '@/types';
import type { SchemaField } from '@/types/schema';
import type { SelectorConfig } from '@/types/selector';
import { saveAs } from 'file-saver';
import { 
  getDefaultSchemaField,
  generateUniqueFieldName,
  formatTime,
  truncateSelector,
  isValidSelector
} from './config-sidebar-helpers';

/**
 * Методы UI операций для ConfigSidebar
 */
export class SidebarUIMethods {
  /**
   * Показать диалог выбора поля для выделения
   */
  static showFieldSelectionPrompt(
    config: ParserConfig,
    onMessage: (message: any) => void
  ): void {
    const fields = config.schema.fields;
    
    if (fields.length === 0) {
      alert('Сначала добавьте поля в схему');
      return;
    }
    
    const fieldName = prompt(
      `Выберите поле для выделения:\n\n` +
      fields.map((f, i) => `${i + 1}. ${f.name} (${f.type})`).join('\n'),
      fields[0]?.name ?? 'field'
    );
    
    if (!fieldName) return;
    
    const field = fields.find(f => f.name === fieldName);
    if (!field) {
      alert('Поле не найдено');
      return;
    }
    
    onMessage({
      type: 'START_SELECTION',
      fieldName: field.name,
      fieldType: field.type,
      id: `sidebar_${Date.now()}`,
      timestamp: Date.now()
    });
  }
  
  /**
   * Показать диалог добавления поля
   */
  static showAddFieldDialog(
    config: ParserConfig,
    onMessage: (message: any) => void
  ): void {
    const existingNames = config.schema.fields.map(f => f.name);
    const defaultName = generateUniqueFieldName(existingNames, 'field');
    
    const fieldName = prompt('Название поля:', defaultName);
    if (!fieldName || existingNames.includes(fieldName)) {
      if (fieldName && existingNames.includes(fieldName)) {
        alert('Поле с таким названием уже существует');
      }
      return;
    }
    
    const fieldType = prompt(
      'Тип поля (string, number, boolean, array, object):',
      'string'
    ) || 'string';
    
    const required = confirm('Обязательное поле?');
    
    const newField = getDefaultSchemaField(fieldName, fieldType);
    newField.required = required;
    
    const newSchema = {
      ...config.schema,
      fields: [...config.schema.fields, newField]
    };
    
    onMessage({
      type: 'UPDATE_SCHEMA',
      schema: newSchema,
      id: `sidebar_${Date.now()}`,
      timestamp: Date.now()
    });
  }
  
  /**
   * Показать диалог редактирования поля
   */
  static showEditFieldDialog(
    config: ParserConfig,
    fieldName: string,
    onMessage: (message: any) => void
  ): void {
    const field = config.schema.fields.find(f => f.name === fieldName);
    if (!field) return;
    
    const newName = prompt('Новое название поля:', field.name);
    if (!newName) return;
    
    const existingNames = config.schema.fields
      .map(f => f.name)
      .filter(name => name !== fieldName);
    
    if (existingNames.includes(newName)) {
      alert('Поле с таким названием уже существует');
      return;
    }
    
    const newType = prompt(
      'Тип поля (string, number, boolean, array, object):',
      field.type
    ) || field.type;
    
    const required = confirm(`Обязательное поле? (текущее: ${field.required ? 'да' : 'нет'})`);
    
    const updatedField = {
      ...field,
      name: newName,
      type: newType as any,
      required
    };
    
    const newSchema = {
      ...config.schema,
      fields: config.schema.fields.map(f => f.name === fieldName ? updatedField : f)
    };
    
    onMessage({
      type: 'UPDATE_SCHEMA',
      schema: newSchema,
      id: `sidebar_${Date.now()}`,
      timestamp: Date.now()
    });
  }
  
  /**
   * Удалить поле
   */
  static deleteField(
    config: ParserConfig,
    fieldName: string,
    onMessage: (message: any) => void
  ): void {
    if (!confirm(`Удалить поле "${fieldName}"?`)) return;
    
    const newSchema = {
      ...config.schema,
      fields: config.schema.fields.filter(f => f.name !== fieldName)
    };
    
    onMessage({
      type: 'UPDATE_SCHEMA',
      schema: newSchema,
      id: `sidebar_${Date.now()}`,
      timestamp: Date.now()
    });
  }
  
  /**
   * Начать выбор поля
   */
  static startFieldSelection(
    fieldName: string,
    fieldType: string,
    onMessage: (message: any) => void
  ): void {
    onMessage({
      type: 'START_SELECTION',
      fieldName,
      fieldType,
      id: `sidebar_${Date.now()}`,
      timestamp: Date.now()
    });
  }
  
  /**
   * Экспорт конфига
   */
  static exportConfig(config: ParserConfig): void {
    try {
      const configJson = JSON.stringify(config, null, 2);
      const blob = new Blob([configJson], { type: 'application/json' });
      const filename = `${config.platform.domain}_${config.pageType}_config.json`;
      
      saveAs(blob, filename);
      
      console.log('Config exported:', filename);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Ошибка экспорта конфига');
    }
  }
  
  /**
   * Предпросмотр селектора
   */
  static previewSelector(
    selector: string,
    onMessage: (message: any) => void
  ): void {
    if (!isValidSelector(selector)) {
      alert('Невалидный селектор');
      return;
    }
    
    onMessage({
      type: 'HIGHLIGHT_ELEMENT',
      selector,
      id: `sidebar_${Date.now()}`,
      timestamp: Date.now()
    });
  }
  
  /**
   * Сохранить селектор
   */
  static saveSelector(
    fieldName: string,
    selectorConfig: SelectorConfig,
    onMessage: (message: any) => void
  ): void {
    if (!isValidSelector(selectorConfig.primary)) {
      alert('Невалидный основной селектор');
      return;
    }
    
    const invalidFallbacks = selectorConfig.fallback.filter(fb => !isValidSelector(fb));
    if (invalidFallbacks.length > 0) {
      alert(`Невалидные fallback селекторы: ${invalidFallbacks.join(', ')}`);
      return;
    }
    
    onMessage({
      type: 'UPDATE_SELECTOR',
      fieldName,
      selectorConfig,
      id: `sidebar_${Date.now()}`,
      timestamp: Date.now()
    });
  }
  
  /**
   * Отобразить элемент истории
   */
  static renderHistoryItem(message: ElementSelectedMessage): string {
    return `
      <div class="pcb-history-item" data-field-name="${message.fieldName}" style="
        padding: 8px 12px;
        background: #f9f9f9;
        border-radius: 4px;
        border-left: 3px solid #1890ff;
        cursor: pointer;
        transition: background-color 0.2s;
      " onmouseover="this.style.backgroundColor='#e6f7ff'" onmouseout="this.style.backgroundColor='#f9f9f9'">
        <div style="font-weight: 600; font-size: 13px;">${message.fieldName}</div>
        <div style="color: #666; margin-top: 2px; font-size: 11px;">
          ${message.element.tagName.toLowerCase()} • ${formatTime(message.timestamp)}
        </div>
        <div style="
          color: #999;
          font-family: monospace;
          font-size: 10px;
          margin-top: 4px;
          word-break: break-all;
        ">
          ${truncateSelector(message.selector.selector, 40)}
        </div>
      </div>
    `;
  }
  
  /**
   * Отобразить результаты теста
   */
  static renderTestResults(results: TestResult[]): string {
    if (results.length === 0) return '';
    
    const resultItems = results.map(result => `
      <div style="
        padding: 6px 8px;
        background: ${result.success ? '#f6ffed' : '#fff2f0'};
        border-left: 3px solid ${result.success ? '#52c41a' : '#ff4d4f'};
        border-radius: 3px;
        margin-bottom: 4px;
        font-size: 11px;
      ">
        <div style="font-weight: 600;">
          ${result.success ? '✅' : '❌'} ${result.fieldName}
        </div>
        <div style="color: #666; margin-top: 2px;">
          ${result.success 
            ? `Значение: ${String(result.extractedValue).substring(0, 50)}${String(result.extractedValue).length > 50 ? '...' : ''}`
            : `Ошибка: ${result.error}`
          }
        </div>
      </div>
    `).join('');
    
    return `
      <div style="margin-top: 16px;">
        <div style="font-weight: 600; font-size: 13px; margin-bottom: 8px; color: #666;">
          Результаты теста:
        </div>
        ${resultItems}
      </div>
    `;
  }
  
  /**
   * Показать уведомление
   */
  static showNotification(
    text: string, 
    type: 'success' | 'error' | 'warning' = 'success'
  ): void {
    const notification = document.createElement('div');
    notification.className = 'pcb-notification';
    
    const colors = {
      success: { bg: '#f6ffed', border: '#52c41a', text: '#389e0d' },
      error: { bg: '#fff2f0', border: '#ff4d4f', text: '#cf1322' },
      warning: { bg: '#fffbe6', border: '#faad14', text: '#d48806' }
    };
    
    const color = colors[type];
    
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 420px;
      max-width: 300px;
      padding: 12px 16px;
      background: ${color.bg};
      border: 1px solid ${color.border};
      color: ${color.text};
      border-radius: 6px;
      font-size: 14px;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    `;
    
    notification.textContent = text;
    document.body.appendChild(notification);

    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 4000);
  }
}
