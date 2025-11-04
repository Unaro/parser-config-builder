/**
 * Config Sidebar - полноценный Selector Editor с очисткой подсветок + UX улучшения
 */

import type { 
  ParserConfig, 
  ElementSelectedMessage, 
  PageType,
  TestResult 
} from '@/types';
import type { SelectorConfig } from '@/types/selector';
import type { SchemaField } from '@/types/schema';
import { SidebarUIMethods } from './config-sidebar-methods';
import { getPageTypeLabel } from './config-sidebar-helpers';
import { queryCount, validateSelector } from '@/utils/selector';

export class ConfigSidebar {
  private isVisible = false;
  private sidebarElement: HTMLElement | null = null;
  private currentConfig: ParserConfig | null = null;
  private currentSection: 'main' | 'schema' | 'selector' = 'main';
  private selectedField: string | null = null;
  private selectionHistory: ElementSelectedMessage[] = [];
  private onMessage: (message: any) => void;
  private lastPreviewResults: any[] = [];

  constructor(onMessage: (message: any) => void) {
    this.onMessage = onMessage;
    console.log('ConfigSidebar: Initialized');
  }

  private cleanupHighlights(): void {
    try {
      this.onMessage({ type: 'CLEAR_HIGHLIGHTS', id: `sidebar_${Date.now()}`, timestamp: Date.now() });
    } catch {}
  }

  private switchSection(newSection: 'main'|'schema'|'selector'): void {
    if (this.currentSection === newSection) return;
    this.cleanupHighlights();
    this.currentSection = newSection;
    if (newSection !== 'selector') this.selectedField = null;
    this.updateSidebarContent();
  }

  public show(): void {
    if (this.isVisible) return;
    this.createSidebar();
    this.isVisible = true;
    console.log('ConfigSidebar: Shown');
  }

  public hide(): void {
    if (!this.isVisible || !this.sidebarElement) return;
    this.cleanupHighlights();
    this.sidebarElement.remove();
    this.sidebarElement = null;
    this.isVisible = false;
    this.currentSection = 'main';
    this.selectedField = null;
    this.lastPreviewResults = [];
    console.log('ConfigSidebar: Hidden');
  }

  public updateConfig(config: ParserConfig): void {
    this.currentConfig = config;
    if (this.isVisible) {
      this.updateSidebarContent();
    }
    console.log('ConfigSidebar: Config updated', config.platform.name);
  }

  public notifyElementSelected(message: ElementSelectedMessage): void {
    console.log('ConfigSidebar: Element selected notification', message);
    this.showNotification(
      `✅ Элемент выбран для поля "${message.fieldName}"`,
      'success'
    );
    this.addToSelectionHistory(message);
    if (this.selectedField === message.fieldName) {
      this.openSelectorEditor(message.fieldName, message.selector);
      this.autoFillSelectorForm(message.selector);
    }
  }

  public notifySelectionCancelled(fieldName: string): void {
    console.log('ConfigSidebar: Selection cancelled for field', fieldName);
    this.showNotification(
      `❌ Выбор элемента для поля "${fieldName}" отменён`,
      'warning'
    );
  }

  public notifyTestResults(results: TestResult[]): void {
    console.log('ConfigSidebar: Test results', results);
    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;
    this.showNotification(
      `🧪 Тест завершён: ${successCount}/${totalCount} селекторов работают`,
      successCount === totalCount ? 'success' : 'warning'
    );
    this.updateTestResults(results);
  }

  private showNotification(text: string, type: 'success'|'error'|'warning' = 'success') {
    SidebarUIMethods.showNotification(text, type);
  }

  private addToSelectionHistory(message: ElementSelectedMessage) {
    this.selectionHistory.push(message);
    if (this.selectionHistory.length > 10) this.selectionHistory.shift();
    this.updateHistoryDisplay();
  }

  private updateTestResults(results: TestResult[]) {
    const container = this.sidebarElement?.querySelector('.pcb-content');
    if (!container) return;
    const html = SidebarUIMethods.renderTestResults(results);
    const existing = this.sidebarElement!.querySelector('#pcb-test-results');
    if (existing) existing.remove();
    const wrap = document.createElement('div');
    wrap.id = 'pcb-test-results';
    wrap.innerHTML = html;
    container.appendChild(wrap);
  }

  private openSelectorEditor(fieldName: string, selector?: any): void {
    this.selectedField = fieldName;
    this.currentSection = 'selector';
    this.lastPreviewResults = [];
    this.updateSidebarContent();
  }

  private updateSidebarContent(): void {
    if (!this.sidebarElement || !this.currentConfig) return;
    this.sidebarElement.innerHTML = this.renderSidebar();
    this.bindEventListeners();
  }

  private renderSidebar(): string {
    return [
      this.renderHeader(),
      this.renderControlPanel(),
      this.renderMainContent(),
      this.renderFooter()
    ].join('');
  }

  private renderHeader(): string {
    const config = this.currentConfig!;
    return `
      <div class="pcb-sidebar-header" style="
        padding: 16px;
        background: linear-gradient(135deg, #1890ff 0%, #52c41a 100%);
        color: white;
        font-weight: 600;
        font-size: 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      ">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="
            width: 32px;
            height: 32px;
            background: rgba(255,255,255,0.2);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
          ">🔧</div>
          <div>
            <div style="font-size: 16px; font-weight: 600;">Parser Builder</div>
            <div style="font-size: 11px; opacity: 0.8;">${config.platform.name}</div>
          </div>
        </div>
        <button id="pcb-close-btn" style="
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          width: 28px;
          height: 28px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s;
        " onmouseover="this.style.backgroundColor='rgba(255,255,255,0.3)'" onmouseout="this.style.backgroundColor='rgba(255,255,255,0.2)'">×</button>
      </div>
    `;
  }

