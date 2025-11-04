/**
 * Config Sidebar - боковая панель управления конфигурацией
 */

import type { 
  ParserConfig, 
  ElementSelectedMessage, 
  PageType,
  TestResult 
} from '@/types';
import type { SelectorConfig } from '@/types/selector';
import type { SchemaField } from '@/types/schema';
import { saveAs } from 'file-saver';

export class ConfigSidebar {
  private isVisible = false;
  private sidebarElement: HTMLElement | null = null;
  private currentConfig: ParserConfig | null = null;
  private currentSection: 'main' | 'schema' | 'selector' = 'main';
  private selectedField: string | null = null;
  private onMessage: (message: any) => void;

  constructor(onMessage: (message: any) => void) {
    this.onMessage = onMessage;
    console.log('ConfigSidebar: Initialized');
  }

  /**
   * Показать сайдбар
   */
  public show(): void {
    if (this.isVisible) return;

    this.createSidebar();
    this.isVisible = true;
    
    console.log('ConfigSidebar: Shown');
  }

  /**
   * Скрыть сайдбар
   */
  public hide(): void {
    if (!this.isVisible || !this.sidebarElement) return;

    this.sidebarElement.remove();
    this.sidebarElement = null;
    this.isVisible = false;
    this.currentSection = 'main';
    this.selectedField = null;
    
    console.log('ConfigSidebar: Hidden');
  }

  /**
   * Обновить конфиг
   */
  public updateConfig(config: ParserConfig): void {
    this.currentConfig = config;
    
    if (this.isVisible) {
      this.updateSidebarContent();
    }
    
    console.log('ConfigSidebar: Config updated', config.platform.name);
  }

  /**
   * Уведомить о выбранном элементе
   */
  public notifyElementSelected(message: ElementSelectedMessage): void {
    console.log('ConfigSidebar: Element selected notification', message);
    
    this.showNotification(
      `✅ Элемент выбран для поля "${message.fieldName}"`,
      'success'
    );
    
    this.addToSelectionHistory(message);
    
    // Автооткрытие редактора селектора
    if (this.selectedField === message.fieldName) {
      this.openSelectorEditor(message.fieldName, message.selector);
    }
  }

  /**
   * Уведомить об отмене выбора
   */
  public notifySelectionCancelled(fieldName: string): void {
    console.log('ConfigSidebar: Selection cancelled for field', fieldName);
    
    this.showNotification(
      `❌ Выбор элемента для поля "${fieldName}" отменён`,
      'warning'
    );
  }

  /**
   * Уведомить о результатах теста
   */
  public notifyTestResults(results: TestResult[]): void {
    console.log('ConfigSidebar: Test results', results);
    
    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;
    
    this.showNotification(
      `🧪 Тест завершён: ${successCount}/${totalCount} селекторов работают`,
      successCount === totalCount ? 'success' : 'warning'
    );
    
    // Обновляем отображение результатов
    this.updateTestResults(results);
  }

  /**
   * Открыть редактор селектора
   */
  private openSelectorEditor(fieldName: string, selector?: any): void {
    this.selectedField = fieldName;
    this.currentSection = 'selector';
    this.updateSidebarContent();
  }

  /**
   * Создать сайдбар
   */
  private createSidebar(): void {
    if (this.sidebarElement) return;

    this.sidebarElement = document.createElement('div');
    this.sidebarElement.id = 'pcb-sidebar';
    this.sidebarElement.className = 'pcb-sidebar pcb-ui';
    
    // Стили для сайдбара
    this.sidebarElement.style.cssText = `
      position: fixed;
      top: 0;
      right: 0;
      width: 400px;
      height: 100vh;
      background: white;
      border-left: 2px solid #1890ff;
      box-shadow: -2px 0 8px rgba(0, 0, 0, 0.15);
      z-index: 999998;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
    `;

    document.body.appendChild(this.sidebarElement);
    this.updateSidebarContent();
  }

  /**
   * Обновить содержимое сайдбара
   */
  private updateSidebarContent(): void {
    if (!this.sidebarElement || !this.currentConfig) return;

    this.sidebarElement.innerHTML = this.renderSidebar();
    this.bindEventListeners();
  }

