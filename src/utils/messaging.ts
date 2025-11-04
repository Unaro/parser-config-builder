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
  console.log('Messaging: sendMessageToContentScript called with:', message);
  
  return new Promise((resolve) => {
    console.log('Messaging: Querying active tab...');
    
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      console.log('Messaging: Active tabs found:', tabs);
      
      const activeTab = tabs[0];
      if (!activeTab?.id) {
        console.error('Messaging: No active tab found');
        resolve({ success: false, error: 'No active tab found' });
        return;
      }
      
      console.log('Messaging: Sending message to tab:', activeTab.id, message);
      
      chrome.tabs.sendMessage(activeTab.id, message, (response) => {
        console.log('Messaging: Raw response:', response);
        console.log('Messaging: Chrome runtime error:', chrome.runtime.lastError);
        
        if (chrome.runtime.lastError) {
          const errorMsg = chrome.runtime.lastError.message ?? 'Unknown error';
          console.error('Messaging: Chrome runtime error occurred:', errorMsg);
          resolve({ 
            success: false, 
            error: errorMsg
          });
        } else {
          console.log('Messaging: Message sent successfully, response:', response);
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
  console.log('Messaging: sendMessageToBackground called with:', message);
  
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response) => {
      console.log('Messaging: Background response:', response);
      console.log('Messaging: Chrome runtime error:', chrome.runtime.lastError);
      
      if (chrome.runtime.lastError) {
        const errorMsg = chrome.runtime.lastError.message ?? 'Unknown error';
        console.error('Messaging: Background error:', errorMsg);
        resolve({ 
          success: false, 
          error: errorMsg
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
