/**
 * Config Sidebar - заглушка для взаимодействия с React sidebar
 */

import type { 
  ElementSelectedMessage, 
  ParserConfig, 
  TestResult 
} from '@/types';

/**
 * Временная заглушка для config sidebar
 * Будет заменена на полноценный React компонент
 */
export class ConfigSidebar {
  private isVisible = false;
  private currentConfig: ParserConfig | null = null;
  
  constructor() {
    // Используем поля для избежания TS6133
    void this.isVisible;
    void this.currentConfig;
  }

  /**
   * Показать боковую панель
   */
  show(): void {
    this.isVisible = true;
    console.log('Config Sidebar: Show');
    
    // TODO: Инжекция React компонента
    this.createPlaceholder();
  }

  /**
   * Скрыть боковую панель
   */
  hide(): void {
    this.isVisible = false;
    console.log('Config Sidebar: Hide');
    
    this.removePlaceholder();
  }

  /**
   * Обновить конфиг
   */
  updateConfig(config: ParserConfig): void {
    this.currentConfig = config;
    console.log('Config Sidebar: Config updated', config);
  }

  /**
   * Уведомить о выбранном элементе
   */
  notifyElementSelected(message: ElementSelectedMessage): void {
    console.log('Config Sidebar: Element selected', message);
    
    // Временно показываем информацию в консоли
    this.showElementSelectedNotification(message);
  }

  /**
   * Уведомить об отмене выделения
   */
  notifySelectionCancelled(fieldName: string): void {
    console.log('Config Sidebar: Selection cancelled for field:', fieldName);
  }

  /**
   * Показать результаты тестирования
   */
  notifyTestResults(results: TestResult[]): void {
    console.log('Config Sidebar: Test results', results);
    
    // Временно показываем уведомление
    this.showTestResultsNotification(results);
  }

  /**
   * Создать временный placeholder UI
   */
  private createPlaceholder(): void {
    if (document.getElementById('pcb-sidebar-placeholder')) return;
    
    const placeholder = document.createElement('div');
    placeholder.id = 'pcb-sidebar-placeholder';
    placeholder.className = 'pcb-sidebar pcb-ui';
    placeholder.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        right: 0;
        width: 400px;
        height: 100vh;
        background: white;
        box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
        z-index: 10000000;
        padding: 20px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        overflow-y: auto;
      ">
        <h3 style="margin: 0 0 20px 0; color: #1890ff;">
          🛠️ Parser Config Builder
        </h3>
        
        <div style="margin-bottom: 20px;">
          <strong>Платформа:</strong> ${window.location.hostname}<br>
          <strong>URL:</strong> ${window.location.pathname}
        </div>
        
        <div style="
          background: #f5f5f5;
          padding: 16px;
          border-radius: 4px;
          margin-bottom: 20px;
          font-size: 14px;
        ">
          <div style="font-weight: 500; margin-bottom: 8px;">📋 Инструкция:</div>
          <div>1. Нажмите Ctrl+Shift+E для выделения элементов</div>
          <div>2. Кликните по элементу для выбора</div>
          <div>3. ESC для отмены выделения</div>
        </div>
        
        <div id="pcb-notifications" style="margin-bottom: 20px;"></div>
        
        <div style="
          position: absolute;
          bottom: 20px;
          left: 20px;
          right: 20px;
          text-align: center;
          color: #666;
          font-size: 12px;
        ">
          React UI будет загружен позже
        </div>
      </div>
    `;
    
    document.body.appendChild(placeholder);
  }

  /**
   * Удалить placeholder
   */
  private removePlaceholder(): void {
    const placeholder = document.getElementById('pcb-sidebar-placeholder');
    if (placeholder) {
      placeholder.remove();
    }
  }

  /**
   * Показать уведомление о выбранном элементе
   */
  private showElementSelectedNotification(message: ElementSelectedMessage): void {
    const container = document.getElementById('pcb-notifications');
    if (!container) return;
    
    const notification = document.createElement('div');
    notification.style.cssText = `
      background: #f6ffed;
      border: 1px solid #b7eb8f;
      border-radius: 4px;
      padding: 12px;
      margin-bottom: 8px;
      font-size: 14px;
    `;
    
    notification.innerHTML = `
      <div style="font-weight: 500; color: #52c41a; margin-bottom: 4px;">
        ✅ Элемент выбран для поля "${message.fieldName}"
      </div>
      <div style="font-size: 12px; color: #666;">
        <strong>Тег:</strong> ${message.element.tagName.toLowerCase()}<br>
        <strong>Селектор:</strong> ${message.selector.selector}<br>
        <strong>Текст:</strong> ${message.element.textContent?.substring(0, 50) || 'N/A'}
      </div>
    `;
    
    container.appendChild(notification);
    
    // Автоудаление через 5 секунд
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);
  }

  /**
   * Показать уведомление о результатах тестирования
   */
  private showTestResultsNotification(results: TestResult[]): void {
    const container = document.getElementById('pcb-notifications');
    if (!container) return;
    
    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;
    
    const notification = document.createElement('div');
    const isSuccess = successCount === totalCount;
    
    notification.style.cssText = `
      background: ${isSuccess ? '#f6ffed' : '#fff2f0'};
      border: 1px solid ${isSuccess ? '#b7eb8f' : '#ffccc7'};
      border-radius: 4px;
      padding: 12px;
      margin-bottom: 8px;
      font-size: 14px;
    `;
    
    notification.innerHTML = `
      <div style="font-weight: 500; color: ${isSuccess ? '#52c41a' : '#ff4d4f'}; margin-bottom: 8px;">
        ${isSuccess ? '✅' : '⚠️'} Тестирование завершено: ${successCount}/${totalCount}
      </div>
      <div style="font-size: 12px; color: #666;">
        ${results.map(r => `
          <div style="margin-bottom: 4px;">
            ${r.success ? '✓' : '✗'} ${r.fieldName}: ${r.success ? r.extractedValue : r.error}
          </div>
        `).join('')}
      </div>
    `;
    
    container.appendChild(notification);
    
    // Автоудаление через 10 секунд
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 10000);
  }
}