  /**
   * Отрисовка сайдбара
   */
  private renderSidebar(): string {
    const config = this.currentConfig!;
    
    return `
      ${this.renderHeader()}
      ${this.renderControlPanel()}
      ${this.renderMainContent()}
      ${this.renderFooter()}
    `;
  }

  /**
   * Отрисовка заголовка
   */
  private renderHeader(): string {
    return `
      <div class="pcb-sidebar-header" style="
        padding: 16px;
        background: #1890ff;
        color: white;
        font-weight: 600;
        font-size: 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      ">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span>🔧</span>
          Parser Builder
        </div>
        <button id="pcb-close-btn" style="
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 14px;
        ">×</button>
      </div>
    `;
  }

  /**
   * Отрисовка панели управления
   */
  private renderControlPanel(): string {
    const pageTypes: PageType[] = ['work_detail', 'work_list', 'chapter_list', 'chapter_read', 'team_profile', 'user_profile'];
    const pageTypeOptions = pageTypes.map(type => 
      `<option value="${type}" ${this.currentConfig!.pageType === type ? 'selected' : ''}>${this.getPageTypeLabel(type)}</option>`
    ).join('');

    return `
      <div class="pcb-control-panel" style="
        padding: 16px;
        background: #f8f9fa;
        border-bottom: 1px solid #e9ecef;
      ">
        <div style="margin-bottom: 12px;">
          <label style="display: block; font-size: 12px; font-weight: 600; color: #666; margin-bottom: 4px;">
            Тип страницы:
          </label>
          <select id="pcb-page-type" style="
            width: 100%;
            padding: 6px 8px;
            border: 1px solid #d9d9d9;
            border-radius: 4px;
            font-size: 13px;
          ">
            ${pageTypeOptions}
          </select>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
          <button id="pcb-start-selection" class="pcb-btn-primary" style="
            padding: 8px 12px;
            background: #52c41a;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 600;
          ">🎯 Выбрать поле</button>
          
          <button id="pcb-stop-selection" class="pcb-btn-secondary" style="
            padding: 8px 12px;
            background: #ff4d4f;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 600;
          ">⏹️ Остановить</button>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
          <button id="pcb-test-config" class="pcb-btn-outline" style="
            padding: 8px 12px;
            background: white;
            color: #1890ff;
            border: 1px solid #1890ff;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 600;
          ">🧪 Тест</button>
          
          <button id="pcb-export-config" class="pcb-btn-outline" style="
            padding: 8px 12px;
            background: white;
            color: #1890ff;
            border: 1px solid #1890ff;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 600;
          ">📥 Экспорт</button>
        </div>
      </div>
    `;
  }

  /**
   * Отрисовка основного содержимого
   */
  private renderMainContent(): string {
    switch (this.currentSection) {
      case 'schema':
        return this.renderSchemaEditor();
      case 'selector':
        return this.renderSelectorEditor();
      default:
        return this.renderMainSection();
    }
  }

  /**
   * Отрисовка основной секции
   */
  private renderMainSection(): string {
    const config = this.currentConfig!;
    
    return `
      <div class="pcb-content" style="flex: 1; padding: 16px;">
        <div class="pcb-section-tabs" style="
          display: flex;
          border-bottom: 1px solid #e9ecef;
          margin-bottom: 16px;
        ">
          <button class="pcb-tab active" data-section="main" style="
            padding: 8px 16px;
            background: none;
            border: none;
            border-bottom: 2px solid #1890ff;
            color: #1890ff;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
          ">ℹ️ Обзор</button>
          
          <button class="pcb-tab" data-section="schema" style="
            padding: 8px 16px;
            background: none;
            border: none;
            border-bottom: 2px solid transparent;
            color: #666;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
          ">📄 Схема (${config.schema.fields.length})</button>
        </div>
        
        ${this.renderConfigInfo()}
        ${this.renderSelectionHistory()}
      </div>
    `;
  }

  /**
   * Отрисовка информации о конфиге
   */
  private renderConfigInfo(): string {
    const config = this.currentConfig!;
    
    return `
      <div class="pcb-config-info" style="
        padding: 12px;
        background: #f0f8ff;
        border: 1px solid #1890ff;
        border-radius: 6px;
        font-size: 13px;
        margin-bottom: 16px;
      ">
        <div><strong>Платформа:</strong> ${config.platform.name}</div>
        <div><strong>Домен:</strong> ${config.platform.domain}</div>
        <div><strong>Тип:</strong> ${this.getPageTypeLabel(config.pageType)}</div>
        <div><strong>Полей:</strong> ${config.schema.fields.length}</div>
        <div><strong>Селекторов:</strong> ${Object.keys(config.selectors).length}</div>
      </div>
    `;
  }

