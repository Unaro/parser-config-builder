/**
 * Parser Types v4.3 - Pre-Parse Actions & DOM Snapshot
 * @module types/parser.types
 */

export type FieldType = 'string' | 'array' | 'image' | 'url' | 'number' | 'custom-object';
export type ArrayItemType = 'string' | 'number' | 'image' | 'url' | 'custom-object';

export type FieldLoadStrategy = 
  | 'none'
  | 'click-expand'
  | 'infinite-scroll'
  | 'click-load-more'
  | 'hover-expand';

/**
 * Действия перед парсингом для подготовки страницы
 */
export type PreParseActionType = 
  | 'disable-interactions'   // Отключить все onclick/hover события
  | 'remove-overlays'        // Удалить модальные окна, popups
  | 'expand-all'             // Раскрыть все collapsible элементы
  | 'trigger-hover'          // Триггерить hover на элементах
  | 'wait-for-element'       // Ждать появления элемента
  | 'remove-elements'        // Удалить мешающие элементы
  | 'force-visible';         // Сделать скрытые элементы видимыми

export interface PreParseAction {
  type: PreParseActionType;
  selector?: string;          // Для trigger-hover, remove-elements, wait-for-element
  timeout?: number;           // Для wait-for-element
  executeOnce?: boolean;      // Выполнить только один раз при первом парсинге
}

export interface FieldTransform {
  type: 'regex' | 'split' | 'slice' | 'replace';
  pattern?: string;
  replacement?: string;
  start?: number;
  end?: number;
}

export interface FieldLoadConfig {
  strategy: FieldLoadStrategy;
  buttonSelector?: string;
  maxIterations?: number;
  waitAfterAction?: number;
  stopWhenNoChange?: boolean;
}

/**
 * Snapshot настройки для сохранения состояния DOM
 */
export interface DOMSnapshotConfig {
  enabled: boolean;              // Включить snapshot перед парсингом
  captureSelector?: string;      // Захватить только определенную часть DOM
  removeInteractive?: boolean;   // Удалить интерактивные обработчики
  freezeAnimations?: boolean;    // Заморозить анимации
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
  
  arrayItemType?: ArrayItemType;
  customObjectTypeId?: string;
  loadConfig?: FieldLoadConfig;
  
  // Pre-parse actions для этого поля
  preParseActions?: PreParseAction[];
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
  
  // Pre-parse actions для всей подстраницы
  preParseActions?: PreParseAction[];
}

export interface PageConfig {
  id: string;
  name: string;
  urlPattern: string;
  tabSelector?: string;
  
  commonFields: readonly CustomField[];
  subPages?: readonly SubPage[];
  customObjectTypes: readonly CustomObjectType[];
  
  // Pre-parse actions для всей страницы (выполняются первыми)
  preParseActions?: PreParseAction[];
  
  // DOM Snapshot настройки
  snapshotConfig?: DOMSnapshotConfig;
  
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
