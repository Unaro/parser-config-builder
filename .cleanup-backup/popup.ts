/**
 * Popup UI Script - улучшенный интерфейс с синхронизацией состояния
 */

import type { ExtensionMessage, GetStatusMessage, ToggleActiveMessage, StartSelectionMessage, StatusResponse } from '@/types';
import { sendMessageToContentScript } from '@/utils/messaging';

class PopupUI {
  private isExtensionActive = false;
  private currentStatus: StatusResponse | null = null;
  private isLoading = false;

  constructor() {
    console.log('PopupUI: Initializing...');
    this.setupEventListeners();
    this.initializeUI();
  }

  private setupEventListeners(): void {
    console.log('PopupUI: Setting up event listeners...');
    
    // Кнопка активации/деактивации
    const toggleBtn = document.getElementById('toggle-btn');
    if (toggleBtn) {
      console.log('PopupUI: Toggle button found, adding listener');
      toggleBtn.addEventListener('click', () => this.handleToggle());
    } else {
      console.error('PopupUI: Toggle button not found!');
    }

    // Кнопка быстрого выбора
    const quickSelectBtn = document.getElementById('quick-select-btn');
    if (quickSelectBtn) {
      console.log('PopupUI: Quick select button found, adding listener');
      quickSelectBtn.addEventListener('click', () => this.handleQuickSelect());
    }

    // Кнопка настроек
    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => this.handleSettings());
    }

    // Кнопка помощи
    const helpBtn = document.getElementById('help-btn');
    if (helpBtn) {
      helpBtn.addEventListener('click', () => this.handleHelp());
    }
  }

  private async initializeUI(): Promise<void> {
    console.log('PopupUI: Initializing UI...');
    
    try {
      // Получаем информацию о текущей вкладке
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      console.log('PopupUI: Active tab:', tab);
      
      if (tab?.url) {
        this.updateSiteInfo(tab.url);
        
        // Проверяем статус расширения
        if (this.isSiteSupported(tab.url)) {
          await this.checkExtensionStatus();
        }
      } else {
        console.warn('PopupUI: No active tab URL found');
        this.showError('Нет активной вкладки');
      }
    } catch (error) {
      console.error('PopupUI: Failed to initialize UI:', error);
      this.showError('Ошибка инициализации');
    }
  }

  private updateSiteInfo(url: string): void {
    console.log('PopupUI: Updating site info for:', url);
    
    const domain = new URL(url).hostname;
    const domainElement = document.getElementById('site-domain');
    const statusElement = document.getElementById('site-status');
    
    if (domainElement) {
      domainElement.textContent = domain;
    }
    
    const isSupported = this.isSiteSupported(url);
    console.log('PopupUI: Site supported:', isSupported);
    
    if (statusElement) {
      if (isSupported) {
        statusElement.innerHTML = `
          <span class="status-indicator status-indicator--active"></span>
          Поддерживается
        `;
      } else {
        statusElement.innerHTML = `
          <span class="status-indicator status-indicator--inactive"></span>
          Не поддерживается
        `;
      }
    }
    
    // Управляем доступностью кнопок
    this.updateButtonsAvailability(isSupported);
  }

  private updateButtonsAvailability(supported: boolean): void {
    const toggleBtn = document.getElementById('toggle-btn') as HTMLButtonElement;
    const quickSelectBtn = document.getElementById('quick-select-btn') as HTMLButtonElement;
    
    if (toggleBtn) {
      toggleBtn.disabled = !supported;
      if (!supported) {
        toggleBtn.innerHTML = '⚠️ Недоступно';
        toggleBtn.title = 'Откройте обычный сайт (http/https)';
      }
    }
    if (quickSelectBtn) {
      quickSelectBtn.disabled = !supported;
    }
  }

  /**
   * Проверить статус расширения
   */
  private async checkExtensionStatus(): Promise<void> {
    console.log('PopupUI: Checking extension status...');
    
    try {
      const message: GetStatusMessage = {
        type: 'GET_STATUS',
        id: `popup_${Date.now()}`,
        timestamp: Date.now()
      };
      
      const response = await sendMessageToContentScript(message);
      
      if (response.success) {
        this.currentStatus = response.data as StatusResponse;
        this.isExtensionActive = this.currentStatus.isActive;
        this.updateUIFromStatus(this.currentStatus);
        console.log('PopupUI: Status updated:', this.currentStatus);
      } else {
        console.warn('PopupUI: Failed to get status:', response.error);
        this.showStatusUnknown();
      }
    } catch (error) {
      console.error('PopupUI: Status check error:', error);
      this.showContentScriptNotFound();
    }
  }

  /**
   * Обновить UI на основе статуса
   */
  private updateUIFromStatus(status: StatusResponse): void {
    console.log('PopupUI: Updating UI from status:', status);
    
    // Обновляем кнопку toggle
    this.updateToggleButton();
    
    // Обновляем статистику
    this.updateStatistics(status);
    
    // Обновляем статус sidebar
    this.updateSidebarStatus(status);
    
    // Обновляем режим выбора
    this.updateSelectionMode(status);
  }

  private updateStatistics(status: StatusResponse): void {
    const fieldsElement = document.getElementById('fields-count');
    const selectorsElement = document.getElementById('selectors-count');
    
    if (fieldsElement) fieldsElement.textContent = String(status.fieldsCount);
    if (selectorsElement) selectorsElement.textContent = String(status.selectorsCount);
  }

  private updateSidebarStatus(status: StatusResponse): void {
    const sidebarStatusElement = document.getElementById('sidebar-status');
    if (!sidebarStatusElement) return;
    
    if (status.hasSidebar) {
      sidebarStatusElement.innerHTML = `
        <span style="color: #52c41a;">✅ Sidebar открыт</span>
      `;
    } else if (status.isActive) {
      sidebarStatusElement.innerHTML = `
        <span style="color: #faad14;">⚠️ Sidebar скрыт</span>
      `;
    } else {
      sidebarStatusElement.innerHTML = `
        <span style="color: #999;">⚪ Sidebar неактивен</span>
      `;
    }
  }

  private updateSelectionMode(status: StatusResponse): void {
    const selectionElement = document.getElementById('selection-mode');
    if (!selectionElement) return;
    
    if (status.selectingField) {
      selectionElement.innerHTML = `
        <div style="
          background: linear-gradient(135deg, #1890ff 0%, #52c41a 100%);
          color: white;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          text-align: center;
          animation: pulse 2s infinite;
        ">
          🎯 Выбираем: ${status.selectingField}
        </div>
        <style>
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.02); opacity: 0.9; }
          }
        </style>
      `;
    } else {
      selectionElement.innerHTML = '';
    }
  }

  private showContentScriptNotFound(): void {
    const statusElement = document.getElementById('extension-status');
    if (statusElement) {
      statusElement.innerHTML = `
        <div style="
          padding: 12px;
          background: #fff2f0;
          border: 1px solid #ffccc7;
          border-radius: 8px;
          color: #cf1322;
          font-size: 13px;
          text-align: center;
        ">
          🔄 Обновите страницу<br>
          <small>или откройте обычный сайт</small>
        </div>
      `;
    }
  }

  private showStatusUnknown(): void {
    const statusElement = document.getElementById('extension-status');
    if (statusElement) {
      statusElement.innerHTML = `
        <div style="color: #faad14; text-align: center; font-size: 13px;">
          ⚠️ Статус неизвестен
        </div>
      `;
    }
  }

  /**
   * Обработка переключения расширения
   */
  private async handleToggle(): Promise<void> {
    console.log('PopupUI: handleToggle called, isActive:', this.isExtensionActive);
    
    if (this.isLoading) return;
    this.showLoading(true);
    
    try {
      const message: ToggleActiveMessage = {
        type: 'TOGGLE_ACTIVE',
        id: `popup_${Date.now()}`,
        timestamp: Date.now()
      };
      
      console.log('PopupUI: Sending toggle message:', message);
      const response = await sendMessageToContentScript(message);
      console.log('PopupUI: Toggle response:', response);
      
      if (response.success) {
        // Перепроверяем статус
        await this.checkExtensionStatus();
        
        const status = this.isExtensionActive ? 'активировано' : 'деактивировано';
        console.log(`PopupUI: Extension ${status}`);
        this.showSuccess(`Расширение ${status}`);
      } else {
        console.error('PopupUI: Toggle failed:', response.error);
        if (response.error?.includes('Receiving end does not exist')) {
          this.showContentScriptNotFound();
        } else {
          this.showError(response.error ?? 'Ошибка переключения');
        }
      }
    } catch (error) {
      console.error('PopupUI: Toggle error:', error);
      const errorMessage = (error as Error).message;
      if (errorMessage?.includes('Receiving end does not exist')) {
        this.showContentScriptNotFound();
      } else {
        this.showError('Ошибка связи с content script');
      }
    } finally {
      this.showLoading(false);
    }
  }

  /**
   * Обработка быстрого выбора
   */
  private async handleQuickSelect(): Promise<void> {
    console.log('PopupUI: handleQuickSelect called');
    
    if (this.isLoading) return;
    
    try {
      // Если расширение не активно - сначала активируем
      if (!this.isExtensionActive) {
        await this.handleToggle();
        // Даём время на активацию
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // Проверяем, что расширение точно активно
      if (!this.isExtensionActive) {
        this.showError('Не удалось активировать расширение');
        return;
      }
      
      const message: StartSelectionMessage = {
        type: 'START_SELECTION',
        id: `popup_${Date.now()}`,
        timestamp: Date.now(),
        fieldName: 'quick_select',
        fieldType: 'string'
      };
      
      console.log('PopupUI: Sending quick select message:', message);
      const response = await sendMessageToContentScript(message);
      console.log('PopupUI: Quick select response:', response);
      
      if (response.success) {
        this.showSuccess('Режим быстрого выбора активирован');
        // Закрываем popup чтобы не мешать выбору
        setTimeout(() => window.close(), 500);
      } else {
        console.error('PopupUI: Quick select failed:', response.error);
        this.showError(response.error ?? 'Ошибка запуска выбора');
      }
    } catch (error) {
      console.error('PopupUI: Quick select error:', error);
      this.showError('Ошибка связи с content script');
    }
  }

  private handleSettings(): void {
    console.log('PopupUI: Opening settings');
    chrome.tabs.create({ url: chrome.runtime.getURL('options.html') });
  }

  private handleHelp(): void {
    console.log('PopupUI: Opening help');
    chrome.tabs.create({ url: 'https://github.com/Unaro/parser-config-builder#readme' });
  }

  /**
   * Обновить кнопку переключения
   */
  private updateToggleButton(): void {
    const toggleBtn = document.getElementById('toggle-btn');
    if (!toggleBtn) return;
    
    console.log('PopupUI: Updating toggle button, isActive:', this.isExtensionActive);
    
    if (this.isExtensionActive) {
      toggleBtn.innerHTML = '<span class="btn-icon">🔴</span> Деактивировать';
      toggleBtn.className = 'btn btn--secondary btn--large';
    } else {
      toggleBtn.innerHTML = '<span class="btn-icon">🚀</span> Активировать';
      toggleBtn.className = 'btn btn--primary btn--large';
    }
  }

  private isSiteSupported(url: string): boolean {
    const supported = url.startsWith('http://') || url.startsWith('https://');
    console.log('PopupUI: isSiteSupported:', url, supported);
    return supported;
  }

  private showLoading(show: boolean): void {
    this.isLoading = show;
    console.log('PopupUI: showLoading:', show);
    const loader = document.getElementById('loading');
    if (loader) {
      loader.classList.toggle('hidden', !show);
    }
    
    // Блокируем кнопки при загрузке
    const buttons = document.querySelectorAll('button:not([disabled])');
    buttons.forEach(btn => {
      (btn as HTMLButtonElement).disabled = show;
    });
  }

  private showSuccess(message: string): void {
    console.log('PopupUI: showSuccess:', message);
    this.showToast(message, 'success');
  }

  private showError(message: string): void {
    console.log('PopupUI: showError:', message);
    this.showToast(message, 'error');
  }

  private showToast(message: string, type: 'success' | 'error' | 'warning' = 'success'): void {
    console.log('PopupUI: showToast:', message, type);
    
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.textContent = message;
    
    const colors = {
      success: '#52c41a',
      error: '#ff4d4f', 
      warning: '#faad14'
    };
    
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      padding: 12px 16px;
      background: ${colors[type]};
      color: white;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      animation: slideInUp 0.3s ease-out;
    `;
    
    document.body.appendChild(toast);
    
    // Анимация
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideInUp {
        from { transform: translateX(-50%) translateY(100%); opacity: 0; }
        to { transform: translateX(-50%) translateY(0); opacity: 1; }
      }
    `;
    if (!document.getElementById('pcb-toast-animations')) {
      style.id = 'pcb-toast-animations';
      document.head.appendChild(style);
    }
    
    setTimeout(() => {
      if (toast.parentNode) toast.remove();
    }, 3000);
  }
}

// Инициализация при загрузке DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('PopupUI: DOMContentLoaded, creating PopupUI');
    new PopupUI();
  });
} else {
  console.log('PopupUI: DOM ready, creating PopupUI immediately');
  new PopupUI();
}