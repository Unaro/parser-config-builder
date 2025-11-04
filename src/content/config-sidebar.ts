/**
 * Config Sidebar - боковая панель управления конфигурацией (полное UI)
 */

import type { 
  ParserConfig, 
  ElementSelectedMessage, 
  PageType,
  TestResult 
} from '@/types';
import type { SelectorConfig } from '@/types/selector';
import { SidebarUIMethods } from './config-sidebar-methods';
import {
  getPageTypeLabel,
  getExtractionTypeLabel,
  getDefaultSelectorConfig
} from './config-sidebar-helpers';

export class ConfigSidebar {
  private isVisible = false;
  private sidebarElement: HTMLElement | null = null;
  private currentConfig: ParserConfig | null = null;
  private currentSection: 'main' | 'schema' | 'selector' = 'main';
  private selectedField: string | null = null;
  private selectionHistory: ElementSelectedMessage[] = [];
  private onMessage: (message: any) => void;

  constructor(onMessage: (message: any) => void) {
    this.onMessage = onMessage;
    console.log('ConfigSidebar: Initialized');
  }

  public show(): void {
    if (this.isVisible) return;
    this.createSidebar();
    this.isVisible = true;
    console.log('ConfigSidebar: Shown');
  }

  public hide(): void {
    if (!this.isVisible || !this.sidebarElement) return;
    this.sidebarElement.remove();
    this.sidebarElement = null;
    this.isVisible = false;
    this.currentSection = 'main';
    this.selectedField = null;
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

  // === Обертки над UI методами ===
  private showNotification(text: string, type: 'success'|'error'|'warning' = 'success') {
    SidebarUIMethods.showNotification(text, type);
  }

  private addToSelectionHistory(message: ElementSelectedMessage) {
    this.selectionHistory.push(message);
    if (this.selectionHistory.length > 10) {
      this.selectionHistory.shift();
    }
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

  // === Полное UI рендеринг ===
  
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
        <!-- Тип страницы -->
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
        
        <!-- Основные действия -->
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
        
        <!-- Дополнительные действия -->
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
      case 'schema':
        return this.renderSchemaEditor();
      case 'selector':
        return this.renderSelectorEditor();
      default:
        return this.renderMainSection();
    }
  }

  private renderMainSection(): string {
    const config = this.currentConfig!;
    
    return `
      <div class="pcb-content" style="flex: 1; padding: 20px; background: white;">
        <!-- Навигация -->
        <div class="pcb-section-tabs" style="
          display: flex;
          border-bottom: 2px solid #f0f0f0;
          margin-bottom: 24px;
          gap: 4px;
        ">
          <button class="pcb-tab active" data-section="main" style="
            padding: 12px 20px;
            background: #1890ff;
            color: white;
            border: none;
            border-radius: 8px 8px 0 0;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            position: relative;
            top: 2px;
          ">ℹ️ Обзор</button>
          
          <button class="pcb-tab" data-section="schema" style="
            padding: 12px 20px;
            background: #f8f9fa;
            color: #666;
            border: none;
            border-radius: 8px 8px 0 0;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
          " onmouseover="this.style.backgroundColor='#e6f7ff'; this.style.color='#1890ff'" onmouseout="this.style.backgroundColor='#f8f9fa'; this.style.color='#666'">
            📄 Схема (${config.schema.fields.length})
          </button>
        </div>
        
        <!-- Информация о конфиге -->
        ${this.renderConfigInfo()}
        
        <!-- История выбора -->
        ${this.renderSelectionHistory()}
      </div>
    `;
  }

