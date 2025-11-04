/**
 * Сообщения между компонентами расширения
 */

import type { ParserConfig, TestResult } from './config';
import type { GeneratedSelector } from './selector';
import type { DataSchema } from './schema';

/**
 * Базовый тип сообщения
 */
export interface BaseMessage {
  type: string;
  id: string;
  timestamp: number;
}

/**
 * Сообщения от Popup к Content Script
 */
export type PopupMessage = 
  | ActivateExtensionMessage
  | DeactivateExtensionMessage
  | GetConfigMessage
  | SaveConfigMessage;

export interface ActivateExtensionMessage extends BaseMessage {
  type: 'ACTIVATE_EXTENSION';
  pageType?: string;
}

export interface DeactivateExtensionMessage extends BaseMessage {
  type: 'DEACTIVATE_EXTENSION';
}

export interface GetConfigMessage extends BaseMessage {
  type: 'GET_CONFIG';
}

export interface SaveConfigMessage extends BaseMessage {
  type: 'SAVE_CONFIG';
  config: ParserConfig;
}

/**
 * Сообщения от Content Script к Sidebar
 */
export type ContentMessage =
  | ElementSelectedMessage
  | ElementHoveredMessage
  | TestCompleteMessage
  | ConfigUpdatedMessage;

export interface ElementSelectedMessage extends BaseMessage {
  type: 'ELEMENT_SELECTED';
  fieldName: string;
  element: {
    tagName: string;
    textContent: string | null;
    attributes: Record<string, string>;
    outerHTML: string;
  };
  selector: GeneratedSelector;
}

export interface ElementHoveredMessage extends BaseMessage {
  type: 'ELEMENT_HOVERED';
  element: {
    tagName: string;
    textContent: string | null;
    attributes: Record<string, string>;
  };
}

export interface TestCompleteMessage extends BaseMessage {
  type: 'TEST_COMPLETE';
  results: TestResult[];
}

export interface ConfigUpdatedMessage extends BaseMessage {
  type: 'CONFIG_UPDATED';
  config: ParserConfig;
}

/**
 * Сообщения от Sidebar к Content Script
 */
export type SidebarMessage =
  | StartSelectionMessage
  | StopSelectionMessage
  | TestConfigMessage
  | UpdateSchemaMessage
  | HighlightElementMessage;

export interface StartSelectionMessage extends BaseMessage {
  type: 'START_SELECTION';
  fieldName: string;
  fieldType: string;
}

export interface StopSelectionMessage extends BaseMessage {
  type: 'STOP_SELECTION';
}

export interface TestConfigMessage extends BaseMessage {
  type: 'TEST_CONFIG';
  config: ParserConfig;
}

export interface UpdateSchemaMessage extends BaseMessage {
  type: 'UPDATE_SCHEMA';
  schema: DataSchema;
}

export interface HighlightElementMessage extends BaseMessage {
  type: 'HIGHLIGHT_ELEMENT';
  selector: string;
}

/**
 * Общие типы сообщений
 */
export type ExtensionMessage = 
  | PopupMessage 
  | ContentMessage 
  | SidebarMessage;

/**
 * Ответ на сообщение
 */
export interface MessageResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Обработчик сообщений
 */
export type MessageHandler<T extends BaseMessage = BaseMessage> = (
  message: T
) => Promise<MessageResponse> | MessageResponse;
