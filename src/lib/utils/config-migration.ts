/**
 * Утилита для миграции старых конфигов в новый формат
 * @module utils/config-migration
 * @version 2.0.0
 */

import type { ParserConfig } from '@lib/types/parser.types';

/**
 * Проверить, является ли конфиг валидным v2.0
 */
export function isValidV2Config(config: unknown): config is ParserConfig {
  if (!config || typeof config !== 'object') return false;
  
  const cfg = config as any;
  return (
    typeof cfg.id === 'string' &&
    typeof cfg.name === 'string' &&
    typeof cfg.version === 'string' &&
    typeof cfg.targetUrl === 'string' &&
    Array.isArray(cfg.pages) &&
    cfg.pages.length > 0 &&
    typeof cfg.metadata === 'object'
  );
}

/**
 * Очистить невалидные конфигурации из storage
 */
export async function cleanInvalidConfigs(): Promise<void> {
  const { storage } = await import('@lib/utils/browser-api');
  
  const configs = await storage.get<ParserConfig[]>('parser_configs');
  if (!configs || !Array.isArray(configs)) return;

  const validConfigs = configs.filter(isValidV2Config);
  
  if (validConfigs.length !== configs.length) {
    console.log(`[Migration] Removing ${configs.length - validConfigs.length} invalid configs`);
    await storage.set('parser_configs', validConfigs);
  }
}
