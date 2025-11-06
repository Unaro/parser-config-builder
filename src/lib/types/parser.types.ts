/**
 * Типы для конфигурации парсера манги/комиксов
 * @module parser.types
 * @version 1.0.0
 */

/**
 * Тип поля селектора
 */
export type FieldType = 'string' | 'array' | 'object' | 'image';

/**
 * Определение кастомного поля
 */
export interface CustomField {
  readonly id: string;
  readonly name: string;
  readonly key: string;
  readonly type: FieldType;
  readonly selector: string;
  readonly required: boolean;
  readonly description?: string;
}

/**
 * Основная конфигурация парсера для сайта
 */
export interface ParserConfig {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly targetUrl: string;
  readonly fields: readonly CustomField[];
  readonly metadata: ParserMetadata;
  readonly options?: ParserOptions;
}

/**
 * Метаданные конфигурации парсера
 */
export interface ParserMetadata {
  readonly created: Date;
  readonly updated: Date;
  readonly author: string;
  readonly tags: readonly string[];
  readonly siteUrl: string;
  readonly description?: string;
}

/**
 * Опции парсера
 */
export interface ParserOptions {
  readonly delay?: number;
  readonly maxRetries?: number;
  readonly userAgent?: string;
  readonly headers?: Record<string, string>;
}

/**
 * Результат парсинга (динамический)
 */
export type ParsedData = Record<string, string | string[] | Record<string, unknown>>;

/**
 * Статус валидации селектора
 */
export type SelectorValidationStatus = 'valid' | 'invalid' | 'pending' | 'untested';

/**
 * Результат валидации селектора
 */
export interface SelectorValidationResult {
  readonly selector: string;
  readonly status: SelectorValidationStatus;
  readonly elementCount: number;
  readonly error?: string;
  readonly previewText?: string;
  readonly arrayPreview?: string[];
}

// Устаревшие типы для обратной совместимости (будут удалены)
export interface SelectorConfig {
  readonly title: string;
  readonly chapters: string;
  readonly images: string;
  readonly nextPage?: string;
  readonly author?: string;
  readonly description?: string;
  readonly cover?: string;
  readonly tags?: string;
}

export interface Chapter {
  readonly id: string;
  readonly title: string;
  readonly url: string;
  readonly number: number;
  readonly pages?: readonly Page[];
}

export interface Page {
  readonly number: number;
  readonly imageUrl: string;
}
