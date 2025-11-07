/**
 * Config Repository v4.0
 * @module storage/config-repository
 */

import { browser } from '@lib/utils/browser-api';
import { matchesPattern } from '@lib/utils/url-pattern-matcher';
import type { ParserConfig } from '@lib/types/parser.types';

const STORAGE_KEY = 'parser_configs';
const ACTIVE_CONFIG_KEY = 'active_config_id';

export async function getAllConfigs(): Promise<ParserConfig[]> {
  const result = await browser.storage.local.get(STORAGE_KEY);
  const configs = result[STORAGE_KEY];
  
  if (!configs || !Array.isArray(configs)) {
    return [];
  }
  
  return configs as ParserConfig[];
}

export async function addConfig(config: ParserConfig): Promise<void> {
  const configs = await getAllConfigs();
  const existingIndex = configs.findIndex(c => c.id === config.id);
  
  const validated: ParserConfig = {
    ...config,
    pages: config.pages.map(p => ({
      ...p,
      commonFields: p.commonFields || p.fields || [],
      subPages: p.subPages || [],
      fields: []
    }))
  };
  
  if (existingIndex >= 0) {
    configs[existingIndex] = validated;
  } else {
    configs.push(validated);
  }
  
  await browser.storage.local.set({ [STORAGE_KEY]: configs });
}

export async function getConfigById(id: string): Promise<ParserConfig | undefined> {
  const configs = await getAllConfigs();
  return configs.find(c => c.id === id);
}

export async function deleteConfig(id: string): Promise<void> {
  const configs = await getAllConfigs();
  await browser.storage.local.set({
    [STORAGE_KEY]: configs.filter(c => c.id !== id)
  });
}

export async function updateConfig(config: ParserConfig): Promise<void> {
  await addConfig(config);
}

export async function findByUrl(url: string): Promise<ParserConfig[]> {
  const configs = await getAllConfigs();
  return configs.filter(config => 
    config.pages.some(page => matchesPattern(url, page.urlPattern))
  );
}

export async function getActiveConfig(): Promise<ParserConfig | undefined> {
  const result = await browser.storage.local.get(ACTIVE_CONFIG_KEY);
  const activeId = result[ACTIVE_CONFIG_KEY] as string | undefined;
  
  if (!activeId) {
    return undefined;
  }
  
  return getConfigById(activeId);
}

export async function setActiveConfig(configId: string | null): Promise<void> {
  if (configId) {
    await browser.storage.local.set({ [ACTIVE_CONFIG_KEY]: configId });
  } else {
    await browser.storage.local.remove(ACTIVE_CONFIG_KEY);
  }
}

export const configRepository = {
  getAll: getAllConfigs,
  findAll: getAllConfigs,
  add: addConfig,
  save: addConfig,
  getById: getConfigById,
  delete: deleteConfig,
  update: updateConfig,
  findByUrl: findByUrl,
  getActive: getActiveConfig,
  setActive: setActiveConfig
};
