/**
 * Утилиты для работы с конфигурациями парсеров
 */

import type { 
  ParserConfig, 
  PageType,
  SchemaField,
  ExportConfig 
} from '@/types';
import { generateUniqueId } from './types';

/**
 * Создать пустой конфиг по умолчанию
 */
export function createDefaultConfig(
  domain: string = window.location.hostname,
  pageType: PageType = 'work_detail'
): ParserConfig {
  const now = new Date().toISOString();
  
  return {
    id: generateUniqueId(),
    platform: {
      name: domain.charAt(0).toUpperCase() + domain.slice(1),
      domain,
      baseUrl: `${window.location.protocol}//${domain}`,
      version: '1.0.0'
    },
    pageType,
    schema: {
      fields: [],
      metadata: {
        name: `${domain} - ${pageType}`,
        version: '1.0.0',
        createdAt: now,
        fieldsCount: 0,
        requiredFieldsCount: 0
      }
    },
    selectors: {},
    metadata: {
      version: '1.0.0',
      createdAt: now,
      updatedAt: now
    }
  };
}

/**
 * Создать базовую схему для типа страницы
 */
export function createBaseSchemaForPageType(pageType: PageType): SchemaField[] {
  switch (pageType) {
    case 'work_detail':
      return [
        { name: 'title', type: 'string', required: true, description: 'Название произведения' },
        { name: 'description', type: 'string', required: false, description: 'Описание произведения' },
        { name: 'rating', type: 'number', required: false, description: 'Рейтинг произведения' },
        { name: 'genres', type: 'array', required: false, arrayItemType: 'string', description: 'Жанры' },
        { name: 'status', type: 'string', required: false, description: 'Статус произведения' },
        { name: 'year', type: 'integer', required: false, description: 'Год выпуска' }
      ];
      
    case 'work_list':
      return [
        { name: 'works', type: 'array', required: true, arrayItemType: 'object', description: 'Список произведений' }
      ];
      
    case 'chapter_list':
      return [
        { name: 'chapters', type: 'array', required: true, arrayItemType: 'object', description: 'Список глав' }
      ];
      
    case 'team_profile':
      return [
        { name: 'name', type: 'string', required: true, description: 'Название команды' },
        { name: 'works_count', type: 'integer', required: false, description: 'Количество работ' },
        { name: 'members', type: 'array', required: false, arrayItemType: 'string', description: 'Участники команды' }
      ];
      
    default:
      return [
        { name: 'title', type: 'string', required: true, description: 'Заголовок страницы' }
      ];
  }
}

/**
 * Экспортировать конфиг в JSON
 */
export function exportConfigAsJSON(
  config: ParserConfig, 
  options: ExportConfig = { format: 'json', minify: false, includeMetadata: true, includeFallbacks: true }
): string {
  // Создаем копию конфига для экспорта
  const exportConfig: ParserConfig = JSON.parse(JSON.stringify(config));
  
  // Убираем метаданные если не нужны
  if (!options.includeMetadata) {
    if ('metadata' in exportConfig) {
      (exportConfig as any).metadata = undefined;
    }
    if (exportConfig.schema && 'metadata' in exportConfig.schema) {
      (exportConfig.schema as any).metadata = undefined;
    }
  }
  
  // Убираем fallback селекторы если не нужны
  if (!options.includeFallbacks) {
    for (const selector of Object.values(exportConfig.selectors)) {
      if ('fallback' in selector) {
        (selector as any).fallback = undefined;
      }
    }
  }
  
  return JSON.stringify(exportConfig, null, options.minify ? 0 : 2);
}

/**
 * Импортировать конфиг из JSON
 */
export function importConfigFromJSON(jsonString: string): ParserConfig {
  try {
    const config = JSON.parse(jsonString) as ParserConfig;
    
    // Базовая валидация структуры
    if (!config.platform?.domain || !config.pageType || !config.schema) {
      throw new Error('Invalid config structure');
    }
    
    // Обновляем метаданные при импорте
    config.metadata.updatedAt = new Date().toISOString();
    
    return config;
  } catch (error) {
    throw new Error(`Failed to import config: ${(error as Error).message}`);
  }
}

/**
 * Создать копию конфига
 */
export function cloneConfig(config: ParserConfig): ParserConfig {
  return JSON.parse(JSON.stringify(config));
}

/**
 * Объединить два конфига
 */
export function mergeConfigs(base: ParserConfig, override: Partial<ParserConfig>): ParserConfig {
  const merged = cloneConfig(base);
  
  // Объединяем основные свойства
  Object.assign(merged, override);
  
  // Объединяем селекторы
  if (override.selectors) {
    Object.assign(merged.selectors, override.selectors);
  }
  
  // Обновляем метаданные
  merged.metadata.updatedAt = new Date().toISOString();
  
  return merged;
}

/**
 * Получить статистику конфига
 */
export function getConfigStats(config: ParserConfig): {
  fieldsCount: number;
  selectorsCount: number;
  requiredFieldsCount: number;
  customParsersCount: number;
  completeness: number;
} {
  const fieldsCount = config.schema.fields.length;
  const selectorsCount = Object.keys(config.selectors).length;
  const requiredFieldsCount = config.schema.fields.filter(f => f.required).length;
  const customParsersCount = Object.keys(config.customParsers ?? {}).length;
  
  // Процент заполненности (есть ли селекторы для всех обязательных полей)
  const requiredFieldsWithSelectors = config.schema.fields
    .filter(f => f.required)
    .filter(f => config.selectors[f.name])
    .length;
  
  const completeness = requiredFieldsCount > 0 
    ? (requiredFieldsWithSelectors / requiredFieldsCount) * 100
    : 0;
  
  return {
    fieldsCount,
    selectorsCount,
    requiredFieldsCount,
    customParsersCount,
    completeness
  };
}
