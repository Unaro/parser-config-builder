/**
 * Сообщения между компонентами расширения
 */

import type { ParserConfig, TestResult, PageType } from './config';
import type { GeneratedSelector, SelectorConfig } from './selector';
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
 * Ответ на сообщение
 */
export interface MessageResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string | undefined;
}

// === Основные сообщения ===

/**
 * Активация расширения
 */
export interface ActivateExtensionMessage extends BaseMessage {
  type: 'ACTIVATE_EXTENSION';
  pageType?: PageType;
}

/**
 * Деактивация расширения
 */
export interface DeactivateExtensionMessage extends BaseMessage {
  type: 'DEACTIVATE_EXTENSION';
}

/**
 * Получение статуса расширения
 */
export interface GetStatusMessage extends BaseMessage {
  type: 'GET_STATUS';
}

/**
 * Ответ со статусом
 */
export interface StatusResponse {
  isActive: boolean;
  hasSidebar: boolean;
  pageType?: PageType;
  domain: string;
  selectingField?: string;
  fieldsCount: number;
  selectorsCount: number;
}

/**
 * Переключение состояния
 */
export interface ToggleActiveMessage extends BaseMessage {
  type: 'TOGGLE_ACTIVE';
  pageType?: PageType;
}

// === Сообщения выбора ===

/**
 * Начало выбора элемента
 */
export interface StartSelectionMessage extends BaseMessage {
  type: 'START_SELECTION';
  fieldName: string;
  fieldType: string;
}

/**
 * Остановка выбора
 */
export interface StopSelectionMessage extends BaseMessage {
  type: 'STOP_SELECTION';
}

/**
 * Уведомление о выбранном элементе
 */
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

/**
 * Уведомление о наведении на элемент
 */
export interface ElementHoveredMessage extends BaseMessage {
  type: 'ELEMENT_HOVERED';
  element: {
    tagName: string;
    textContent: string | null;
    attributes: Record<string, string>;
  };
}

// === Конфигурация ===

/**
 * Получение конфига
 */
export interface GetConfigMessage extends BaseMessage {
  type: 'GET_CONFIG';
}

/**
 * Сохранение конфига
 */
export interface SaveConfigMessage extends BaseMessage {
  type: 'SAVE_CONFIG';
  config: ParserConfig;
}

/**
 * Обновление схемы
 */
export interface UpdateSchemaMessage extends BaseMessage {
  type: 'UPDATE_SCHEMA';
  schema: DataSchema;
}

/**
 * Обновление селектора
 */
export interface UpdateSelectorMessage extends BaseMessage {
  type: 'UPDATE_SELECTOR';
  fieldName: string;
  selectorConfig: SelectorConfig;
}

/**
 * Обновление типа страницы
 */
export interface UpdatePageTypeMessage extends BaseMessage {
  type: 'UPDATE_PAGE_TYPE';
  pageType: PageType;
}

// === Тестирование ===

/**
 * Тестирование конфига
 */
export interface TestConfigMessage extends BaseMessage {
  type: 'TEST_CONFIG';
  config: ParserConfig;
}

/**
 * Подсветка элемента
 */
export interface HighlightElementMessage extends BaseMessage {
  type: 'HIGHLIGHT_ELEMENT';
  selector: string;
}

/**
 * Дополнительные сообщения для Background Service
 */
export interface GetTabInfoMessage extends BaseMessage {
  type: 'GET_TAB_INFO';
}

export interface UpdateBadgeMessage extends BaseMessage {
  type: 'UPDATE_BADGE';
  data: { text?: string; color?: string };
}

export interface StoreTempDataMessage extends BaseMessage {
  type: 'STORE_TEMP_DATA';
  data: { key: string; value: unknown };
}

export interface GetTempDataMessage extends BaseMessage {
  type: 'GET_TEMP_DATA';
  data: { key: string };
}

/**
 * Общие типы сообщений
 */
export type ExtensionMessage = 
  | ActivateExtensionMessage
  | DeactivateExtensionMessage
  | GetStatusMessage
  | ToggleActiveMessage
  | StartSelectionMessage
  | StopSelectionMessage
  | ElementSelectedMessage
  | ElementHoveredMessage
  | GetConfigMessage
  | SaveConfigMessage
  | UpdateSchemaMessage
  | UpdateSelectorMessage
  | UpdatePageTypeMessage
  | TestConfigMessage
  | HighlightElementMessage
  | GetTabInfoMessage
  | UpdateBadgeMessage
  | StoreTempDataMessage
  | GetTempDataMessage;

/**
 * Обработчик сообщений
 */
export type MessageHandler<T extends BaseMessage = BaseMessage> = (
  message: T
) => Promise<MessageResponse> | MessageResponse;

/**
 * Создать базовое сообщение
 */
export function createBaseMessage<T extends ExtensionMessage['type']>(
  type: T
): Pick<BaseMessage, 'type' | 'id' | 'timestamp'> {
  return {
    type,
    id: generateMessageId(),
    timestamp: Date.now()
  };
}

/**
 * Генерация уникального ID для сообщения
 */
function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}