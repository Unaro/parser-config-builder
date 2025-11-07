/**
 * Parser Types v4.2 - Array Item Types
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

export interface CustomField {
  id: string;
  name: string;
  key: string;
  type: FieldType;
  selector: string;
  required: boolean;
  description?: string;
  transform?: FieldTransform;
  
  // Для type: 'array'
  arrayItemType?: ArrayItemType;
  
  // Для arrayItemType: 'custom-object' или type: 'custom-object'
  customObjectTypeId?: string;
  
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

export interface PageConfig {
  id: string;
  name: string;
  urlPattern: string;
  tabSelector?: string;
  commonFields: readonly CustomField[];
  subPages?: readonly SubPage[];
  customObjectTypes: readonly CustomObjectType[];
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
