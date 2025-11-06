/**
 * Repository для работы с конфигурациями в browser.storage
 * @module storage/config-repository
 * @version 1.0.0
 */

import { storage } from '../utils/browser-api';
import { ParserConfigSchema } from '../schemas/parser.schema';
import type { ParserConfig } from '../types/parser.types';

const CONFIGS_KEY = 'parser_configs';
const ACTIVE_CONFIG_KEY = 'active_config_id';

export class ConfigRepository {
  async save(config: ParserConfig): Promise<void> {
    const validated = ParserConfigSchema.parse(config);
    
    const configs = await this.findAll();
    const existingIndex = configs.findIndex(c => c.id === validated.id);
    
    if (existingIndex >= 0) {
      configs[existingIndex] = validated;
    } else {
      configs.push(validated);
    }
    
    await storage.set(CONFIGS_KEY, configs);
  }

  async findAll(): Promise<ParserConfig[]> {
    const configs = await storage.get<ParserConfig[]>(CONFIGS_KEY);
    return configs ?? [];
  }

  async findById(id: string): Promise<ParserConfig | undefined> {
    const configs = await this.findAll();
    return configs.find(c => c.id === id);
  }

  async findByUrl(url: string): Promise<ParserConfig[]> {
    const configs = await this.findAll();
    return configs.filter(config => {
      // Простое совпадение по origin
      return url.startsWith(config.targetUrl);
    });
  }

  async delete(id: string): Promise<void> {
    const configs = await this.findAll();
    const filtered = configs.filter(c => c.id !== id);
    await storage.set(CONFIGS_KEY, filtered);
    
    const activeId = await storage.get<string>(ACTIVE_CONFIG_KEY);
    if (activeId === id) {
      await storage.remove(ACTIVE_CONFIG_KEY);
    }
  }

  async getActive(): Promise<ParserConfig | undefined> {
    const activeId = await storage.get<string>(ACTIVE_CONFIG_KEY);
    if (!activeId) return undefined;
    return this.findById(activeId);
  }

  async setActive(id: string): Promise<void> {
    await storage.set(ACTIVE_CONFIG_KEY, id);
  }

  async clearAll(): Promise<void> {
    await storage.remove(CONFIGS_KEY);
    await storage.remove(ACTIVE_CONFIG_KEY);
  }
}

export const configRepository = new ConfigRepository();