  private renderConfigInfo(): string {
    const config = this.currentConfig!;
    
    return `
      <div class="pcb-config-info" style="
        padding: 20px;
        background: linear-gradient(135deg, #e6f7ff 0%, #f6ffed 100%);
        border: 2px solid #d9f7be;
        border-radius: 12px;
        font-size: 14px;
        margin-bottom: 24px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      ">
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
        <div style="
          font-weight: 600;
          font-size: 16px;
          color: #333;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        ">
          <span style="display: flex; align-items: center; gap: 8px;">
            📋 История выбора
          </span>
          <button id="pcb-clear-history" style="
            font-size: 12px;
            color: #999;
            background: none;
            border: 1px solid #e8e8e8;
            border-radius: 6px;
            padding: 4px 8px;
            cursor: pointer;
            transition: all 0.2s;
          " onmouseover="this.style.borderColor='#ff4d4f'; this.style.color='#ff4d4f'" onmouseout="this.style.borderColor='#e8e8e8'; this.style.color='#999'">
            🗑️ Очистить
          </button>
        </div>
        
        <div class="pcb-history-list" id="pcb-history-list" style="
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 300px;
          overflow-y: auto;
        "></div>
        
        ${this.selectionHistory.length === 0 ? `
          <div style="
            text-align: center;
            padding: 40px 20px;
            color: #999;
            font-size: 14px;
          ">
            <div style="font-size: 48px; margin-bottom: 16px; opacity: 0.3;">🎯</div>
            Начните выбирать элементы для полей схемы
          </div>
        ` : ''}
      </div>
    `;
  }

  // === Плейсхолдеры для остальных секций ===
  
  private renderSchemaEditor(): string {
    return '<div style="padding: 20px;">Schema Editor будет добавлен в следующем коммите</div>';
  }
  
  private renderSelectorEditor(): string {
    return '<div style="padding: 20px;">Selector Editor будет добавлен в следующем коммите</div>';
  }

  private renderFooter(): string {
    return `
      <div class="pcb-sidebar-footer" style="
        padding: 16px 20px;
        border-top: 1px solid #f0f0f0;
        background: #fafafa;
        font-size: 12px;
        color: #999;
        text-align: center;
        display: flex;
        align-items: center;
        justify-content: space-between;
      ">
        <div>Parser Config Builder v1.0.0</div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span>✨</span>
          <span>${new Date().getFullYear()}</span>
        </div>
      </div>
    `;
  }

  // === Остальные методы ===
  
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
    
    // Добавляем анимацию
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideInRight {
        from { transform: translateX(100%); }
        to { transform: translateX(0); }
      }
    `;
    document.head.appendChild(style);

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
    if (stopBtn) stopBtn.addEventListener('click', () => this.onMessage({ type: 'STOP_SELECTION', id: `sidebar_${Date.now()}`, timestamp: Date.now() }));
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
        if (section !== this.currentSection) {
          this.currentSection = section;
          this.selectedField = null;
          this.updateSidebarContent();
        }
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
    const historyItems = this.sidebarElement!.querySelectorAll('.pcb-history-item');
    historyItems.forEach((item: Element) => {
      item.addEventListener('click', (e: Event) => {
        const fieldName = (e.currentTarget as HTMLElement).getAttribute('data-field-name');
        if (fieldName) this.openSelectorEditor(fieldName);
      });
    });
  }

  // === Методы-обертки ===
  private showFieldSelectionPrompt() { if (!this.currentConfig) return; SidebarUIMethods.showFieldSelectionPrompt(this.currentConfig, this.onMessage); }
  private exportConfig() { if (!this.currentConfig) return; SidebarUIMethods.exportConfig(this.currentConfig); }
  private updateHistoryDisplay() { if (!this.sidebarElement) return; const list = this.sidebarElement.querySelector('#pcb-history-list'); if (!list) return; list.innerHTML = this.selectionHistory.map((m: ElementSelectedMessage) => SidebarUIMethods.renderHistoryItem(m)).join(''); const historyItems = this.sidebarElement!.querySelectorAll('.pcb-history-item'); historyItems.forEach((item: Element) => { item.addEventListener('click', (e: Event) => { const fieldName = (e.currentTarget as HTMLElement).getAttribute('data-field-name'); if (fieldName) this.openSelectorEditor(fieldName); }); }); }
}
