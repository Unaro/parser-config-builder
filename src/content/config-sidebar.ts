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
    
    this.updateTestResults(results);
  }

  // === Обертки над UI методами ===
  private showNotification(text: string, type: 'success'|'error'|'warning' = 'success') {
    SidebarUIMethods.showNotification(text, type);
  }

  private addToSelectionHistory(message: ElementSelectedMessage) {
    this.selectionHistory.push(message);
    // Ограничиваем историю 10 записями
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

  // === Методы-обертки ===
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
    
    // Привязываем клики к новым элементам
    const historyItems = this.sidebarElement!.querySelectorAll('.pcb-history-item');
    historyItems.forEach((item: Element) => {
      item.addEventListener('click', (e: Event) => {
        const fieldName = (e.currentTarget as HTMLElement).getAttribute('data-field-name');
        if (fieldName) this.openSelectorEditor(fieldName);
      });
    });
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

  // === Опущено для краткости - будет добавлено в следующих коммитах ===
  
  private renderHeader(): string { return '<div>Header placeholder</div>'; }
  private renderControlPanel(): string { return '<div>Control panel placeholder</div>'; }
  private renderMainContent(): string { return '<div>Main content placeholder</div>'; }
  private renderFooter(): string { return '<div>Footer placeholder</div>'; }
  private bindEventListeners(): void { /* TODO */ }
  
  // Методы-плейсхолдеры для сборки
  private showAddFieldDialog() { if (this.currentConfig) SidebarUIMethods.showAddFieldDialog(this.currentConfig, this.onMessage); }
  private showEditFieldDialog(fieldName: string) { if (this.currentConfig) SidebarUIMethods.showEditFieldDialog(this.currentConfig, fieldName, this.onMessage); }
  private startFieldSelection(fieldName: string) { if (!this.currentConfig) return; const field = this.currentConfig.schema.fields.find((f: any) => f.name === fieldName); if (!field) return; SidebarUIMethods.startFieldSelection(fieldName, field.type, this.onMessage); this.selectedField = fieldName; this.currentSection = 'selector'; this.updateSidebarContent(); }
  private deleteField(fieldName: string) { if (this.currentConfig) SidebarUIMethods.deleteField(this.currentConfig, fieldName, this.onMessage); }
  private addFallbackSelector() { /* TODO */ }
  private removeFallbackSelector(index: number) { /* TODO */ }
  private previewSelector() { const primaryInput = this.sidebarElement?.querySelector('#pcb-primary-selector') as HTMLInputElement | null; const selector = primaryInput?.value?.trim() ?? ''; if (!selector) { this.showNotification('Введите основной селектор', 'warning'); return; } this.onMessage({ type: 'HIGHLIGHT_ELEMENT', selector, id: `sidebar_${Date.now()}`, timestamp: Date.now() }); }
  private saveSelector() {
    if (!this.currentConfig || !this.selectedField) return;
    const primary = (this.sidebarElement?.querySelector('#pcb-primary-selector') as HTMLInputElement | null)?.value?.trim() ?? '';
    const type = (this.sidebarElement?.querySelector('#pcb-extraction-type') as HTMLSelectElement | null)?.value as SelectorConfig['type'];
    const attr = (this.sidebarElement?.querySelector('#pcb-attribute-name') as HTMLInputElement | null)?.value?.trim();
    const fallbackInputs = Array.from(this.sidebarElement?.querySelectorAll('#pcb-fallback-list input[data-fallback-index]') ?? []) as HTMLInputElement[];
    const fallback = fallbackInputs.map((i: HTMLInputElement) => i.value.trim()).filter((v: string) => v);

    const selectorConfig: SelectorConfig = {
      primary,
      fallback,
      type,
      required: false,
      confidence: 0,
      metadata: {
        generatedAt: new Date().toISOString(),
        confidence: 0,
        strategy: 'manual'
      }
    };
    
    // Добавляем attribute только если тип = attribute
    if (type === 'attribute') {
      selectorConfig.attribute = attr || 'value';
    }

    this.onMessage({
      type: 'UPDATE_SELECTOR',
      fieldName: this.selectedField,
      selectorConfig,
      id: `sidebar_${Date.now()}`,
      timestamp: Date.now()
    });
  }
}