  private renderControlPanel(): string {
    const config = this.currentConfig!;
    const pageTypes: PageType[] = ['work_detail', 'work_list', 'chapter_list', 'chapter_read', 'team_profile', 'user_profile'];
    const pageTypeOptions = pageTypes.map(type => 
      `<option value="${type}" ${config.pageType === type ? 'selected' : ''}>${getPageTypeLabel(type)}</option>`
    ).join('');

    return `
      <div class="pcb-control-panel" style="
        padding: 20px;
        background: #fafafa;
        border-bottom: 1px solid #e8e8e8;
      ">
        <div style="margin-bottom: 20px;">
          <label style="display: block; font-size: 13px; font-weight: 600; color: #333; margin-bottom: 8px;">
            📄 Тип страницы:
          </label>
          <select id="pcb-page-type" style="
            width: 100%;
            padding: 10px 12px;
            border: 2px solid #e8e8e8;
            border-radius: 8px;
            font-size: 14px;
            background: white;
            cursor: pointer;
            transition: border-color 0.2s;
          " onfocus="this.style.borderColor='#1890ff'" onblur="this.style.borderColor='#e8e8e8'">
            ${pageTypeOptions}
          </select>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
          <button id="pcb-start-selection" class="pcb-btn-primary" style="
            padding: 12px 16px;
            background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%);
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            transition: transform 0.2s, box-shadow 0.2s;
            box-shadow: 0 2px 4px rgba(82, 196, 26, 0.3);
          " onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 8px rgba(82, 196, 26, 0.4)'" onmouseout="this.style.transform=''; this.style.boxShadow='0 2px 4px rgba(82, 196, 26, 0.3)'">
            🎯 Выбрать поле
          </button>
          
          <button id="pcb-stop-selection" class="pcb-btn-secondary" style="
            padding: 12px 16px;
            background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            transition: transform 0.2s, box-shadow 0.2s;
            box-shadow: 0 2px 4px rgba(255, 77, 79, 0.3);
          " onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 8px rgba(255, 77, 79, 0.4)'" onmouseout="this.style.transform=''; this.style.boxShadow='0 2px 4px rgba(255, 77, 79, 0.3)'">
            ⏹️ Остановить
          </button>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <button id="pcb-test-config" class="pcb-btn-outline" style="
            padding: 12px 16px;
            background: white;
            color: #1890ff;
            border: 2px solid #1890ff;
            border-radius: 8px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            transition: all 0.2s;
          " onmouseover="this.style.backgroundColor='#1890ff'; this.style.color='white'" onmouseout="this.style.backgroundColor='white'; this.style.color='#1890ff'">
            🧪 Тест
          </button>
          
          <button id="pcb-export-config" class="pcb-btn-outline" style="
            padding: 12px 16px;
            background: white;
            color: #722ed1;
            border: 2px solid #722ed1;
            border-radius: 8px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            transition: all 0.2s;
          " onmouseover="this.style.backgroundColor='#722ed1'; this.style.color='white'" onmouseout="this.style.backgroundColor='white'; this.style.color='#722ed1'">
            📥 Экспорт
          </button>
        </div>
      </div>
    `;
  }

  private renderMainContent(): string {
    switch (this.currentSection) {
      case 'schema': return this.renderSchemaEditor();
      case 'selector': return this.renderSelectorEditor();
      default: return this.renderMainSection();
    }
  }

  private renderMainSection(): string {
    const config = this.currentConfig!;
    return `
      <div class="pcb-content" style="flex: 1; padding: 20px; background: white;">
        <div class="pcb-section-tabs" style="display: flex; border-bottom: 2px solid #f0f0f0; margin-bottom: 24px; gap: 4px;">
          <button class="pcb-tab active" data-section="main" style="padding: 12px 20px; background: #1890ff; color: white; border: none; border-radius: 8px 8px 0 0; font-size: 14px; font-weight: 600; cursor: pointer; position: relative; top: 2px;">ℹ️ Обзор</button>
          <button class="pcb-tab" data-section="schema" style="padding: 12px 20px; background: #f8f9fa; color: #666; border: none; border-radius: 8px 8px 0 0; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.backgroundColor='#e6f7ff'; this.style.color='#1890ff'" onmouseout="this.style.backgroundColor='#f8f9fa'; this.style.color='#666'">📄 Схема (${config.schema.fields.length})</button>
        </div>
        ${this.renderConfigInfo()}
        ${this.renderSelectionHistory()}
      </div>
    `;
  }

