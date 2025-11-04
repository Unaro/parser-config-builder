import type { DataSchema } from './schema';
import type { SelectorConfig } from './selector';
import type { PlatformInfo } from './platform';

/**
 * Основная конфигурация парсера
 */
export interface ParserConfig {
  id: string;
  platform: PlatformInfo;
  pageType: PageType;
  schema: DataSchema;
  selectors: Record<string, SelectorConfig>;
  customParsers?: Record<string, CustomParser>;
  metadata: ConfigMetadata;
}

/**
 * Типы страниц
 */
export type PageType = 
  | 'work_detail'     // страница произведения
  | 'work_list'       // каталог произведений
  | 'chapter_list'    // список глав
  | 'chapter_read'    // страница чтения
  | 'team_profile'    // профиль команды
  | 'user_profile';   // профиль пользователя

/**
 * Пользовательские парсеры
 */
export interface CustomParser {
  type: 'regex' | 'function' | 'transform';
  config: Record<string, unknown>;
  description?: string;
}

/**
 * Метаданные конфига
 */
export interface ConfigMetadata {
  version: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  description?: string;
  tags?: string[];
  lastTested?: string;
  testResults?: TestResult[];
}

/**
 * Результат тестирования
 */
export interface TestResult {
  fieldName: string;
  success: boolean;
  extractedValue?: unknown;
  expectedType: string;
  actualType: string;
  error?: string;
  selector: string;
  timestamp: string;
}

/**
 * Конфигурация экспорта
 */
export interface ExportConfig {
  format: 'json' | 'yaml';
  minify: boolean;
  includeMetadata: boolean;
  includeFallbacks: boolean;
}
