/**
 * Типы для multi-page конфигурации парсера
 * @module parser.types
 * @version 2.0.0
 */

/**
 * Тип поля
 */
export type FieldType = 'string' | 'array' | 'object' | 'image' | 'url' | 'number';

/**
 * Тип загрузки данных
 */
export type LoadStrategy = 
  | 'static'           // Все данные сразу на странице
  | 'pagination'       // Пагинация с кнопками/ссылками
  | 'infinite-scroll'  // Бесконечный скролл
  | 'click-load'       // Кнопка "Load More"
  | 'tab-switch'       // Переключение табов
  | 'ajax-wait';       // Ожидание AJAX загрузки

/**
 * Стратегия ожидания загрузки
 */
export interface WaitStrategy {
  readonly type: LoadStrategy;
  readonly selector?: string;           // Селектор кнопки/элемента для действия
  readonly timeout?: number;            // Таймаут ожидания (мс)
  readonly scrollDistance?: number;     // Для infinite-scroll - расстояние до низа
  readonly waitForSelector?: string;    // Селектор элемента, который должен появиться
  readonly maxIterations?: number;      // Максимум итераций (для pagination/infinite)
}

/**
 * Конфигурация страницы
 */
export interface PageConfig {
  readonly id: string;
  readonly name: string;                // "Catalog", "Work", "Chapter", "Author"
  readonly urlPattern: string;          // Pattern для определения типа страницы
  readonly fields: readonly CustomField[];
  readonly loadStrategy: WaitStrategy;
  readonly description?: string;
}

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
  readonly transform?: FieldTransform;  // Трансформация значения
}

/**
 * Трансформация поля
 */
export interface FieldTransform {
  readonly type: 'regex' | 'split' | 'replace' | 'trim' | 'lowercase' | 'uppercase';
  readonly pattern?: string;
  readonly replacement?: string;
  readonly separator?: string;
}

/**
 * Основная multi-page конфигурация парсера
 */
export interface ParserConfig {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly targetUrl: string;             // Base URL сайта
  readonly pages: readonly PageConfig[];  // Конфигурации разных страниц
  readonly metadata: ParserMetadata;
  readonly options?: ParserOptions;
}

/**
 * Метаданные конфигурации
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
 * Результат парсинга страницы
 */
export interface ParsedPageData {
  readonly pageType: string;           // "catalog", "work", "chapter"
  readonly data: Record<string, unknown>;
  readonly hasMore?: boolean;          // Есть ли еще данные для загрузки
  readonly nextPageUrl?: string;
}

/**
 * Полный результат парсинга (все страницы)
 */
export type ParsedData = Record<string, unknown>;

/**
 * Статус валидации
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
