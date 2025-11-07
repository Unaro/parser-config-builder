/**
 * Parser Types v4.1 - Field-Level Load Strategy
 * @module types/parser.types
 */

export type FieldType = 'string' | 'array' | 'image' | 'url' | 'number' | 'custom-object';

/**
 * Стратегии загрузки для полей
 */
export type FieldLoadStrategy = 
  | 'none'              // Нет загрузки
  | 'click-expand'      // Клик на кнопку "Ещё" внутри поля
  | 'infinite-scroll'   // Infinite scroll привязан к последнему элементу массива
  | 'click-load-more'   // Клик на "Load More" для добавления элементов
  | 'hover-expand';     // Раскрытие при наведении

export interface FieldTransform {
  type: 'regex' | 'split' | 'slice' | 'replace';
  pattern?: string;
  replacement?: string;
  start?: number;
  end?: number;
}

/**
 * Настройки загрузки для поля
 */
export interface FieldLoadConfig {
  strategy: FieldLoadStrategy;
  
  // Для click-expand и click-load-more
  buttonSelector?: string;
  
  // Общие настройки
  maxIterations?: number;      // Сколько раз кликать/скроллить
  waitAfterAction?: number;    // Задержка после действия (ms)
  stopWhenNoChange?: boolean;  // Остановиться если элементов не добавилось
}

export interface CustomField {
  id: string;
  name: string;
  key: string;
  type: FieldType;
  selector: string;
  required: boolean;
  description?: string;
  transform?: FieldTransform;
  customObjectTypeId?: string;
  
  // Load Strategy для этого поля
  loadConfig?: FieldLoadConfig;
}

export interface ObjectFieldDefinition {
  id: string;
  name: string;
  key: string;
  type: Exclude<FieldType, 'custom-object'>;
  selector: string;
  required: boolean;
}

export interface CustomObjectType {
  id: string;
  name: string;
  containerSelector: string;
  fields: ObjectFieldDefinition[];
}

export interface SubPage {
  id: string;
  name: string;
  urlPattern: string;
  fields: CustomField[];
}

/**
 * Конфигурация страницы
 * Page Load Strategy удален - теперь только на уровне полей
 */
export interface PageConfig {
  id: string;
  name: string;
  urlPattern: string;
  
  // Tab switching на уровне страницы (опционально)
  tabSelector?: string;
  
  commonFields: readonly CustomField[];
  subPages?: readonly SubPage[];
  customObjectTypes: readonly CustomObjectType[];
  
  // Deprecated
  fields: readonly CustomField[];
  loadStrategy?: any;
}

export interface ParserConfig {
  id: string;
  name: string;
  version: string;
  targetUrl: string;
  pages: readonly PageConfig[];
  metadata: {
    created: Date;
    updated: Date;
    author: string;
    tags: string[];
    siteUrl: string;
  };
}

export interface ParsedPageData {
  pageType: string;
  data: Record<string, unknown>;
}

export interface FieldPreset {
  name: string;
  key: string;
  type: FieldType;
  description: string;
  commonSelectors?: string[];
  required?: boolean;
}

// Deprecated (обратная совместимость)
export type ParsedData = ParsedPageData;
export type LoadStrategy = FieldLoadStrategy;
export type WaitStrategy = FieldLoadConfig;

export interface SelectorValidationResult {
  isValid: boolean;
  elementCount: number;
  previewText?: string;
  arrayPreview?: string[];
  error?: string;
}
