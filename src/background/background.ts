/**
 * Background Service Worker - управление жизненным циклом расширения
 */

import type { ExtensionMessage, MessageResponse } from '@/types';

class ParserConfigBackground {
  private activeTabId: number | null = null;
  private isExtensionActive = false;

  constructor() {
    this.setupListeners();
    console.log('Parser Config Builder: Background service worker started');
  }

  /**
   * Настройка слушателей
   */
  private setupListeners(): void {
    // Установка расширения
    chrome.runtime.onInstalled.addListener((details) => {
      this.handleInstall(details);
    });

    // Запуск расширения
    chrome.runtime.onStartup.addListener(() => {
      console.log('Extension startup');
    });

    // Сообщения от компонентов
    chrome.runtime.onMessage.addListener(
      (message: ExtensionMessage, sender, sendResponse) => {
        this.handleMessage(message, sender)
          .then(response => sendResponse(response))
          .catch(error => {
            console.error('Background message error:', error);
            sendResponse({ success: false, error: error.message });
          });
        return true; // Асинхронный ответ
      }
    );

    // Отслеживание смены вкладок
    chrome.tabs.onActivated.addListener((activeInfo) => {
      this.handleTabChange(activeInfo.tabId);
    });

    // Обновление вкладок
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.url) {
        this.handleTabUpdate(tabId, tab.url);
      }
    });

    // Команды (горячие клавиши)
    chrome.commands.onCommand.addListener((command) => {
      this.handleCommand(command);
    });

    // Клик по иконке расширения
    chrome.action.onClicked.addListener((tab) => {
      this.handleActionClick(tab);
    });
  }

  /**
   * Обработка установки расширения
   */
  private async handleInstall(details: chrome.runtime.InstalledDetails): Promise<void> {
    console.log('Extension installed:', details.reason);

    if (details.reason === 'install') {
      // Первая установка
      await this.initializeExtension();
      
      // Открываем welcome страницу (опционально)
      // chrome.tabs.create({ url: chrome.runtime.getURL('welcome.html') });
    }

    if (details.reason === 'update') {
      // Обновление расширения
      console.log(`Updated from version ${details.previousVersion}`);
    }
  }

  /**
   * Инициализация расширения
   */
  private async initializeExtension(): Promise<void> {
    // Настройка по умолчанию
    await chrome.storage.local.set({
      'settings': {
        autoActivate: false,
        showHints: true,
        theme: 'light',
        language: 'ru'
      }
    });

    console.log('Extension initialized');
  }

  /**
   * Обработка сообщений
   */
  private async handleMessage(
    message: ExtensionMessage, 
    sender: chrome.runtime.MessageSender
  ): Promise<MessageResponse> {
    console.log('Background received message:', message.type, sender.tab?.id);

    switch (message.type) {
      case 'GET_TAB_INFO':
        return this.getTabInfo(sender.tab?.id);

      case 'UPDATE_BADGE':
        return this.updateBadge(message.data);

      case 'STORE_TEMP_DATA':
        return this.storeTempData(message.data);

      case 'GET_TEMP_DATA':
        return this.getTempData(message.data);

      default:
        return { success: false, error: 'Unknown message type' };
    }
  }

  /**
   * Обработка смены вкладки
   */
  private handleTabChange(tabId: number): void {
    this.activeTabId = tabId;
    console.log('Active tab changed:', tabId);

    // Обновляем иконку расширения
    this.updateIcon(tabId);
  }

  /**
   * Обработка обновления вкладки
   */
  private handleTabUpdate(tabId: number, url: string): void {
    console.log('Tab updated:', tabId, url);

    // Проверяем, поддерживается ли сайт
    const isSupported = this.isSiteSupported(url);
    
    // Обновляем иконку
    this.updateIcon(tabId, isSupported);
  }

  /**
   * Обработка команд
   */
  private async handleCommand(command: string): Promise<void> {
    console.log('Command received:', command);

    switch (command) {
      case 'toggle-extension':
        await this.toggleExtension();
        break;

      case 'quick-select':
        await this.startQuickSelect();
        break;
    }
  }

  /**
   * Обработка клика по иконке
   */
  private async handleActionClick(tab: chrome.tabs.Tab): Promise<void> {
    if (!tab.id || !tab.url) return;

    console.log('Action clicked for tab:', tab.id, tab.url);

    // Проверяем, поддерживается ли сайт
    if (!this.isSiteSupported(tab.url)) {
      // Показываем уведомление
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon-48.png',
        title: 'Parser Config Builder',
        message: 'Данный сайт не поддерживается. Попробуйте открыть страницу манги или комиксов.'
      });
      return;
    }

    // Переключаем состояние расширения
    await this.toggleExtension();
  }

  /**
   * Переключить состояние расширения
   */
  private async toggleExtension(): Promise<void> {
    if (!this.activeTabId) return;

    try {
      const message = this.isExtensionActive 
        ? { type: 'DEACTIVATE_EXTENSION', id: 'bg_' + Date.now(), timestamp: Date.now() }
        : { type: 'ACTIVATE_EXTENSION', id: 'bg_' + Date.now(), timestamp: Date.now() };

      const response = await this.sendMessageToTab(this.activeTabId, message);
      
      if (response.success) {
        this.isExtensionActive = !this.isExtensionActive;
        await this.updateIcon(this.activeTabId, this.isExtensionActive);
        
        console.log('Extension toggled:', this.isExtensionActive ? 'activated' : 'deactivated');
      }
    } catch (error) {
      console.error('Failed to toggle extension:', error);
    }
  }

  /**
   * Запустить быстрый выбор элемента
   */
  private async startQuickSelect(): Promise<void> {
    if (!this.activeTabId) return;

    try {
      const message = {
        type: 'START_SELECTION',
        id: 'bg_' + Date.now(),
        timestamp: Date.now(),
        fieldName: 'quick_select',
        fieldType: 'string'
      };

      await this.sendMessageToTab(this.activeTabId, message);
      console.log('Quick select started');
    } catch (error) {
      console.error('Failed to start quick select:', error);
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
   * Обновить иконку расширения
   */
  private async updateIcon(tabId: number, isActive?: boolean): Promise<void> {
    const iconPath = isActive 
      ? 'icons/icon-active' 
      : 'icons/icon';

    try {
      await chrome.action.setIcon({
        tabId,
        path: {
          16: `${iconPath}-16.png`,
          32: `${iconPath}-32.png`,
          48: `${iconPath}-48.png`,
          128: `${iconPath}-128.png`
        }
      });
    } catch (error) {
      console.warn('Failed to update icon:', error);
    }
  }

  /**
   * Получить информацию о вкладке
   */
  private async getTabInfo(tabId?: number): Promise<MessageResponse> {
    if (!tabId) {
      return { success: false, error: 'No tab ID provided' };
    }

    try {
      const tab = await chrome.tabs.get(tabId);
      return {
        success: true,
        data: {
          id: tab.id,
          url: tab.url,
          title: tab.title,
          isSupported: this.isSiteSupported(tab.url || '')
        }
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Обновить badge на иконке
   */
  private async updateBadge(data: any): Promise<MessageResponse> {
    try {
      await chrome.action.setBadgeText({ text: data.text || '' });
      await chrome.action.setBadgeBackgroundColor({ color: data.color || '#1890ff' });
      
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Сохранить временные данные
   */
  private async storeTempData(data: any): Promise<MessageResponse> {
    try {
      const key = `temp_${data.key}`;
      await chrome.storage.session.set({ [key]: data.value });
      
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Получить временные данные
   */
  private async getTempData(data: any): Promise<MessageResponse> {
    try {
      const key = `temp_${data.key}`;
      const result = await chrome.storage.session.get(key);
      
      return { success: true, data: result[key] };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Отправить сообщение в вкладку
   */
  private async sendMessageToTab(tabId: number, message: ExtensionMessage): Promise<MessageResponse> {
    return new Promise((resolve) => {
      chrome.tabs.sendMessage(tabId, message, (response) => {
        if (chrome.runtime.lastError) {
          resolve({ 
            success: false, 
            error: chrome.runtime.lastError.message 
          });
        } else {
          resolve(response || { success: true });
        }
      });
    });
  }
}

// Инициализация background script
if (typeof globalThis !== 'undefined' && !globalThis.parserConfigBackground) {
  globalThis.parserConfigBackground = new ParserConfigBackground();
}

export default ParserConfigBackground;