  /**
   * Отрисовка истории выбора
   */
  private renderSelectionHistory(): string {
    return `
      <div class="pcb-selection-history">
        <div style="
          font-weight: 600;
          font-size: 14px;
          color: #666;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        ">
          История выбора:
          <button id="pcb-clear-history" style="
            font-size: 11px;
            color: #999;
            background: none;
            border: none;
            cursor: pointer;
          ">✖ Очистить</button>
        </div>
        
        <div class="pcb-history-list" id="pcb-history-list" style="
          display: flex;
          flex-direction: column;
          gap: 4px;
          max-height: 300px;
          overflow-y: auto;
        "></div>
      </div>
    `;
  }

  /**
   * Отрисовка редактора схемы
   */
  private renderSchemaEditor(): string {
    const config = this.currentConfig!;
    const fields = config.schema.fields;
    
    const fieldsHtml = fields.map(field => `
      <div class="pcb-schema-field" style="
        padding: 8px 12px;
        background: #f9f9f9;
        border-radius: 4px;
        margin-bottom: 8px;
        border-left: 3px solid ${field.required ? '#52c41a' : '#d9d9d9'};
      ">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div>
            <div style="font-weight: 600; font-size: 13px;">
              ${field.name} ${field.required ? '<span style="color: #ff4d4f;">*</span>' : ''}
            </div>
            <div style="font-size: 11px; color: #666;">${field.type}</div>
          </div>
          <div style="display: flex; gap: 4px;">
            <button class="pcb-edit-field" data-field="${field.name}" style="
              background: #1890ff;
              color: white;
              border: none;
              border-radius: 3px;
              padding: 4px 8px;
              cursor: pointer;
              font-size: 10px;
            ">✏️ Изм.</button>
            
            <button class="pcb-bind-selector" data-field="${field.name}" style="
              background: #52c41a;
              color: white;
              border: none;
              border-radius: 3px;
              padding: 4px 8px;
              cursor: pointer;
              font-size: 10px;
            ">🔗 Связать</button>
            
            <button class="pcb-delete-field" data-field="${field.name}" style="
              background: #ff4d4f;
              color: white;
              border: none;
              border-radius: 3px;
              padding: 4px 8px;
              cursor: pointer;
              font-size: 10px;
            ">✖</button>
          </div>
        </div>
      </div>
    `).join('');
    
    return `
      <div class="pcb-content" style="flex: 1; padding: 16px;">
        <div class="pcb-section-tabs" style="
          display: flex;
          border-bottom: 1px solid #e9ecef;
          margin-bottom: 16px;
        ">
          <button class="pcb-tab" data-section="main" style="
            padding: 8px 16px;
            background: none;
            border: none;
            border-bottom: 2px solid transparent;
            color: #666;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
          ">ℹ️ Обзор</button>
          
          <button class="pcb-tab active" data-section="schema" style="
            padding: 8px 16px;
            background: none;
            border: none;
            border-bottom: 2px solid #1890ff;
            color: #1890ff;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
          ">📄 Схема (${config.schema.fields.length})</button>
        </div>
        
        <div style="margin-bottom: 16px;">
          <button id="pcb-add-field" style="
            width: 100%;
            padding: 10px;
            background: #52c41a;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 600;
          ">➕ Добавить поле</button>
        </div>
        
        <div class="pcb-schema-fields">
          ${fieldsHtml}
        </div>
      </div>
    `;
  }

