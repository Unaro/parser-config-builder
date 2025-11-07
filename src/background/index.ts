/**
 * Background Service Worker
 * @module background
 */

import { browser } from '@lib/utils/browser-api';
import { configRepository } from '@lib/storage/config-repository';
import type { ParserConfig } from '@lib/types/parser.types';

console.log('[Background] Service Worker started');

browser.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
  const msg = message as { type: string; config?: ParserConfig; configId?: string };
  
  console.log('[Background] Message received:', msg.type);

  // Все операции асинхронные - всегда возвращаем true
  (async () => {
    try {
      if (msg.type === 'CONFIG_CREATED' && msg.config) {
        await configRepository.save(msg.config);
        console.log('[Background] Config saved:', msg.config.name);
        sendResponse({ success: true });
        return;
      }

      if (msg.type === 'CONFIG_UPDATED' && msg.config) {
        await configRepository.save(msg.config);
        console.log('[Background] Config updated:', msg.config.name);
        sendResponse({ success: true });
        return;
      }

      if (msg.type === 'CONFIG_DELETED' && msg.configId) {
        await configRepository.delete(msg.configId);
        console.log('[Background] Config deleted:', msg.configId);
        sendResponse({ success: true });
        return;
      }

      if (msg.type === 'GET_CONFIGS') {
        const configs = await configRepository.findAll();
        sendResponse({ success: true, configs });
        return;
      }

      sendResponse({ success: false, error: 'Unknown message type' });
    } catch (error) {
      console.error('[Background] Error:', error);
      sendResponse({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  })();

  // Возвращаем true чтобы указать что sendResponse будет вызван асинхронно
  return true;
});
