/**
 * Popup UI Script - интерфейс всплывающего окна расширения
 */

import type { ExtensionMessage, ParserConfig } from '@/types';
import { sendMessageToContentScript } from '@/utils/messaging';

class PopupUI {
  private currentConfig: ParserConfig | null = null;
  private isExtensionActive = false;

  constructor() {
    this.setupEventListeners();
    this.initializeUI();
  }

  /**
   * Настройка обработчиков событий
   */
  private setupEventListeners(): void {
    // Кнопка активации/деактивации
    const toggleBtn = document.getElementById('toggle-btn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this.handleToggle());
    }

    // Кнопка быстрого выбора
    const quickSelectBtn = document.getElementById('quick-select-btn');
    if (quickSelectBtn) {
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

  /**
   * Инициализация UI
   */
  private async initializeUI(): Promise<void> {
    try {
      // Получаем информацию о текущей вкладке
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (tab?.url) {
        this.updateSiteInfo(tab.url);
      }

      // Проверяем состояние расширения
      await this.checkExtensionStatus();
      
      // Загружаем конфиги
      await this.loadConfigs();
      
    } catch (error) {
      console.error('Failed to initialize popup UI:', error);
      this.showError('Ошибка инициализации');
    }
  }

  /**
   * Обновить информацию о сайте
   */
  private updateSiteInfo(url: string): void {
    const domain = new URL(url).hostname;
    const domainElement = document.getElementById('site-domain');
    const statusElement = document.getElementById('site-status');
    
    if (domainElement) {
      domainElement.textContent = domain;
    }
    
    const isSupported = this.isSiteSupported(url);
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
    
    if (toggleBtn) toggleBtn.disabled = !isSupported;
    if (quickSelectBtn) quickSelectBtn.disabled = !isSupported;
  }

  /**
   * Проверить состояние расширения
   */
  private async checkExtensionStatus(): Promise<void> {
    // TODO: Проверка через background script
    console.log('Checking extension status...');
  }

  /**
   * Загрузить конфиги
   */
  private async loadConfigs(): Promise<void> {
    try {
      const configs = await chrome.storage.local.get();
      const configsList = document.getElementById('configs-list');
      
      if (!configsList) return;
      
      const parserConfigs = Object.entries(configs)
        .filter(([key]) => key.startsWith('config_'))
        .map(([, value]) => value as ParserConfig);
        
      if (parserConfigs.length === 0) {
        configsList.innerHTML = `
          <div class="empty-state">
            <span class="empty-state__icon">📁</span>
            <p class="empty-state__text">Конфиги не найдены</p>
          </div>
        `;
        return;
      }
      
      // Отображаем конфиги
      configsList.innerHTML = parserConfigs.map(config => `
        <div class="config-item" data-config-id="${config.id}">
          <div class="config-item__info">
            <div class="config-item__name">${config.platform.name}</div>
            <div class="config-item__meta">${config.pageType} • v${config.metadata.version}</div>
          </div>
          <div class="config-item__actions">
            <button class="config-item__action" data-action="edit">✏️</button>
            <button class="config-item__action" data-action="test">🧪</button>
            <button class="config-item__action" data-action="export">📤</button>
          </div>
        </div>
      `).join('');
      
    } catch (error) {
      console.error('Failed to load configs:', error);
    }
  }

  /**
   * Обработка переключения расширения
   */
  private async handleToggle(): Promise<void> {
    this.showLoading(true);
    
    try {
      const message: ExtensionMessage = this.isExtensionActive
        ? { type: 'DEACTIVATE_EXTENSION', id: 'popup_' + Date.now(), timestamp: Date.now() }
        : { type: 'ACTIVATE_EXTENSION', id: 'popup_' + Date.now(), timestamp: Date.now() };
      
      const response = await sendMessageToContentScript(message);
      
      if (response.success) {
        this.isExtensionActive = !this.isExtensionActive;
        this.updateToggleButton();
        
        const status = this.isExtensionActive ? 'активировано' : 'деактивировано';
        this.showSuccess(`Расширение ${status}`);
      } else {
        this.showError(response.error ?? 'Ошибка переключения');
      }
    } catch (error) {
      this.showError('Ошибка связи с content script');
      console.error('Toggle error:', error);
    } finally {
      this.showLoading(false);
    }
  }

  /**
   * Обработка быстрого выбора
   */
  private async handleQuickSelect(): Promise<void> {
    try {
      const message: ExtensionMessage = {
        type: 'START_SELECTION',
        id: 'popup_' + Date.now(),
        timestamp: Date.now(),
        fieldName: 'quick_select',
        fieldType: 'string'
      };
      
      const response = await sendMessageToContentScript(message);
      
      if (response.success) {
        this.showSuccess('Режим быстрого выбора активирован');
        // Закрываем popup чтобы не мешать выбору
        window.close();
      } else {
        this.showError(response.error ?? 'Ошибка запуска выбора');
      }
    } catch (error) {
      this.showError('Ошибка связи с content script');
      console.error('Quick select error:', error);
    }
  }

  /**
   * Обработка настроек
   */
  private handleSettings(): void {
    // TODO: Открыть страницу настроек
    chrome.tabs.create({ url: chrome.runtime.getURL('options.html') });
  }

  /**
   * Обработка помощи
   */
  private handleHelp(): void {
    // TODO: Открыть страницу помощи
    chrome.tabs.create({ url: 'https://github.com/Unaro/parser-config-builder#readme' });
  }

  /**
   * Обновить кнопку переключения
   */
  private updateToggleButton(): void {
    const toggleBtn = document.getElementById('toggle-btn');
    if (!toggleBtn) return;
    
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
    // Пока поддерживаем все HTTP/HTTPS сайты
    return url.startsWith('http://') || url.startsWith('https://');
  }

  /**
   * Показать лоадер
   */
  private showLoading(show: boolean): void {
    const loader = document.getElementById('loading');
    if (loader) {
      loader.classList.toggle('hidden', !show);
    }
  }

  /**
   * Показать сообщение об успехе
   */
  private showSuccess(message: string): void {
    this.showToast(message, 'success');
  }

  /**
   * Показать сообщение об ошибке
   */
  private showError(message: string): void {
    this.showToast(message, 'error');
  }

  /**
   * Показать всплывающее уведомление
   */
  private showToast(message: string, type: 'success' | 'error' | 'warning' = 'success'): void {
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.textContent = message;
    
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
    new PopupUI();
  });
} else {
  new PopupUI();
}