  /**
   * Отрисовка редактора селектора
   */
  private renderSelectorEditor(): string {
    const config = this.currentConfig!;
    const fieldName = this.selectedField!;
    const field = config.schema.fields.find(f => f.name === fieldName);
    const selector = config.selectors[fieldName] || this.getDefaultSelectorConfig();
    
    const extractionTypes = ['text', 'attribute', 'html', 'array', 'count', 'exists'];
    const typeOptions = extractionTypes.map(type => 
      `<option value="${type}" ${selector.type === type ? 'selected' : ''}>${this.getExtractionTypeLabel(type)}</option>`
    ).join('');
    
    const fallbackItems = selector.fallback.map((fb, index) => `
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
        <input type="text" value="${fb}" data-fallback-index="${index}" style="
          flex: 1;
          padding: 4px 8px;
          border: 1px solid #d9d9d9;
          border-radius: 3px;
          font-size: 12px;
          font-family: monospace;
        ">
        <button class="pcb-remove-fallback" data-index="${index}" style="
          background: #ff4d4f;
          color: white;
          border: none;
          border-radius: 3px;
          padding: 4px 6px;
          cursor: pointer;
          font-size: 10px;
        ">✖</button>
      </div>
    `).join('');
    
    return `
      <div class="pcb-content" style="flex: 1; padding: 16px;">
        <div style="margin-bottom: 16px;">
          <button id="pcb-back-to-main" style="
            background: none;
            border: none;
            color: #1890ff;
            cursor: pointer;
            font-size: 13px;
          ">← Обратно</button>
        </div>
        
        <div class="pcb-selector-editor">
          <h3 style="margin: 0 0 16px 0; font-size: 16px;">✏️ Редактор селектора</h3>
          
          <div style="margin-bottom: 12px;">
            <label style="display: block; font-size: 12px; font-weight: 600; color: #666; margin-bottom: 4px;">
              Поле: ${fieldName} (${field?.type || 'unknown'})
            </label>
          </div>
          
          <div style="margin-bottom: 12px;">
            <label style="display: block; font-size: 12px; font-weight: 600; color: #666; margin-bottom: 4px;">
              Основной селектор:
            </label>
            <input type="text" id="pcb-primary-selector" value="${selector.primary}" style="
              width: 100%;
              padding: 8px;
              border: 1px solid #d9d9d9;
              border-radius: 4px;
              font-size: 13px;
              font-family: monospace;
            ">
          </div>
          
          <div style="margin-bottom: 12px;">
            <label style="display: block; font-size: 12px; font-weight: 600; color: #666; margin-bottom: 4px;">
              Тип извлечения:
            </label>
            <select id="pcb-extraction-type" style="
              width: 100%;
              padding: 8px;
              border: 1px solid #d9d9d9;
              border-radius: 4px;
              font-size: 13px;
            ">
              ${typeOptions}
            </select>
          </div>
          
          ${selector.type === 'attribute' ? `
          <div style="margin-bottom: 12px;">
            <label style="display: block; font-size: 12px; font-weight: 600; color: #666; margin-bottom: 4px;">
              Название атрибута:
            </label>
            <input type="text" id="pcb-attribute-name" value="${selector.attribute || ''}" 
              placeholder="например: href, data-id, value" style="
              width: 100%;
              padding: 8px;
              border: 1px solid #d9d9d9;
              border-radius: 4px;
              font-size: 13px;
            ">
          </div>
          ` : ''}
          
          <div style="margin-bottom: 12px;">
            <label style="display: block; font-size: 12px; font-weight: 600; color: #666; margin-bottom: 4px;">
              Fallback селекторы:
            </label>
            <div id="pcb-fallback-list">
              ${fallbackItems}
            </div>
            <button id="pcb-add-fallback" style="
              width: 100%;
              padding: 6px;
              background: #f0f0f0;
              border: 1px dashed #d9d9d9;
              border-radius: 4px;
              cursor: pointer;
              font-size: 12px;
              color: #666;
            ">➕ Добавить fallback</button>
          </div>
          
          <div style="display: flex; gap: 8px; margin-top: 20px;">
            <button id="pcb-preview-selector" style="
              flex: 1;
              padding: 10px;
              background: #faad14;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-size: 13px;
              font-weight: 600;
            ">🔍 Предпросмотр</button>
            
            <button id="pcb-save-selector" style="
              flex: 1;
              padding: 10px;
              background: #52c41a;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-size: 13px;
              font-weight: 600;
            ">✅ Сохранить</button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Отрисовка подвала
   */
  private renderFooter(): string {
    return `
      <div class="pcb-sidebar-footer" style="
        padding: 16px;
        border-top: 1px solid #f0f0f0;
        background: #fafafa;
        font-size: 11px;
        color: #999;
        text-align: center;
      ">
        Parser Config Builder v1.0.0
      </div>
    `;
  }

  // ... остальные методы будут добавлены в следующем коммите
}