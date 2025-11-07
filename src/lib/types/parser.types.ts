/**
 * Parser Types v3.1 - Custom Object Types
 * @module parser.types
 */

export type FieldType = 'string' | 'array' | 'custom-object' | 'image' | 'url' | 'number';
export type LoadStrategy = 'static' | 'pagination' | 'infinite-scroll' | 'click-load' | 'tab-switch' | 'ajax-wait';

export interface WaitStrategy {
  readonly type: LoadStrategy;
  readonly selector?: string;
  readonly timeout?: number;
  readonly scrollDistance?: number;
  readonly waitForSelector?: string;
  readonly maxIterations?: number;
}

/**
 * Определение поля внутри кастомного объекта
 */
export interface ObjectFieldDefinition {
  readonly id: string;
  readonly name: string;
  readonly key: string;
  readonly type: 'string' | 'number' | 'image' | 'url' | 'array';
  readonly selector: string;  // Относительный селектор
  readonly required: boolean;
}

/**
 * Определение кастомного типа объекта
 */
export interface CustomObjectType {
  readonly id: string;
  readonly name: string;  // "Work", "Chapter", "Author"
  readonly containerSelector: string;  // Селектор контейнера объекта
  readonly fields: readonly ObjectFieldDefinition[];  // Поля объекта
}

export interface FieldTransform {
  readonly type: 'regex' | 'split' | 'replace' | 'trim' | 'lowercase' | 'uppercase';
  readonly pattern?: string;
  readonly replacement?: string;
  readonly separator?: string;
}

/**
 * Поле парсера
 */
export interface CustomField {
  readonly id: string;
  readonly name: string;
  readonly key: string;
  readonly type: FieldType;
  readonly selector: string;
  readonly required: boolean;
  readonly description?: string;
  readonly transform?: FieldTransform;
  readonly customObjectTypeId?: string;  // ID кастомного типа если type === 'custom-object'
}

export interface PageConfig {
  readonly id: string;
  readonly name: string;
  readonly urlPattern: string;
  readonly fields: readonly CustomField[];
  readonly loadStrategy: WaitStrategy;
  readonly customObjectTypes: readonly CustomObjectType[];  // Определения кастомных типов для этой страницы
  readonly description?: string;
}

export interface ParserConfig {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly targetUrl: string;
  readonly pages: readonly PageConfig[];
  readonly metadata: ParserMetadata;
  readonly options?: ParserOptions;
}

export interface ParserMetadata {
  readonly created: Date;
  readonly updated: Date;
  readonly author: string;
  readonly tags: readonly string[];
  readonly siteUrl: string;
  readonly description?: string;
}

export interface ParserOptions {
  readonly delay?: number;
  readonly maxRetries?: number;
  readonly userAgent?: string;
  readonly headers?: Record<string, string>;
}

export interface ParsedPageData {
  readonly pageType: string;
  readonly data: Record<string, unknown>;
  readonly hasMore?: boolean;
  readonly nextPageUrl?: string;
}

export type ParsedData = Record<string, unknown>;
export type SelectorValidationStatus = 'valid' | 'invalid' | 'pending' | 'untested';

export interface SelectorValidationResult {
  readonly selector: string;
  readonly status: SelectorValidationStatus;
  readonly elementCount: number;
  readonly error?: string;
  readonly previewText?: string;
  readonly arrayPreview?: string[];
}
