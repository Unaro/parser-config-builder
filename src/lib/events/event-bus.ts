/**
 * Event Bus для расширения (background ↔ content ↔ popup)
 * Реализация событийной архитектуры
 * @module event-bus
 * @version 1.0.0
 */

import type { DomainEvent, EventHandler, UnsubscribeFn } from '../types/events.types';
import { runtime } from '../utils/browser-api';

/**
 * Event Bus для коммуникации между компонентами расширения
 */
export class ExtensionEventBus {
  private handlers: Map<string, Set<EventHandler<unknown>>> = new Map();

  constructor() {
    // Подписываемся на runtime.onMessage для получения событий
    runtime.onMessage.addListener((message: unknown) => {
      if (this.isEventMessage(message)) {
        void this.handleIncomingEvent(message.event);
      }
    });
  }

  /**
   * Опубликовать событие (отправить всем подписчикам)
   */
  async publish<T>(event: DomainEvent<T>): Promise<void> {
    // Локальная обработка
    await this.handleIncomingEvent(event);

    // Отправка в другие части расширения через runtime.sendMessage
    try {
      await runtime.sendMessage({ event });
    } catch (error) {
      // Игнорируем ошибки если нет получателей
      console.warn('No listeners for event:', event.type);
    }
  }

  /**
   * Подписаться на событие определенного типа
   */
  subscribe<T>(
    eventType: string,
    handler: EventHandler<T>
  ): UnsubscribeFn {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }

    const handlers = this.handlers.get(eventType);
    if (handlers) {
      handlers.add(handler as EventHandler<unknown>);
    }

    // Возвращаем функцию отписки
    return () => {
      const handlers = this.handlers.get(eventType);
      if (handlers) {
        handlers.delete(handler as EventHandler<unknown>);
      }
    };
  }

  /**
   * Отписаться от всех событий типа
   */
  unsubscribeAll(eventType: string): void {
    this.handlers.delete(eventType);
  }

  /**
   * Обработка входящего события
   */
  private async handleIncomingEvent<T>(event: DomainEvent<T>): Promise<void> {
    const handlers = this.handlers.get(event.type);
    
    if (!handlers || handlers.size === 0) {
      return;
    }

    // Выполняем все обработчики параллельно
    const promises = Array.from(handlers).map(handler => 
      Promise.resolve(handler(event))
    );

    await Promise.allSettled(promises);
  }

  /**
   * Type guard для проверки сообщения на событие
   */
  private isEventMessage(message: unknown): message is { event: DomainEvent<unknown> } {
    return (
      typeof message === 'object' &&
      message !== null &&
      'event' in message &&
      typeof (message as { event: unknown }).event === 'object' &&
      (message as { event: unknown }).event !== null &&
      'type' in (message as { event: { type: unknown } }).event
    );
  }
}

/**
 * Глобальный singleton экземпляр Event Bus
 */
export const eventBus = new ExtensionEventBus();
