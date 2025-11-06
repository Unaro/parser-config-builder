/**
 * Unified API для Firefox и Chrome
 * Firefox использует Promises, Chrome использует callbacks
 * @module browser-api
 * @version 1.0.0
 */

import browser from 'webextension-polyfill';

export { browser };

/**
 * Type-safe обертка над browser.storage.local
 */
export const storage = {
  /**
   * Получить значение из хранилища
   */
  async get<T>(key: string): Promise<T | undefined> {
    const result = await browser.storage.local.get(key);
    return result[key] as T | undefined;
  },

  /**
   * Сохранить значение в хранилище
   */
  async set<T>(key: string, value: T): Promise<void> {
    await browser.storage.local.set({ [key]: value });
  },

  /**
   * Удалить значение из хранилища
   */
  async remove(key: string): Promise<void> {
    await browser.storage.local.remove(key);
  },

  /**
   * Очистить все хранилище
   */
  async clear(): Promise<void> {
    await browser.storage.local.clear();
  },

  /**
   * Получить все ключи и значения
   */
  async getAll(): Promise<Record<string, unknown>> {
    return await browser.storage.local.get(null);
  }
};

/**
 * Type-safe обертка над browser.runtime
 */
export const runtime = {
  /**
   * Отправить сообщение
   */
  async sendMessage<T, R>(message: T): Promise<R> {
    return await browser.runtime.sendMessage(message) as R;
  },

  /**
   * Подписаться на сообщения
   */
  onMessage: browser.runtime.onMessage
};

/**
 * Type-safe обертка над browser.tabs
 */
export const tabs = {
  /**
   * Получить активную вкладку
   */
  async getActive(): Promise<browser.Tabs.Tab | undefined> {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    return tabs[0];
  },

  /**
   * Отправить сообщение на вкладку
   */
  async sendMessage<T, R>(tabId: number, message: T): Promise<R> {
    return await browser.tabs.sendMessage(tabId, message) as R;
  }
};
