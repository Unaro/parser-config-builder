/**
 * Parser Types v4.4 - Multiple Selectors
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

export type PreParseActionType = 
  | 'disable-interactions'
  | 'remove-overlays'
  | 'expand-all'
  | 'trigger-hover'
  | 'wait-for-element'
  | 'remove-elements'
  | 'force-visible';

export interface PreParseAction {
  type: PreParseActionType;
  selector?: string;
  timeout?: number;
  executeOnce?: boolean;
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

export interface DOMSnapshotConfig {
  enabled: boolean;
  captureSelector?: string;
  removeInteractive?: boolean;
  freezeAnimations?: boolean;
}

/**
 * CustomField - теперь поддерживает множественные селекторы
 */
export interface CustomField {
  id: string;
  name: string;
  key: string;
  type: FieldType;
  
  /**
   * Селектор или массив селекторов
   * Для array: все селекторы объединяются в один массив
   * Для string: берется первый найденный
   */
  selector: string;
  selectors?: string[];  // NEW: множественные селекторы
  
  required: boolean;
  description?: string;
  transform?: FieldTransform;
  
  arrayItemType?: ArrayItemType;
  customObjectTypeId?: string;
  loadConfig?: FieldLoadConfig;
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
  preParseActions?: PreParseAction[];
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
