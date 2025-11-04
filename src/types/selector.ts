/**
 * Конфигурация селектора
 */
export interface SelectorConfig {
  primary: string;
  fallback: string[];
  type: ExtractionType;
  required: boolean;
  attribute?: string;    // название атрибута для type='attribute'
  validation?: ValidationRule;
  postProcess?: PostProcessor[];
  confidence: number;
  metadata: SelectorMetadata;
}

/**
 * Типы извлечения данных
 */
export type ExtractionType =
  | 'text'              // текстовое содержимое
  | 'attribute'         // атрибут элемента
  | 'html'              // HTML содержимое
  | 'array'             // массив элементов
  | 'count'             // количество элементов
  | 'exists'            // проверка существования
  | 'custom';           // пользовательский парсер

/**
 * Правила валидации
 */
export interface ValidationRule {
  type: 'string' | 'number' | 'boolean' | 'date' | 'url' | 'email' | 'array' | 'object';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  enum?: string[];
  format?: string;
}

/**
 * Пост-обработчики
 */
export interface PostProcessor {
  type: 'trim' | 'lowercase' | 'uppercase' | 'replace' | 'parse' | 'transform';
  config?: Record<string, unknown>;
}

/**
 * Метаданные селектора
 */
export interface SelectorMetadata {
  element?: Element;
  xpath?: string;
  cssPath?: string;
  generatedAt: string;
  confidence: number;
  strategy: SelectorStrategy;
}

/**
 * Стратегии генерации селекторов
 */
export type SelectorStrategy = 
  | 'data-attribute'    // data-* атрибуты
  | 'id'                // #id
  | 'class'             // .class
  | 'tag'               // тег
  | 'xpath'             // XPath
  | 'semantic'          // семантические атрибуты
  | 'position'          // позиционные
  | 'text-content';     // по текстовому содержимому

/**
 * Информация о сгенерированном селекторе
 */
export interface GeneratedSelector {
  selector: string;
  strategy: SelectorStrategy;
  confidence: number;
  uniqueness: number;
  stability: number;
  element: Element;
}