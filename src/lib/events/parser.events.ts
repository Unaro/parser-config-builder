/**
 * События парсера
 * @module parser.events
 * @version 1.0.0
 */

import type { DomainEvent } from '../types/events.types';
import type { ParserConfig, ParsedData, SelectorValidationResult } from '../types/parser.types';

export interface ParserConfigCreatedEvent extends DomainEvent<ParserConfig> {
  readonly type: 'parser.config.created';
  readonly aggregateType: 'ParserConfig';
}

export interface ParserConfigUpdatedEvent extends DomainEvent<ParserConfig> {
  readonly type: 'parser.config.updated';
  readonly aggregateType: 'ParserConfig';
}

export interface ParserConfigDeletedEvent extends DomainEvent<{ configId: string }> {
  readonly type: 'parser.config.deleted';
  readonly aggregateType: 'ParserConfig';
}

export interface ParserTestExecutedEvent extends DomainEvent<{
  configId: string;
  results: ParsedData;
  success: boolean;
  duration: number;
}> {
  readonly type: 'parser.test.executed';
  readonly aggregateType: 'ParserTest';
}

export interface SelectorValidatedEvent extends DomainEvent<SelectorValidationResult> {
  readonly type: 'selector.validated';
  readonly aggregateType: 'Selector';
}

export interface ElementPickRequestEvent extends DomainEvent<{
  fieldId: string;
  fieldType: string;
}> {
  readonly type: 'element.pick.request';
  readonly aggregateType: 'ElementPicker';
}

export interface ElementPickedEvent extends DomainEvent<{
  fieldId: string;
  selector: string;
  previewText: string;
  arrayPreview?: string[];
  elementCount: number;
}> {
  readonly type: 'element.picked';
  readonly aggregateType: 'ElementPicker';
}

export interface ElementPickCancelledEvent extends DomainEvent<{
  fieldId: string;
}> {
  readonly type: 'element.pick.cancelled';
  readonly aggregateType: 'ElementPicker';
}

export class ParserEventFactory {
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

  static createElementPickRequest(fieldId: string, fieldType: string): ElementPickRequestEvent {
    return {
      type: 'element.pick.request',
      aggregateType: 'ElementPicker',
      aggregateId: crypto.randomUUID(),
      data: { fieldId, fieldType },
      timestamp: new Date(),
      eventId: crypto.randomUUID(),
      version: 1
    };
  }

  static createElementPicked(
    fieldId: string,
    selector: string,
    previewText: string,
    elementCount: number,
    arrayPreview?: string[]
  ): ElementPickedEvent {
    return {
      type: 'element.picked',
      aggregateType: 'ElementPicker',
      aggregateId: crypto.randomUUID(),
      data: { fieldId, selector, previewText, elementCount, arrayPreview },
      timestamp: new Date(),
      eventId: crypto.randomUUID(),
      version: 1
    };
  }

  static createElementPickCancelled(fieldId: string): ElementPickCancelledEvent {
    return {
      type: 'element.pick.cancelled',
      aggregateType: 'ElementPicker',
      aggregateId: crypto.randomUUID(),
      data: { fieldId },
      timestamp: new Date(),
      eventId: crypto.randomUUID(),
      version: 1
    };
  }
}
