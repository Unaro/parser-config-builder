/**
 * Config Sidebar - боковая панель управления конфигурацией (завершение методов)
 */

import type { 
  ParserConfig, 
  ElementSelectedMessage, 
  PageType,
  TestResult 
} from '@/types';
import type { SelectorConfig } from '@/types/selector';
import { SidebarUIMethods } from './config-sidebar-methods';

// ... предыдущий код оставлен без изменений

export class ConfigSidebar {
  // ... поля и конструктор оставлены без изменений

  // === Обертки над UI методами ===
  private showNotification(text: string, type: 'success'|'error'|'warning' = 'success') {
    SidebarUIMethods.showNotification(text, type);
  }

  private addToSelectionHistory(message: ElementSelectedMessage) {
    this.selectionHistory.push(message);
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

  private renderSidebar(): string {
    return [
      this.renderHeader(),
      this.renderControlPanel(),
      this.renderMainContent(),
      this.renderFooter()
    ].join('');
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
    list.innerHTML = this.selectionHistory.map(m => SidebarUIMethods.renderHistoryItem(m)).join('');
    // Привязываем клики к новым элементам
    const historyItems = this.sidebarElement!.querySelectorAll('.pcb-history-item');
    historyItems.forEach(item => {
      item.addEventListener('click', (e) => {
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
    const field = this.currentConfig.schema.fields.find(f => f.name === fieldName);
    if (!field) return;
    SidebarUIMethods.startFieldSelection(fieldName, field.type, this.onMessage);
    this.selectedField = fieldName;
    this.currentSection = 'selector';
    this.updateSidebarContent();
  }

  private deleteField(fieldName: string) {
    if (!this.currentConfig) return;
    SidebarUIMethods.deleteField(this.currentConfig, fieldName, this.onMessage);
  }

  private addFallbackSelector() {
    // Добавление пустого fallback input в DOM
    const list = this.sidebarElement?.querySelector('#pcb-fallback-list');
    if (!list) return;
    const index = list.children.length;
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:4px;';
    wrapper.innerHTML = `
      <input type="text" data-fallback-index="${index}" style="flex:1;padding:4px 8px;border:1px solid #d9d9d9;border-radius:3px;font-size:12px;font-family:monospace;">
      <button class="pcb-remove-fallback" data-index="${index}" style="background:#ff4d4f;color:white;border:none;border-radius:3px;padding:4px 6px;cursor:pointer;font-size:10px;">✖</button>
    `;
    list.appendChild(wrapper);

    // Привязка удаления
    const btn = wrapper.querySelector('.pcb-remove-fallback') as HTMLElement;
    btn.addEventListener('click', (e) => {
      const idx = parseInt((e.currentTarget as HTMLElement).getAttribute('data-index')!);
      this.removeFallbackSelector(idx);
    });
  }

  private removeFallbackSelector(index: number) {
    const list = this.sidebarElement?.querySelector('#pcb-fallback-list');
    if (!list) return;
    const child = list.children[index];
    if (child) child.remove();
    // Перенумерация data-index
    Array.from(list.children).forEach((el, i) => {
      const btn = (el as HTMLElement).querySelector('.pcb-remove-fallback') as HTMLElement | null;
      if (btn) btn.setAttribute('data-index', String(i));
      const input = (el as HTMLElement).querySelector('input[data-fallback-index]') as HTMLElement | null;
      if (input) input.setAttribute('data-fallback-index', String(i));
    });
  }

  private previewSelector() {
    const primaryInput = this.sidebarElement?.querySelector('#pcb-primary-selector') as HTMLInputElement | null;
    const selector = primaryInput?.value?.trim() ?? '';
    if (!selector) {
      this.showNotification('Введите основной селектор', 'warning');
      return;
    }
    this.onMessage({ type: 'HIGHLIGHT_ELEMENT', selector, id: `sidebar_${Date.now()}`, timestamp: Date.now() });
  }

  private saveSelector() {
    if (!this.currentConfig || !this.selectedField) return;
    const primary = (this.sidebarElement?.querySelector('#pcb-primary-selector') as HTMLInputElement | null)?.value?.trim() ?? '';
    const type = (this.sidebarElement?.querySelector('#pcb-extraction-type') as HTMLSelectElement | null)?.value as SelectorConfig['type'];
    const attr = (this.sidebarElement?.querySelector('#pcb-attribute-name') as HTMLInputElement | null)?.value?.trim();
    const fallbackInputs = Array.from(this.sidebarElement?.querySelectorAll('#pcb-fallback-list input[data-fallback-index]') ?? []) as HTMLInputElement[];
    const fallback = fallbackInputs.map(i => i.value.trim()).filter(v => v);

    const selectorConfig: SelectorConfig = {
      primary,
      fallback,
      type,
      required: false,
      attribute: type === 'attribute' ? (attr || 'value') : undefined,
      confidence: 0,
      metadata: {
        generatedAt: new Date().toISOString(),
        confidence: 0,
        strategy: 'manual'
      }
    };

    this.onMessage({
      type: 'UPDATE_SELECTOR',
      fieldName: this.selectedField,
      selectorConfig,
      id: `sidebar_${Date.now()}`,
      timestamp: Date.now()
    });
  }
}
