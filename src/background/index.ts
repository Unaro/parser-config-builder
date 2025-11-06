/**
 * Background Script для расширения
 * Service Worker в Chrome, Background Script в Firefox
 * @module background
 * @version 1.0.0
 */

import { browser } from '@lib/utils/browser-api';
import { eventBus } from '@lib/events/event-bus';
import { configRepository } from '@lib/storage/config-repository';
import type { 
  ParserConfigCreatedEvent,
  ParserConfigUpdatedEvent,
  ParserConfigDeletedEvent 
} from '@lib/events/parser.events';

console.log('[Background] Parser Config Builder extension loaded');

/**
 * Подписка на события конфигураций
 */
eventBus.subscribe<ParserConfigCreatedEvent['data']>(
  'parser.config.created',
  async (event) => {
    console.log('[Background] Config created:', event.data.name);
    await configRepository.save(event.data);
  }
);

eventBus.subscribe<ParserConfigUpdatedEvent['data']>(
  'parser.config.updated',
  async (event) => {
    console.log('[Background] Config updated:', event.data.name);
    await configRepository.save(event.data);
  }
);

eventBus.subscribe<ParserConfigDeletedEvent['data']>(
  'parser.config.deleted',
  async (event) => {
    console.log('[Background] Config deleted:', event.data.configId);
    await configRepository.delete(event.data.configId);
  }
);

/**
 * Обработка установки расширения
 */
browser.runtime.onInstalled.addListener((details: { reason: string }) => {
  console.log('[Background] Extension installed:', details.reason);
  
  if (details.reason === 'install') {
    // Первая установка - можно показать welcome страницу
    void browser.tabs.create({
      url: browser.runtime.getURL('options/index.html')
    });
  }
});

/**
 * Экспорт для тестов
 */
export { eventBus, configRepository };
