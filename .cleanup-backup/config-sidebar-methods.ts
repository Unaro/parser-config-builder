/**
 * Config Sidebar Methods - ВОССТАНОВЛЕННАЯ ПОЛНАЯ ВЕРСИЯ с интегрированным модальным диалогом + DEBUG/NOTIFICATION
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
   * НОВЫЙ МОДАЛЬНЫЙ диалог добавления поля с человекопонятными типами + ASYNC + DEBUG
   */
  static async showAddFieldDialog(config: ParserConfig, onMessage: (message: any)=>Promise<any>): Promise<void> {
    const existingNames = config.schema.fields.map(f => f.name);
    
    const overlay = document.createElement('div');
    overlay.className = 'pcb-ui pcb-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:999999;display:flex;align-items:center;justify-content:center;';

    const modal = document.createElement('div');
    modal.className = 'pcb-ui pcb-modal';
    modal.style.cssText = 'width:560px;max-width:90vw;background:#fff;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,.25);overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial;';

    modal.innerHTML = `
      <div style="padding:16px 20px;background:linear-gradient(135deg,#1890ff,#52c41a);color:#fff;font-weight:700;display:flex;align-items:center;justify-content:space-between;">
        <span>🎯 Добавить поле</span>
        <button id="pcb-close-add" class="pcb-ui" style="background:transparent;border:none;color:#fff;font-size:18px;cursor:pointer;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;" onmouseover="this.style.backgroundColor='rgba(255,255,255,0.2)'" onmouseout="this.style.backgroundColor='transparent'">×</button>
      </div>
      <div style="padding:20px;display:grid;gap:16px;">
        <!-- Название поля -->
        <div>
          <label style="display:block;font-weight:600;color:#333;margin-bottom:8px;">📝 Название поля</label>
          <input id="pcb-new-field-name" type="text" placeholder="Например: Название, Автор, Жанры, Рейтинг" style="width:100%;padding:12px;border:2px solid #e8e8e8;border-radius:8px;font-size:14px;" />
        </div>
        
        <!-- Тип данных (карточки) -->
        <div>
          <label style="display:block;font-weight:600;color:#333;margin-bottom:10px;">🎲 Тип данных</label>
          <div id="pcb-type-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            ${[
              {k:'text', t:'📄 Текст', d:'Название, Автор, Описание', ex:'"Моя манга"'},
              {k:'attribute', t:'🔗 Ссылка/адрес', d:'href, src, data-*', ex:'"https://site.com/manga/123"'},
              {k:'html', t:'🌐 HTML код', d:'Разметка узла', ex:'"<b>текст</b>"'},
              {k:'array', t:'📋 Список', d:'Жанры, Теги, Авторы', ex:'["фэнтези", "приключения"]'},
              {k:'count', t:'🔢 Количество', d:'Число совпадений', ex:'42'},
              {k:'exists', t:'✅ Есть/нет', d:'Проверка наличия', ex:'true/false'}
            ].map(item=>`
              <button class="pcb-ui pcb-type-card" data-type="${item.k}" style="text-align:left;padding:14px;border:2px solid #e8e8e8;border-radius:10px;cursor:pointer;background:#fff;transition:all 0.2s;" onmouseover="if(this.style.borderColor==='rgb(232, 232, 232)') this.style.borderColor='#40a9ff'" onmouseout="if(this.style.borderColor!=='rgb(24, 144, 255)') this.style.borderColor='#e8e8e8'">
                <div style="font-weight:700;color:#333;margin-bottom:4px;">${item.t}</div>
                <div style="font-size:11px;color:#666;margin-bottom:3px;">${item.d}</div>
                <div style="font-size:10px;color:#999;font-family:monospace;">${item.ex}</div>
              </button>
            `).join('')}
          </div>
          
          <!-- Атрибут (показывается только для attribute) -->
          <div id="pcb-attr-wrap" style="display:none;margin-top:12px;">
            <label style="display:block;font-weight:600;color:#333;margin-bottom:8px;">🏷️ Атрибут</label>
            <input id="pcb-new-field-attr" type="text" value="href" placeholder="href, src, data-id, content" style="width:100%;padding:10px 12px;border:2px solid #e8e8e8;border-radius:8px;font-size:14px;" />
            <div style="font-size:11px;color:#666;margin-top:4px;">Для ссылок: href, для картинок: src, для данных: data-*</div>
          </div>
        </div>
        
        <!-- Описание -->
        <div>
          <label style="display:block;font-weight:600;color:#333;margin-bottom:8px;">💭 Описание (необязательно)</label>
          <input id="pcb-new-field-desc" type="text" placeholder="Подсказка для себя (например: берём имя автора из шапки)" style="width:100%;padding:10px 12px;border:2px solid #e8e8e8;border-radius:8px;font-size:14px;" />
        </div>
        
        <!-- Действия -->
        <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:8px;">
          <button id="pcb-cancel-add" class="pcb-ui" style="padding:12px 16px;border:2px solid #e8e8e8;border-radius:8px;background:#fff;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.borderColor='#ff4d4f'; this.style.color='#ff4d4f'" onmouseout="this.style.borderColor='#e8e8e8'; this.style.color='#333'">Отмена</button>
          <button id="pcb-save-add" class="pcb-ui" style="padding:12px 20px;border:none;border-radius:8px;background:#1890ff;color:#fff;cursor:pointer;font-weight:700;transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform=''">➕ Добавить</button>
        </div>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const nameInput = modal.querySelector('#pcb-new-field-name') as HTMLInputElement;
    const descInput = modal.querySelector('#pcb-new-field-desc') as HTMLInputElement;
    const attrInput = modal.querySelector('#pcb-new-field-attr') as HTMLInputElement;
    const attrWrap = modal.querySelector('#pcb-attr-wrap') as HTMLElement;

    let selectedType: string = 'text';

    const setActive = (btn: HTMLElement) => {
      modal.querySelectorAll('.pcb-type-card').forEach(b => (b as HTMLElement).style.borderColor = '#e8e8e8');
      btn.style.borderColor = '#1890ff';
      btn.style.backgroundColor = '#f0f8ff';
    };

    const typeCards = Array.from(modal.querySelectorAll('.pcb-type-card')) as HTMLElement[];
    typeCards.forEach((btn, idx) => {
      if (idx === 0) setActive(btn);
      btn.addEventListener('click', () => {
        selectedType = btn.getAttribute('data-type') || 'text';
        setActive(btn);
        attrWrap.style.display = selectedType === 'attribute' ? '' : 'none';
      });
    });

    const close = () => overlay.remove();
    modal.querySelector('#pcb-close-add')?.addEventListener('click', close);
    modal.querySelector('#pcb-cancel-add')?.addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

    modal.querySelector('#pcb-save-add')?.addEventListener('click', async () => {
      const name = nameInput.value.trim();
      console.log('🎯 ADD FIELD CLICK:', { name, selectedType, existingNames });
      
      if (!name) { 
        alert('Введите название поля'); 
        nameInput.focus(); 
        return; 
      }
      if (existingNames.includes(name)) { 
        alert('Поле с таким названием уже существует'); 
        nameInput.focus(); 
        return; 
      }
      
      const description = descInput.value.trim();
      const attribute = selectedType === 'attribute' ? (attrInput.value.trim() || 'href') : undefined;

      const fieldData = { 
        name, 
        type: selectedType, 
        description, 
        required: false, 
        ...(attribute ? { attribute } : {}) 
      };

      console.log('🚀 SENDING CREATE_FIELD:', fieldData);

      try {
        const response = await onMessage({
          type: 'CREATE_FIELD',
          field: fieldData,
          id: `sidebar_${Date.now()}`,
          timestamp: Date.now()
        });
        
        console.log('✅ CREATE_FIELD RESPONSE:', response);
        
        if (response?.success) {
          SidebarUIMethods.showNotification(`Поле "${name}" создано`, 'success');
          close();
        } else {
          SidebarUIMethods.showNotification(`Ошибка: ${response?.error || 'неизвестная ошибка'}`, 'error');
        }
      } catch (error) {
        console.error('❌ CREATE_FIELD ERROR:', error);
        SidebarUIMethods.showNotification(`Ошибка: ${(error as Error).message}`, 'error');
      }
    });

    // Focus на первое поле
    setTimeout(() => nameInput.focus(), 100);
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
      right: 440px;
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
      animation: slideInFromRight 0.3s ease-out;
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