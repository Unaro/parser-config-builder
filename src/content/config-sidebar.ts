/**
 * Config Sidebar - боковая панель управления конфигурацией
 */

import type { ParserConfig, ElementSelectedMessage } from '@/types';

export class ConfigSidebar {
  private isVisible = false;
  private sidebarElement: HTMLElement | null = null;
  private currentConfig: ParserConfig | null = null;

  constructor() {
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
  public notifyTestResults(results: any[]): void {
    console.log('ConfigSidebar: Test results', results);
    
    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;
    
    this.showNotification(
      `🧪 Тест завершён: ${successCount}/${totalCount} селекторов работают`,
      successCount === totalCount ? 'success' : 'warning'
    );
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
      width: 350px;
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

    // Содержимое сайдбара
    this.sidebarElement.innerHTML = `
      <div class="pcb-sidebar-header" style="
        padding: 16px;
        background: #1890ff;
        color: white;
        font-weight: 600;
        font-size: 16px;
        display: flex;
        align-items: center;
        gap: 8px;
      ">
        <span>🛠️</span>
        Parser Config Builder
      </div>
      
      <div class="pcb-sidebar-content" style="
        flex: 1;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      ">
        <div class="pcb-status" style="
          padding: 12px;
          background: #f0f9f0;
          border: 1px solid #52c41a;
          border-radius: 6px;
          color: #389e0d;
          font-size: 14px;
        ">
          ✅ Расширение активно
        </div>
        
        <div class="pcb-instructions" style="
          padding: 12px;
          background: #f0f8ff;
          border: 1px solid #1890ff;
          border-radius: 6px;
          font-size: 14px;
          line-height: 1.5;
        ">
          <strong>Как использовать:</strong><br>
          • Наведите мышь на элемент<br>
          • Кликните для выбора<br>
          • <kbd>ESC</kbd> — отмена<br>
          • <kbd>Enter</kbd> — выбрать наведённый
        </div>
        
        <div class="pcb-config-info" id="pcb-config-info" style="
          padding: 12px;
          background: #fafafa;
          border: 1px solid #d9d9d9;
          border-radius: 6px;
          font-size: 13px;
        ">
          Загрузка конфига...
        </div>
        
        <div class="pcb-selection-history" id="pcb-selection-history" style="
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
        ">
          <div style="font-weight: 600; font-size: 14px; color: #666;">История выбора:</div>
          <div class="pcb-history-list" style="
            display: flex;
            flex-direction: column;
            gap: 4px;
          "></div>
        </div>
      </div>
      
      <div class="pcb-sidebar-footer" style="
        padding: 16px;
        border-top: 1px solid #f0f0f0;
        background: #fafafa;
      ">
        <button class="pcb-btn-close" style="
          width: 100%;
          padding: 8px 16px;
          background: #ff4d4f;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        ">Закрыть</button>
      </div>
    `;

    // Обработчик закрытия
    const closeBtn = this.sidebarElement.querySelector('.pcb-btn-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hide());
    }

    document.body.appendChild(this.sidebarElement);
    
    // Обновляем содержимое
    this.updateSidebarContent();
  }

  /**
   * Обновить содержимое сайдбара
   */
  private updateSidebarContent(): void {
    if (!this.sidebarElement) return;

    const configInfo = this.sidebarElement.querySelector('#pcb-config-info');
    if (configInfo && this.currentConfig) {
      configInfo.innerHTML = `
        <div><strong>Платформа:</strong> ${this.currentConfig.platform.name}</div>
        <div><strong>Домен:</strong> ${this.currentConfig.platform.domain}</div>
        <div><strong>Тип:</strong> ${this.currentConfig.pageType}</div>
        <div><strong>Полей:</strong> ${this.currentConfig.schema.fields.length}</div>
        <div><strong>Селекторов:</strong> ${Object.keys(this.currentConfig.selectors).length}</div>
      `;
    }
  }

  /**
   * Показать уведомление
   */
  private showNotification(text: string, type: 'success' | 'error' | 'warning' = 'success'): void {
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
      right: 370px;
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

    // Удаляем через 4 секунды
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 4000);
  }

  /**
   * Добавить в историю выбора
   */
  private addToSelectionHistory(message: ElementSelectedMessage): void {
    if (!this.sidebarElement) return;

    const historyList = this.sidebarElement.querySelector('.pcb-history-list');
    if (!historyList) return;

    const historyItem = document.createElement('div');
    historyItem.style.cssText = `
      padding: 8px 12px;
      background: #f9f9f9;
      border-radius: 4px;
      font-size: 12px;
      border-left: 3px solid #1890ff;
    `;
    
    const time = new Date(message.timestamp).toLocaleTimeString();
    historyItem.innerHTML = `
      <div><strong>${message.fieldName}</strong></div>
      <div style="color: #666; margin-top: 2px;">
        ${message.element.tagName.toLowerCase()} • ${time}
      </div>
      <div style="color: #999; font-family: monospace; font-size: 11px; margin-top: 4px;">
        ${message.selector.selector}
      </div>
    `;

    historyList.appendChild(historyItem);

    // Ограничиваем историю 10 записями
    const items = historyList.children;
    if (items.length > 10) {
      items[0]?.remove();
    }
  }
}
