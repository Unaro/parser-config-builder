/**
 * Утилиты для обмена сообщениями в расширении
 */

import type { ExtensionMessage, MessageResponse } from '@/types';

/**
 * Отправить сообщение в content script
 */
export async function sendMessageToContentScript(
  message: ExtensionMessage
): Promise<MessageResponse> {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (!activeTab?.id) {
        resolve({ success: false, error: 'No active tab found' });
        return;
      }
      
      chrome.tabs.sendMessage(activeTab.id, message, (response) => {
        if (chrome.runtime.lastError) {
          resolve({ 
            success: false, 
            error: chrome.runtime.lastError.message ?? 'Unknown error'
          });
        } else {
          resolve(response || { success: true });
        }
      });
    });
  });
}

/**
 * Отправить сообщение в background script
 */
export async function sendMessageToBackground(
  message: ExtensionMessage
): Promise<MessageResponse> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        resolve({ 
          success: false, 
          error: chrome.runtime.lastError.message ?? 'Unknown error'
        });
      } else {
        resolve(response || { success: true });
      }
    });
  });
}

/**
 * Широковещательное сообщение во все content scripts
 */
export async function broadcastMessage(
  message: ExtensionMessage
): Promise<MessageResponse[]> {
  return new Promise((resolve) => {
    chrome.tabs.query({}, (tabs) => {
      const promises = tabs.map(tab => {
        if (!tab.id) return Promise.resolve({ success: false, error: 'No tab ID' });
        
        return new Promise<MessageResponse>((resolve) => {
          chrome.tabs.sendMessage(tab.id!, message, (response) => {
            resolve(response || { success: true });
          });
        });
      });
      
      Promise.all(promises).then(resolve);
    });
  });
}

/**
 * Сгенерировать уникальный ID для сообщения
 */
export function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Создать базовое сообщение с правильной типизацией
 */
export function createBaseMessage<T extends ExtensionMessage['type']>(
  type: T
): Pick<ExtensionMessage, 'type' | 'id' | 'timestamp'> {
  return {
    type,
    id: generateMessageId(),
    timestamp: Date.now()
  };
}
