/**
 * Утилиты для работы с Chrome Storage
 */

import type { ParserConfig } from '@/types';

/**
 * Сохранить конфиг в storage
 */
export async function saveConfig(config: ParserConfig): Promise<void> {
  const key = `config_${config.platform.domain}_${config.pageType}`;
  
  await chrome.storage.local.set({
    [key]: {
      ...config,
      metadata: {
        ...config.metadata,
        updatedAt: new Date().toISOString()
      }
    }
  });
  
  console.log('Config saved:', key);
}

/**
 * Загрузить конфиг из storage
 */
export async function loadConfig(domain: string, pageType: string): Promise<ParserConfig | null> {
  const key = `config_${domain}_${pageType}`;
  const result = await chrome.storage.local.get(key);
  
  return result[key] || null;
}

/**
 * Получить все конфиги
 */
export async function getAllConfigs(): Promise<Record<string, ParserConfig>> {
  const allData = await chrome.storage.local.get();
  const configs: Record<string, ParserConfig> = {};
  
  for (const [key, value] of Object.entries(allData)) {
    if (key.startsWith('config_') && value && typeof value === 'object') {
      configs[key] = value as ParserConfig;
    }
  }
  
  return configs;
}

/**
 * Удалить конфиг
 */
export async function deleteConfig(domain: string, pageType: string): Promise<void> {
  const key = `config_${domain}_${pageType}`;
  await chrome.storage.local.remove(key);
  console.log('Config deleted:', key);
}

/**
 * Экспортировать все конфиги
 */
export async function exportConfigs(): Promise<string> {
  const configs = await getAllConfigs();
  return JSON.stringify(configs, null, 2);
}

/**
 * Импортировать конфиги
 */
export async function importConfigs(data: string): Promise<void> {
  try {
    const configs = JSON.parse(data);
    
    for (const [key, config] of Object.entries(configs)) {
      if (key.startsWith('config_') && config && typeof config === 'object') {
        await chrome.storage.local.set({ [key]: config });
      }
    }
    
    console.log('Configs imported successfully');
  } catch (error) {
    throw new Error('Invalid config data format');
  }
}

/**
 * Очистить все конфиги
 */
export async function clearAllConfigs(): Promise<void> {
  const configs = await getAllConfigs();
  const keys = Object.keys(configs);
  
  if (keys.length > 0) {
    await chrome.storage.local.remove(keys);
    console.log(`Cleared ${keys.length} configs`);
  }
}
