/**
 * События парсера для коммуникации между компонентами расширения
 * @module parser.events
 * @version 1.0.0
 */

import type { DomainEvent } from '../types/events.types';
import type { ParserConfig, ParsedData, SelectorValidationResult } from '../types/parser.types';

/**
 * Событие создания конфигурации парсера
 */
export interface ParserConfigCreatedEvent extends DomainEvent<ParserConfig> {
  readonly type: 'parser.config.created';
  readonly aggregateType: 'ParserConfig';
}

/**
 * Событие обновления конфигурации парсера
 */
export interface ParserConfigUpdatedEvent extends DomainEvent<ParserConfig> {
  readonly type: 'parser.config.updated';
  readonly aggregateType: 'ParserConfig';
}

/**
 * Событие удаления конфигурации парсера
 */
export interface ParserConfigDeletedEvent extends DomainEvent<{ configId: string }> {
  readonly type: 'parser.config.deleted';
  readonly aggregateType: 'ParserConfig';
}

/**
 * Событие выполнения теста парсера
 */
export interface ParserTestExecutedEvent extends DomainEvent<{
  configId: string;
  results: ParsedData;
  success: boolean;
  duration: number;
}> {
  readonly type: 'parser.test.executed';
  readonly aggregateType: 'ParserTest';
}

/**
 * Событие валидации селектора
 */
export interface SelectorValidatedEvent extends DomainEvent<SelectorValidationResult> {
  readonly type: 'selector.validated';
  readonly aggregateType: 'Selector';
}

/**
 * Событие выбора элемента на странице (для визуального построения селектора)
 */
export interface ElementPickRequestEvent extends DomainEvent<{
  selectorType: 'title' | 'chapters' | 'images' | 'author' | 'description' | 'cover' | 'tags';
}> {
  readonly type: 'element.pick.request';
  readonly aggregateType: 'ElementPicker';
}

/**
 * Событие выбранного элемента на странице
 */
export interface ElementPickedEvent extends DomainEvent<{
  selectorType: 'title' | 'chapters' | 'images' | 'author' | 'description' | 'cover' | 'tags';
  selector: string;
  previewText: string;
}> {
  readonly type: 'element.picked';
  readonly aggregateType: 'ElementPicker';
}

/**
 * Фабрика для создания событий парсера
 */
export class ParserEventFactory {
  /**
   * Создать событие создания конфигурации
   */
  static createConfigCreated(config: ParserConfig): ParserConfigCreatedEvent {
    return {
      type: 'parser.config.created',
      aggregateType: 'ParserConfig',
      aggregateId: config.id,
      data: config,
      timestamp: new Date(),
      eventId: crypto.randomUUID(),
      version: 1
    };
  }

  /**
   * Создать событие обновления конфигурации
   */
  static createConfigUpdated(config: ParserConfig): ParserConfigUpdatedEvent {
    return {
      type: 'parser.config.updated',
      aggregateType: 'ParserConfig',
      aggregateId: config.id,
      data: config,
      timestamp: new Date(),
      eventId: crypto.randomUUID(),
      version: 1
    };
  }

  /**
   * Создать событие удаления конфигурации
   */
  static createConfigDeleted(configId: string): ParserConfigDeletedEvent {
    return {
      type: 'parser.config.deleted',
      aggregateType: 'ParserConfig',
      aggregateId: configId,
      data: { configId },
      timestamp: new Date(),
      eventId: crypto.randomUUID(),
      version: 1
    };
  }

  /**
   * Создать событие выполнения теста
   */
  static createTestExecuted(
    configId: string,
    results: ParsedData,
    success: boolean,
    duration: number
  ): ParserTestExecutedEvent {
    return {
      type: 'parser.test.executed',
      aggregateType: 'ParserTest',
      aggregateId: configId,
      data: { configId, results, success, duration },
      timestamp: new Date(),
      eventId: crypto.randomUUID(),
      version: 1
    };
  }

  /**
   * Создать событие запроса выбора элемента
   */
  static createElementPickRequest(
    selectorType: 'title' | 'chapters' | 'images' | 'author' | 'description' | 'cover' | 'tags'
  ): ElementPickRequestEvent {
    return {
      type: 'element.pick.request',
      aggregateType: 'ElementPicker',
      aggregateId: crypto.randomUUID(),
      data: { selectorType },
      timestamp: new Date(),
      eventId: crypto.randomUUID(),
      version: 1
    };
  }

  /**
   * Создать событие выбранного элемента
   */
  static createElementPicked(
    selectorType: 'title' | 'chapters' | 'images' | 'author' | 'description' | 'cover' | 'tags',
    selector: string,
    previewText: string
  ): ElementPickedEvent {
    return {
      type: 'element.picked',
      aggregateType: 'ElementPicker',
      aggregateId: crypto.randomUUID(),
      data: { selectorType, selector, previewText },
      timestamp: new Date(),
      eventId: crypto.randomUUID(),
      version: 1
    };
  }
}
