/**
 * Popup UI Script - интерфейс всплывающего окна расширения
 */

import type { ExtensionMessage } from '@/types';
import { sendMessageToContentScript } from '@/utils/messaging';

class PopupUI {
  private isExtensionActive = false;

  constructor() {
    console.log('PopupUI: Initializing...');
    this.setupEventListeners();
    this.initializeUI();
  }

  /**
   * Настройка обработчиков событий
   */
  private setupEventListeners(): void {
    console.log('PopupUI: Setting up event listeners...');
    
    // Кнопка активации/деактивации
    const toggleBtn = document.getElementById('toggle-btn');
    if (toggleBtn) {
      console.log('PopupUI: Toggle button found, adding listener');
      toggleBtn.addEventListener('click', () => {
        console.log('PopupUI: Toggle button clicked!');
        this.handleToggle();
      });
    } else {
      console.error('PopupUI: Toggle button not found!');
    }

    // Кнопка быстрого выбора
    const quickSelectBtn = document.getElementById('quick-select-btn');
    if (quickSelectBtn) {
      console.log('PopupUI: Quick select button found, adding listener');
      quickSelectBtn.addEventListener('click', () => {
        console.log('PopupUI: Quick select button clicked!');
        this.handleQuickSelect();
      });
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

  /**
   * Инициализация UI
   */
  private async initializeUI(): Promise<void> {
    console.log('PopupUI: Initializing UI...');
    
    try {
      // Получаем информацию о текущей вкладке
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      console.log('PopupUI: Active tab:', tab);
      
      if (tab?.url) {
        this.updateSiteInfo(tab.url);
      } else {
        console.warn('PopupUI: No active tab URL found');
      }

      // Проверяем состояние расширения
      await this.checkExtensionStatus();
      
    } catch (error) {
      console.error('PopupUI: Failed to initialize UI:', error);
      this.showError('Ошибка инициализации');
    }
  }

  /**
   * Обновить информацию о сайте
   */
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
    
    // Активируем кнопки если сайт поддерживается
    const toggleBtn = document.getElementById('toggle-btn') as HTMLButtonElement;
    const quickSelectBtn = document.getElementById('quick-select-btn') as HTMLButtonElement;
    
    if (toggleBtn) {
      toggleBtn.disabled = !isSupported;
      console.log('PopupUI: Toggle button disabled:', !isSupported);
    }
    if (quickSelectBtn) {
      quickSelectBtn.disabled = !isSupported;
      console.log('PopupUI: Quick select button disabled:', !isSupported);
    }
  }

  /**
   * Проверить состояние расширения
   */
  private async checkExtensionStatus(): Promise<void> {
    console.log('PopupUI: Checking extension status...');
    // TODO: Проверка через background script
  }

  /**
   * Обработка переключения расширения
   */
  private async handleToggle(): Promise<void> {
    console.log('PopupUI: handleToggle called, isActive:', this.isExtensionActive);
    
    this.showLoading(true);
    
    try {
      const message: ExtensionMessage = this.isExtensionActive
        ? { type: 'DEACTIVATE_EXTENSION', id: 'popup_' + Date.now(), timestamp: Date.now() }
        : { type: 'ACTIVATE_EXTENSION', id: 'popup_' + Date.now(), timestamp: Date.now() };
      
      console.log('PopupUI: Sending message:', message);
      
      const response = await sendMessageToContentScript(message);
      
      console.log('PopupUI: Received response:', response);
      
      if (response.success) {
        this.isExtensionActive = !this.isExtensionActive;
        this.updateToggleButton();
        
        const status = this.isExtensionActive ? 'активировано' : 'деактивировано';
        console.log(`PopupUI: Extension ${status}`);
        this.showSuccess(`Расширение ${status}`);
      } else {
        console.error('PopupUI: Toggle failed:', response.error);
        this.showError(response.error ?? 'Ошибка переключения');
      }
    } catch (error) {
      console.error('PopupUI: Toggle error:', error);
      this.showError('Ошибка связи с content script');
    } finally {
      this.showLoading(false);
    }
  }

  /**
   * Обработка быстрого выбора
   */
  private async handleQuickSelect(): Promise<void> {
    console.log('PopupUI: handleQuickSelect called');
    
    try {
      const message: ExtensionMessage = {
        type: 'START_SELECTION',
        id: 'popup_' + Date.now(),
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
        window.close();
      } else {
        console.error('PopupUI: Quick select failed:', response.error);
        this.showError(response.error ?? 'Ошибка запуска выбора');
      }
    } catch (error) {
      console.error('PopupUI: Quick select error:', error);
      this.showError('Ошибка связи с content script');
    }
  }

  /**
   * Обработка настроек
   */
  private handleSettings(): void {
    console.log('PopupUI: Opening settings');
    chrome.tabs.create({ url: chrome.runtime.getURL('options.html') });
  }

  /**
   * Обработка помощи
   */
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

  /**
   * Проверить, поддерживается ли сайт
   */
  private isSiteSupported(url: string): boolean {
    const supported = url.startsWith('http://') || url.startsWith('https://');
    console.log('PopupUI: isSiteSupported:', url, supported);
    return supported;
  }

  /**
   * Показать лоадер
   */
  private showLoading(show: boolean): void {
    console.log('PopupUI: showLoading:', show);
    const loader = document.getElementById('loading');
    if (loader) {
      loader.classList.toggle('hidden', !show);
    }
  }

  /**
   * Показать сообщение об успехе
   */
  private showSuccess(message: string): void {
    console.log('PopupUI: showSuccess:', message);
    this.showToast(message, 'success');
  }

  /**
   * Показать сообщение об ошибке
   */
  private showError(message: string): void {
    console.log('PopupUI: showError:', message);
    this.showToast(message, 'error');
  }

  /**
   * Показать всплывающее уведомление
   */
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
      border-radius: 6px;
      font-size: 14px;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    `;
    
    document.body.appendChild(toast);
    
    // Удаляем через 3 секунды
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
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
