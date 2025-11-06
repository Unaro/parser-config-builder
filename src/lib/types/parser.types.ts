/**
 * Типы для конфигурации парсера манги/комиксов
 * @module parser.types
 * @version 1.0.0
 */

/**
 * Основная конфигурация парсера для сайта
 */
export interface ParserConfig {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly targetUrl: RegExp | string;
  readonly selectors: SelectorConfig;
  readonly metadata: ParserMetadata;
  readonly options?: ParserOptions;
}

/**
 * Конфигурация селекторов для извлечения данных
 */
export interface SelectorConfig {
  /** CSS-селектор для заголовка манги/комикса */
  readonly title: string;
  /** CSS-селектор для списка глав */
  readonly chapters: string;
  /** CSS-селектор для изображений страниц */
  readonly images: string;
  /** CSS-селектор для кнопки следующей страницы */
  readonly nextPage?: string;
  /** CSS-селектор для автора */
  readonly author?: string;
  /** CSS-селектор для описания */
  readonly description?: string;
  /** CSS-селектор для обложки */
  readonly cover?: string;
  /** CSS-селектор для жанров/тегов */
  readonly tags?: string;
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
  /** Задержка между запросами (мс) */
  readonly delay?: number;
  /** Максимальное количество попыток */
  readonly maxRetries?: number;
  /** User-Agent для запросов */
  readonly userAgent?: string;
  /** Дополнительные заголовки */
  readonly headers?: Record<string, string>;
}

/**
 * Результат парсинга
 */
export interface ParsedData {
  readonly title: string;
  readonly author?: string;
  readonly description?: string;
  readonly cover?: string;
  readonly tags?: readonly string[];
  readonly chapters: readonly Chapter[];
}

/**
 * Данные главы
 */
export interface Chapter {
  readonly id: string;
  readonly title: string;
  readonly url: string;
  readonly number: number;
  readonly pages?: readonly Page[];
}

/**
 * Данные страницы
 */
export interface Page {
  readonly number: number;
  readonly imageUrl: string;
}

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
}