  private renderConfigInfo(): string {
    const config = this.currentConfig!;
    return `
      <div class="pcb-config-info" style="padding: 20px; background: linear-gradient(135deg, #e6f7ff 0%, #f6ffed 100%); border: 2px solid #d9f7be; border-radius: 12px; font-size: 14px; margin-bottom: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <div>
            <div style="color: #666; font-size: 12px; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Платформа</div>
            <div style="font-weight: 600; color: #1890ff;">${config.platform.name}</div>
            <div style="font-size: 12px; color: #999; margin-top: 2px;">${config.platform.domain}</div>
          </div>
          <div>
            <div style="color: #666; font-size: 12px; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Тип</div>
            <div style="font-weight: 600; color: #52c41a;">${getPageTypeLabel(config.pageType)}</div>
          </div>
        </div>
        <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #d9f7be;">
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; text-align: center;">
            <div>
              <div style="font-size: 20px; font-weight: 700; color: #1890ff;">${config.schema.fields.length}</div>
              <div style="font-size: 12px; color: #666;">Полей</div>
            </div>
            <div>
              <div style="font-size: 20px; font-weight: 700; color: #52c41a;">${Object.keys(config.selectors).length}</div>
              <div style="font-size: 12px; color: #666;">Селекторов</div>
            </div>
            <div>
              <div style="font-size: 20px; font-weight: 700; color: #722ed1;">${this.selectionHistory.length}</div>
              <div style="font-size: 12px; color: #666;">Выбрано</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private renderSelectionHistory(): string {
    return `
      <div class="pcb-selection-history">
        <div style="font-weight: 600; font-size: 16px; color: #333; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between;">
          <span style="display: flex; align-items: center; gap: 8px;">📋 История выбора</span>
          <button id="pcb-clear-history" style="font-size: 12px; color: #999; background: none; border: 1px solid #e8e8e8; border-radius: 6px; padding: 4px 8px; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.borderColor='#ff4d4f'; this.style.color='#ff4d4f'" onmouseout="this.style.borderColor='#e8e8e8'; this.style.color='#999'">🗑️ Очистить</button>
        </div>
        <div class="pcb-history-list" id="pcb-history-list" style="display: flex; flex-direction: column; gap: 8px; max-height: 300px; overflow-y: auto;"></div>
        ${this.selectionHistory.length === 0 ? `<div style="text-align: center; padding: 40px 20px; color: #999; font-size: 14px;"><div style="font-size: 48px; margin-bottom: 16px; opacity: 0.3;">🎯</div>Начните выбирать элементы для полей схемы</div>` : ''}
      </div>
    `;
  }

  private renderSchemaEditor(): string {
    const config = this.currentConfig!;
    const fields = config.schema.fields;
    return `
      <div class="pcb-content" style="flex: 1; padding: 20px; background: white;">
        <div class="pcb-section-tabs" style="display: flex; border-bottom: 2px solid #f0f0f0; margin-bottom: 24px; gap: 4px;">
          <button class="pcb-tab" data-section="main" style="padding: 12px 20px; background: #f8f9fa; color: #666; border: none; border-radius: 8px 8px 0 0; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.backgroundColor='#e6f7ff'; this.style.color='#1890ff'" onmouseout="this.style.backgroundColor='#f8f9fa'; this.style.color='#666'">ℹ️ Обзор</button>
          <button class="pcb-tab active" data-section="schema" style="padding: 12px 20px; background: #1890ff; color: white; border: none; border-radius: 8px 8px 0 0; font-size: 14px; font-weight: 600; cursor: pointer; position: relative; top: 2px;">📄 Схема (${fields.length})</button>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding: 16px; background: #fafafa; border-radius: 8px; border: 1px solid #f0f0f0;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-weight: 600; color: #333;">Поля схемы:</span>
            <span style="color: #1890ff; font-weight: 600;">${fields.length} полей</span>
          </div>
          <button id="pcb-add-field" style="background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%); color: white; border: none; padding: 10px 16px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 6px; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform=''">➕ Добавить поле</button>
        </div>
        <div class="pcb-fields-list" id="pcb-fields-list">
          ${fields.length === 0 ? this.renderEmptyFieldsState() : fields.map((field, index) => this.renderFieldCard(field, index)).join('')}
        </div>
      </div>
    `;
  }
  
  private renderEmptyFieldsState(): string {
    return `
      <div style="text-align: center; padding: 60px 20px; color: #999; background: #fafafa; border-radius: 12px; border: 2px dashed #e8e8e8;">
        <div style="font-size: 64px; margin-bottom: 20px; opacity: 0.3;">📄</div>
        <div style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">Поля схемы отсутствуют</div>
        <div style="font-size: 14px; color: #666; margin-bottom: 20px;">Добавьте первое поле, чтобы начать конфигурирование</div>
        <button id="pcb-add-first-field" style="background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%); color: white; border: none; padding: 14px 24px; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; display: inline-flex; align-items: center; gap: 8px; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform=''">➕ Добавить первое поле</button>
      </div>
    `;
  }
  
  private renderFieldCard(field: SchemaField, index: number): string {
    const config = this.currentConfig!;
    const hasSelector = config.selectors[field.name];
    const selectorStatus = hasSelector ? '✅ Привязан' : '⚪ Не привязан';
    const selectorColor = hasSelector ? '#52c41a' : '#d9d9d9';
    
    return `
      <div class="pcb-field-card" data-field-name="${field.name}" style="background: white; border: 2px solid #f0f0f0; border-radius: 12px; padding: 16px; margin-bottom: 12px; transition: all 0.2s; cursor: pointer; position: relative;" onmouseover="this.style.borderColor='#1890ff'; this.style.boxShadow='0 4px 12px rgba(24, 144, 255, 0.1)'" onmouseout="this.style.borderColor='#f0f0f0'; this.style.boxShadow=''">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
          <div style="flex: 1;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
              <span style="font-size: 16px; font-weight: 600; color: #333;">${field.name}</span>
              ${field.required ? '<span style="color: #ff4d4f; font-size: 12px; font-weight: 600;">*</span>' : ''}
            </div>
            <div style="display: flex; align-items: center; gap: 12px; font-size: 13px;">
              <span style="background: #f0f0f0; color: #666; padding: 2px 8px; border-radius: 4px; font-weight: 600;">${field.type}</span>
              <span style="color: ${selectorColor}; font-weight: 600;">${selectorStatus}</span>
            </div>
            ${field.description ? `<div style="color: #999; font-size: 12px; margin-top: 6px; font-style: italic;">${field.description}</div>` : ''}
          </div>
          <div class="pcb-field-menu" style="display: flex; align-items: center; gap: 4px;">
            <button class="pcb-field-action" data-action="bind" data-field="${field.name}" style="background: ${hasSelector ? '#52c41a' : '#1890ff'}; color: white; border: none; width: 32px; height: 32px; border-radius: 6px; cursor: pointer; font-size: 14px; display: flex; align-items: center; justify-content: center; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform=''" title="${hasSelector ? 'Редактировать селектор' : 'Привязать селектор'}">${hasSelector ? '⚙️' : '🎯'}</button>
            <button class="pcb-field-action" data-action="edit" data-field="${field.name}" style="background: #faad14; color: white; border: none; width: 32px; height: 32px; border-radius: 6px; cursor: pointer; font-size: 14px; display: flex; align-items: center; justify-content: center; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform=''" title="Редактировать поле">✏️</button>
            <button class="pcb-field-action" data-action="delete" data-field="${field.name}" style="background: #ff4d4f; color: white; border: none; width: 32px; height: 32px; border-radius: 6px; cursor: pointer; font-size: 14px; display: flex; align-items: center; justify-content: center; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform=''" title="Удалить поле">🗑️</button>
          </div>
        </div>
        ${hasSelector ? `
          <div style="font-size: 11px; color: #666; background: #f8f9fa; padding: 8px 12px; border-radius: 6px; font-family: monospace; border-left: 3px solid ${selectorColor}; margin-top: 8px; word-break: break-all;">
            ${(config.selectors[field.name] as any)?.primary?.substring(0, 60) || 'selector'}${((config.selectors[field.name] as any)?.primary?.length || 0) > 60 ? '...' : ''}
          </div>
        ` : ''}
      </div>
    `;
  }
  
  private renderSelectorEditor(): string {
    const fieldName = this.selectedField!;
    const config = this.currentConfig!;
    const field = config.schema.fields.find(f => f.name === fieldName);
    if (!field) return '<div style="padding: 20px; color: #ff4d4f;">Поле не найдено</div>';
    
    const existing = config.selectors[fieldName] as SelectorConfig | undefined;
    
    // ДРУЖЕЛЮБНЫЕ НАЗВАНИЯ ТИПОВ ИЗВЛЕЧЕНИЯ
    const typeLabels = {
      text: '📄 Текст внутри',
      attribute: '🔗 Ссылка/адрес (атрибут)',
      html: '🌐 HTML код',
      array: '📋 Список элементов',
      count: '🔢 Количество',
      exists: '✅ Есть/нет'
    };
    
    const typeOptions = ['text', 'attribute', 'html', 'array', 'count', 'exists']
      .map(t => `<option value="${t}" ${existing?.type === t ? 'selected' : ''}>${typeLabels[t as keyof typeof typeLabels] || t}</option>`).join('');
    const primary = existing?.primary ?? '';
    const attrName = existing?.type === 'attribute' ? ((existing as any).attribute ?? 'value') : 'value';
    const fallback = ((existing as any)?.fallback ?? []).map((v: string, i: number) =>
      `<div class="pcb-fallback-item" data-index="${i}" style="display:flex;gap:8px;align-items:center;margin-bottom:6px;">
        <input type="text" value="${v.replace(/"/g, '&quot;')}" class="pcb-fallback-input" style="flex:1;padding:8px;border:1px solid #e8e8e8;border-radius:6px;font-family:monospace;font-size:12px;" />
        <button class="pcb-remove-fallback btn btn--danger btn--small" data-index="${i}">✖</button>
      </div>`).join('');
    
    return `
      <div class="pcb-content" style="flex: 1; padding: 20px; background: white;">
        <div class="pcb-breadcrumbs" style="font-size: 13px; color: #666; margin-bottom: 16px; padding: 12px 16px; background: #f8f9fa; border-radius: 8px; display: flex; align-items: center; gap: 8px;">
          <button class="pcb-breadcrumb" data-section="main" style="background: none; border: none; color: #1890ff; cursor: pointer; text-decoration: underline; font-size: 13px;">Обзор</button>
          <span>›</span>
          <button class="pcb-breadcrumb" data-section="schema" style="background: none; border: none; color: #1890ff; cursor: pointer; text-decoration: underline; font-size: 13px;">Схема</button>
          <span>›</span>
          <span style="font-weight: 600; color: #333;">Селектор: ${fieldName}</span>
        </div>
        <div style="margin-bottom: 20px;">
          <button id="pcb-back-to-schema" class="btn btn--outline" style="display: flex; align-items: center; gap: 8px; padding: 10px 16px; background: white; color: #666; border: 2px solid #e8e8e8; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.borderColor='#1890ff'; this.style.color='#1890ff'" onmouseout="this.style.borderColor='#e8e8e8'; this.style.color='#666'">← Назад к схеме</button>
        </div>
        <div style="background: #f6ffed; border: 2px solid #b7eb8f; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <div style="font-weight: 600; color: #52c41a; margin-bottom: 8px;">Настройка селектора для поля: ${fieldName}</div>
          <div style="font-size: 13px; color: #666;">Тип поля: <strong>${field.type}</strong> ${field.required ? '• <span style="color: #ff4d4f;">обязательное</span>' : ''}</div>
          ${field.description ? `<div style="font-size: 12px; color: #999; margin-top: 4px; font-style: italic;">${field.description}</div>` : ''}
        </div>
        <div class="pcb-selector-form" style="display: grid; gap: 20px;">
          <div>
            <label style="display: block; font-weight: 600; color: #333; margin-bottom: 8px;">🎯 Основной селектор</label>
            <div style="display: flex; gap: 8px;">
              <input id="pcb-primary-selector" type="text" value="${primary.replace(/"/g, '&quot;')}" placeholder="Например, #mangaBox > div.content > h1.title" style="flex: 1; padding: 12px; border: 2px solid #e8e8e8; border-radius: 8px; font-family: monospace; font-size: 13px;" />
              <button id="pcb-pick-new-element" class="btn btn--secondary" style="padding: 12px 14px; white-space: nowrap; background: #52c41a; color: white; border: none; font-weight: 600;">🎯 Выбрать элемент</button>
              <button id="pcb-preview-selector" class="btn btn--outline" style="padding: 12px 16px; white-space: nowrap;">🔍 Предпросмотр</button>
            </div>
            <div id="pcb-preview-results" style="margin-top: 8px;"></div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div>
              <label style="display: block; font-weight: 600; color: #333; margin-bottom: 8px;">⚙️ Тип извлечения</label>
              <select id="pcb-extraction-type" style="width: 100%; padding: 12px; border: 2px solid #e8e8e8; border-radius: 8px; font-size: 14px;">${typeOptions}</select>
              <div id="pcb-extract-tip" style="font-size: 12px; color: #666; margin-top: 6px; min-height: 16px;"></div>
            </div>
            <div id="pcb-attribute-wrap" style="${existing?.type === 'attribute' ? '' : 'display:none;'}">
              <label style="display: block; font-weight: 600; color: #333; margin-bottom: 8px;">📋 Атрибут</label>
              <input id="pcb-attribute-name" type="text" value="${attrName}" placeholder="value / href / src" style="width: 100%; padding: 12px; border: 2px solid #e8e8e8; border-radius: 8px; font-size: 14px;" />
            </div>
          </div>
          <div>
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
              <label style="font-weight: 600; color: #333;">🔄 Fallback селекторы</label>
              <button id="pcb-add-fallback" class="btn btn--secondary btn--small">➕ Добавить</button>
            </div>
            <div id="pcb-fallback-list">${fallback}</div>
            ${fallback === '' ? '<div style="text-align: center; padding: 20px; color: #999; font-size: 13px;">Fallback селекторы отсутствуют</div>' : ''}
          </div>
          <div style="display: flex; gap: 12px; justify-content: flex-end; padding-top: 16px; border-top: 1px solid #f0f0f0;">
            <button id="pcb-clear-selector" class="btn btn--outline">♻️ Очистить</button>
            <button id="pcb-save-selector" class="btn btn--primary">💾 Сохранить селектор</button>
          </div>
        </div>
      </div>
    `;
  }

  private renderFooter(): string {
    return `
      <div class="pcb-sidebar-footer" style="padding: 16px 20px; border-top: 1px solid #f0f0f0; background: #fafafa; font-size: 12px; color: #999; text-align: center; display: flex; align-items: center; justify-content: space-between;">
        <div>Parser Config Builder v1.0.0</div>
        <div style="display: flex; align-items: center; gap: 8px;"><span>✨</span><span>${new Date().getFullYear()}</span></div>
      </div>
    `;
  }

  private createSidebar(): void {
    if (this.sidebarElement) return;
    this.sidebarElement = document.createElement('div');
    this.sidebarElement.id = 'pcb-sidebar';
    this.sidebarElement.className = 'pcb-sidebar pcb-ui';
    this.sidebarElement.style.cssText = `
      position: fixed;
      top: 0;
      right: 0;
      width: 420px;
      height: 100vh;
      background: white;
      border-left: 2px solid #1890ff;
      box-shadow: -4px 0 20px rgba(0, 0, 0, 0.15);
      z-index: 999998;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      animation: slideInRight 0.3s ease-out;
    `;
    if (!document.getElementById('pcb-sidebar-animations')) {
      const style = document.createElement('style');
      style.id = 'pcb-sidebar-animations';
      style.textContent = '@keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }';
      document.head.appendChild(style);
    }
    document.body.appendChild(this.sidebarElement);
    this.updateSidebarContent();
  }

  private bindEventListeners(): void {
    if (!this.sidebarElement) return;
    const closeBtn = this.sidebarElement.querySelector('#pcb-close-btn');
    if (closeBtn) closeBtn.addEventListener('click', () => this.hide());
    this.bindControlPanelEvents();
    this.bindTabEvents();
    this.bindMainSectionEvents();
    this.bindSchemaEditorEvents();
    this.bindSelectorEditorEvents();
    this.bindBreadcrumbEvents();
  }

  private bindBreadcrumbEvents(): void {
    const breadcrumbs = this.sidebarElement!.querySelectorAll('.pcb-breadcrumb');
    breadcrumbs.forEach(crumb => {
      crumb.addEventListener('click', (e) => {
        const section = (e.target as HTMLElement).getAttribute('data-section') as any;
        this.switchSection(section);
      });
    });
    const backBtn = this.sidebarElement!.querySelector('#pcb-back-to-schema');
    if (backBtn) backBtn.addEventListener('click', () => this.switchSection('schema'));
  }

  private bindControlPanelEvents(): void {
    const pageTypeSelect = this.sidebarElement!.querySelector('#pcb-page-type') as HTMLSelectElement;
    if (pageTypeSelect) {
      pageTypeSelect.addEventListener('change', (e) => {
        const pageType = (e.target as HTMLSelectElement).value as PageType;
        this.onMessage({ type: 'UPDATE_PAGE_TYPE', pageType, id: `sidebar_${Date.now()}`, timestamp: Date.now() });
      });
    }
    const startBtn = this.sidebarElement!.querySelector('#pcb-start-selection');
    if (startBtn) startBtn.addEventListener('click', () => this.showFieldSelectionPrompt());
    const stopBtn = this.sidebarElement!.querySelector('#pcb-stop-selection');
    if (stopBtn) stopBtn.addEventListener('click', () => {
      this.cleanupHighlights();
      this.onMessage({ type: 'STOP_SELECTION', id: `sidebar_${Date.now()}`, timestamp: Date.now() });
    });
    const testBtn = this.sidebarElement!.querySelector('#pcb-test-config');
    if (testBtn) testBtn.addEventListener('click', () => { if (this.currentConfig) this.onMessage({ type: 'TEST_CONFIG', config: this.currentConfig, id: `sidebar_${Date.now()}`, timestamp: Date.now() }); });
    const exportBtn = this.sidebarElement!.querySelector('#pcb-export-config');
    if (exportBtn) exportBtn.addEventListener('click', () => this.exportConfig());
  }

  private bindTabEvents(): void {
    const tabs = this.sidebarElement!.querySelectorAll('.pcb-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        const section = (e.target as HTMLElement).getAttribute('data-section') as any;
        this.switchSection(section);
      });
    });
  }

  private bindMainSectionEvents(): void {
    const clearBtn = this.sidebarElement!.querySelector('#pcb-clear-history');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.selectionHistory = [];
        this.updateHistoryDisplay();
      });
    }
  }
  
  private bindSchemaEditorEvents(): void {
    const addFieldBtn = this.sidebarElement!.querySelector('#pcb-add-field, #pcb-add-first-field');
    if (addFieldBtn) addFieldBtn.addEventListener('click', () => this.showAddFieldDialog());
    
    const fieldActions = this.sidebarElement!.querySelectorAll('.pcb-field-action');
    fieldActions.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = (e.target as HTMLElement).getAttribute('data-action');
        const fieldName = (e.target as HTMLElement).getAttribute('data-field');
        if (!fieldName || !action) return;
        
        switch (action) {
          case 'bind': this.startFieldSelection(fieldName); break;
          case 'edit': this.showEditFieldDialog(fieldName); break;
          case 'delete': this.deleteField(fieldName); break;
        }
      });
    });
    
    const fieldCards = this.sidebarElement!.querySelectorAll('.pcb-field-card');
    fieldCards.forEach(card => {
      card.addEventListener('click', (e) => {
        const fieldName = (e.currentTarget as HTMLElement).getAttribute('data-field-name');
        if (fieldName && !this.currentConfig?.selectors[fieldName]) {
          this.startFieldSelection(fieldName);
        } else if (fieldName) {
          this.openSelectorEditor(fieldName);
        }
      });
    });
    
    const historyItems = this.sidebarElement!.querySelectorAll('.pcb-history-item');
    historyItems.forEach((item: Element) => {
      item.addEventListener('click', (e: Event) => {
        const fieldName = (e.currentTarget as HTMLElement).getAttribute('data-field-name');
        if (fieldName) this.openSelectorEditor(fieldName);
      });
    });
  }

  private bindSelectorEditorEvents(): void {
    if (!this.sidebarElement) return;
    
    const typeSelect = this.sidebarElement.querySelector('#pcb-extraction-type') as HTMLSelectElement | null;
    const attrWrap = this.sidebarElement.querySelector('#pcb-attribute-wrap') as HTMLElement | null;
    const previewBtn = this.sidebarElement.querySelector('#pcb-preview-selector');
    const saveBtn = this.sidebarElement.querySelector('#pcb-save-selector');
    const clearBtn = this.sidebarElement.querySelector('#pcb-clear-selector');
    const addFallbackBtn = this.sidebarElement.querySelector('#pcb-add-fallback');
    
    // НОВАЯ КНОПКА "Выбрать элемент" ПРЯМО В РЕДАКТОРЕ
    const pickBtn = this.sidebarElement.querySelector('#pcb-pick-new-element');
    if (pickBtn) {
      pickBtn.addEventListener('click', () => {
        if (!this.selectedField || !this.currentConfig) return;
        const field = this.currentConfig.schema.fields.find(f => f.name === this.selectedField);
        if (!field) return;
        this.onMessage({ type: 'START_SELECTION', fieldName: field.name, fieldType: field.type, id: `sidebar_${Date.now()}`, timestamp: Date.now() });
      });
    }
    
    // ПОДСКАЗКИ ДЛЯ ТИПОВ ИЗВЛЕЧЕНИЯ
    if (typeSelect) {
      const tips: Record<string,string> = {
        text: 'Извлекается видимый текст. Пример: "Моя манга"',
        attribute: 'Извлекается атрибут (href, src). Настройте справа →',
        html: 'Извлекается HTML содержимое элемента с тегами',
        array: 'Массив значений по всем совпавшим элементам',
        count: 'Число совпавших элементов. Пример: 42',
        exists: 'Возвращает true/false — найден ли хотя бы 1 элемент'
      };
      const updateTip = () => {
        const tip = this.sidebarElement?.querySelector('#pcb-extract-tip') as HTMLElement | null;
        if (tip) tip.textContent = tips[typeSelect.value] || '';
      };
      typeSelect.addEventListener('change', () => {
        if (attrWrap) attrWrap.style.display = typeSelect.value === 'attribute' ? '' : 'none';
        updateTip();
      });
      updateTip();
    }

    if (previewBtn) previewBtn.addEventListener('click', () => this.performDetailedPreview());
    if (saveBtn) saveBtn.addEventListener('click', () => this.saveSelector());
    if (clearBtn) clearBtn.addEventListener('click', () => this.clearSelectorForm());
    if (addFallbackBtn) addFallbackBtn.addEventListener('click', () => this.addFallbackSelector());

    const fallbackList = this.sidebarElement.querySelector('#pcb-fallback-list');
    if (fallbackList) {
      fallbackList.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (target.classList.contains('pcb-remove-fallback')) {
          const idx = Number(target.getAttribute('data-index'));
          this.removeFallbackSelector(idx);
        }
      });
    }
  }
  
  private performDetailedPreview(): void {
    const primaryInput = this.sidebarElement?.querySelector('#pcb-primary-selector') as HTMLInputElement | null;
    const typeSelect = this.sidebarElement?.querySelector('#pcb-extraction-type') as HTMLSelectElement | null;
    const attrInput = this.sidebarElement?.querySelector('#pcb-attribute-name') as HTMLInputElement | null;
    const resultsDiv = this.sidebarElement?.querySelector('#pcb-preview-results') as HTMLElement | null;
    
    if (!primaryInput || !resultsDiv) return;
    
    const selector = primaryInput.value.trim();
    if (!selector) {
      resultsDiv.innerHTML = '<div style="color: #faad14; font-size: 12px;">⚠️ Введите селектор</div>';
      return;
    }

    try {
      const elements = document.querySelectorAll(selector);
      const count = elements.length;
      const extractionType = typeSelect?.value || 'text';
      const attributeName = attrInput?.value || 'value';
      
      if (count === 0) {
        resultsDiv.innerHTML = `
          <div style="padding: 12px; background: #fff2f0; border: 1px solid #ffccc7; border-radius: 6px; margin-top: 8px;">
            <div style="color: #ff4d4f; font-weight: 600; font-size: 13px; margin-bottom: 4px;">❌ Элементы не найдены</div>
            <div style="color: #999; font-size: 12px;">Селектор не соответствует ни одному элементу на странице</div>
          </div>
        `;
        return;
      }
      
      const values: string[] = [];
      for (let i = 0; i < Math.min(count, 5); i++) {
        const el = elements[i];
        let value = '';
        
        switch (extractionType) {
          case 'text': value = el.textContent?.trim() || ''; break;
          case 'attribute': value = el.getAttribute(attributeName) || ''; break;
          case 'html': value = el.innerHTML || ''; break;
          case 'count': value = String(count); break;
          case 'exists': value = 'true'; break;
          default: value = el.textContent?.trim() || '';
        }
        
        values.push(value.length > 50 ? value.substring(0, 50) + '...' : value);
      }
      
      this.onMessage({ type: 'HIGHLIGHT_ELEMENT', selector, id: `sidebar_${Date.now()}`, timestamp: Date.now() });
      
      const statusColor = count === 1 ? '#52c41a' : count > 1 ? '#faad14' : '#ff4d4f';
      const statusText = count === 1 ? '✅ Уникальный' : `⚠️ ${count} элементов`;
      
      resultsDiv.innerHTML = `
        <div style="padding: 12px; background: ${count === 1 ? '#f6ffed' : '#fff7e6'}; border: 1px solid ${count === 1 ? '#d9f7be' : '#ffe58f'}; border-radius: 6px; margin-top: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="color: ${statusColor}; font-weight: 600; font-size: 13px;">${statusText}</span>
            <button id="pcb-copy-selector" style="background: none; border: 1px solid ${statusColor}; color: ${statusColor}; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 11px;" title="Скопировать селектор">📋</button>
          </div>
          ${count > 0 && values.length > 0 ? `
            <div style="margin-bottom: 8px;">
              <div style="font-size: 12px; color: #666; margin-bottom: 4px;">Извлеченные значения:</div>
              <div style="background: white; border: 1px solid #e8e8e8; border-radius: 4px; padding: 8px; font-family: monospace; font-size: 11px; max-height: 120px; overflow-y: auto; color: #333;">
                ${values.map((val, idx) => `<div style="margin-bottom: 2px;"><span style="color: #999;">[${idx + 1}]</span> "${val}"</div>`).join('')}
                ${count > 5 ? `<div style="color: #999; font-style: italic;">... и ещё ${count - 5}</div>` : ''}
              </div>
            </div>
          ` : ''}
          ${count > 1 ? `
            <button id="pcb-refine-selector" style="background: #faad14; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 600;">✨ Уточнить селектор</button>
          ` : ''}
        </div>
      `;
      
      const copyBtn = resultsDiv.querySelector('#pcb-copy-selector');
      if (copyBtn) {
        copyBtn.addEventListener('click', () => {
          navigator.clipboard.writeText(selector).then(() => {
            this.showNotification('Селектор скопирован', 'success');
          });
        });
      }
      
      const refineBtn = resultsDiv.querySelector('#pcb-refine-selector');
      if (refineBtn) refineBtn.addEventListener('click', () => this.refineSelector(selector));
      
    } catch (error) {
      resultsDiv.innerHTML = `
        <div style="padding: 12px; background: #fff2f0; border: 1px solid #ffccc7; border-radius: 6px; margin-top: 8px;">
          <div style="color: #ff4d4f; font-weight: 600; font-size: 13px;">❌ Ошибка CSS селектора</div>
          <div style="color: #999; font-size: 12px; margin-top: 4px;">${(error as Error).message}</div>
        </div>
      `;
    }
  }
  
  private refineSelector(baseSelector: string): void {
    const segments = baseSelector.split(' > ');
    const lastSegment = segments[segments.length - 1];
    
    if (!lastSegment.includes(':nth-child')) {
      const refined = baseSelector + ':nth-child(1)';
      const primaryInput = this.sidebarElement?.querySelector('#pcb-primary-selector') as HTMLInputElement | null;
      if (primaryInput) {
        primaryInput.value = refined;
        this.performDetailedPreview();
      }
    }
  }

  private saveSelector(): void {
    if (!this.selectedField || !this.currentConfig) return;

    const primaryInput = this.sidebarElement?.querySelector('#pcb-primary-selector') as HTMLInputElement | null;
    const typeSelect = this.sidebarElement?.querySelector('#pcb-extraction-type') as HTMLSelectElement | null;
    const attrInput = this.sidebarElement?.querySelector('#pcb-attribute-name') as HTMLInputElement | null;
    const fallbackInputs = this.sidebarElement?.querySelectorAll('.pcb-fallback-input') as NodeListOf<HTMLInputElement>;

    const primary = primaryInput?.value?.trim() ?? '';
    const type = typeSelect?.value ?? 'text';
    const attribute = type === 'attribute' ? (attrInput?.value?.trim() ?? 'value') : undefined;
    const fallbackList = Array.from(fallbackInputs).map(input => input.value.trim()).filter(v => v);

    if (!primary) {
      this.showNotification('Введите основной селектор', 'error');
      return;
    }

    const selectorConfig: SelectorConfig = {
      primary,
      type: type as any,
      ...(attribute ? { attribute } : {}),
      ...(fallbackList.length > 0 ? { fallback: fallbackList } : {})
    };

    this.onMessage({
      type: 'UPDATE_SELECTOR',
      fieldName: this.selectedField,
      selectorConfig,
      id: `sidebar_${Date.now()}`,
      timestamp: Date.now()
    });

    this.showNotification(`Селектор для поля "${this.selectedField}" сохранён`, 'success');
  }

  private clearSelectorForm(): void {
    const primaryInput = this.sidebarElement?.querySelector('#pcb-primary-selector') as HTMLInputElement | null;
    const typeSelect = this.sidebarElement?.querySelector('#pcb-extraction-type') as HTMLSelectElement | null;
    const attrInput = this.sidebarElement?.querySelector('#pcb-attribute-name') as HTMLInputElement | null;
    const attrWrap = this.sidebarElement?.querySelector('#pcb-attribute-wrap') as HTMLElement | null;
    const fallbackList = this.sidebarElement?.querySelector('#pcb-fallback-list') as HTMLElement | null;
    const resultsDiv = this.sidebarElement?.querySelector('#pcb-preview-results') as HTMLElement | null;

    if (primaryInput) primaryInput.value = '';
    if (typeSelect) typeSelect.value = 'text';
    if (attrInput) attrInput.value = 'value';
    if (attrWrap) attrWrap.style.display = 'none';
    if (fallbackList) fallbackList.innerHTML = '<div style="text-align: center; padding: 20px; color: #999; font-size: 13px;">Fallback селекторы отсутствуют</div>';
    if (resultsDiv) resultsDiv.innerHTML = '';
  }

  private addFallbackSelector(): void {
    const fallbackList = this.sidebarElement?.querySelector('#pcb-fallback-list') as HTMLElement | null;
    if (!fallbackList) return;

    const placeholder = fallbackList.querySelector('div');
    if (placeholder && placeholder.textContent?.includes('отсутствуют')) {
      placeholder.remove();
    }

    const existingItems = fallbackList.querySelectorAll('.pcb-fallback-item').length;
    const newIndex = existingItems;

    const itemHtml = `
      <div class="pcb-fallback-item" data-index="${newIndex}" style="display:flex;gap:8px;align-items:center;margin-bottom:6px;">
        <input type="text" value="" class="pcb-fallback-input" placeholder="Введите fallback селектор" style="flex:1;padding:8px;border:1px solid #e8e8e8;border-radius:6px;font-family:monospace;font-size:12px;" />
        <button class="pcb-remove-fallback btn btn--danger btn--small" data-index="${newIndex}">✖</button>
      </div>
    `;

    fallbackList.insertAdjacentHTML('beforeend', itemHtml);
  }

  private removeFallbackSelector(index: number): void {
    const item = this.sidebarElement?.querySelector(`[data-index="${index}"]`) as HTMLElement | null;
    if (item) item.remove();

    const fallbackList = this.sidebarElement?.querySelector('#pcb-fallback-list') as HTMLElement | null;
    if (fallbackList && fallbackList.children.length === 0) {
      fallbackList.innerHTML = '<div style="text-align: center; padding: 20px; color: #999; font-size: 13px;">Fallback селекторы отсутствуют</div>';
    }
  }

  private autoFillSelectorForm(selectorData: any): void {
    const primaryInput = this.sidebarElement?.querySelector('#pcb-primary-selector') as HTMLInputElement | null;
    if (primaryInput && selectorData.selector) {
      primaryInput.value = selectorData.selector;
      setTimeout(() => this.performDetailedPreview(), 100);
    }
  }

  private showFieldSelectionPrompt() { 
    if (!this.currentConfig) return; 
    SidebarUIMethods.showFieldSelectionPrompt(this.currentConfig, this.onMessage); 
  }
  
  private exportConfig() { 
    if (!this.currentConfig) return; 
    SidebarUIMethods.exportConfig(this.currentConfig); 
  }
  
  private updateHistoryDisplay() { 
    if (!this.sidebarElement) return; 
    const list = this.sidebarElement.querySelector('#pcb-history-list'); 
    if (!list) return; 
    list.innerHTML = this.selectionHistory.map((m: ElementSelectedMessage) => SidebarUIMethods.renderHistoryItem(m)).join(''); 
    const historyItems = this.sidebarElement!.querySelectorAll('.pcb-history-item'); 
    historyItems.forEach((item: Element) => { 
      item.addEventListener('click', (e: Event) => { 
        const fieldName = (e.currentTarget as HTMLElement).getAttribute('data-field-name'); 
        if (fieldName) this.openSelectorEditor(fieldName); 
      }); 
    }); 
  }
  
  private showAddFieldDialog() { 
    if (!this.currentConfig) return; 
    SidebarUIMethods.showAddFieldDialog(this.currentConfig, this.onMessage); 
  }
  
  private showEditFieldDialog(fieldName: string) { 
    if (!this.currentConfig) return; 
    SidebarUIMethods.showEditFieldDialog(this.currentConfig, fieldName, this.onMessage); 
  }
  
  private startFieldSelection(fieldName: string) { 
    if (!this.currentConfig) return; 
    const field = this.currentConfig.schema.fields.find((f: any) => f.name === fieldName); 
    if (!field) return; 
    SidebarUIMethods.startFieldSelection(fieldName, field.type, this.onMessage); 
    this.selectedField = fieldName; 
    this.currentSection = 'selector'; 
    this.updateSidebarContent(); 
  }
  
  private deleteField(fieldName: string) { 
    if (this.currentConfig) SidebarUIMethods.deleteField(this.currentConfig, fieldName, this.onMessage); 
  }
}
