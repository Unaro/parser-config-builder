/**
 * Repository для работы с конфигурациями парсера в хранилище
 * Чистый маппер БД ↔ домен
 * @module config-repository
 * @version 1.0.0
 */

import type { ParserConfig } from '../types/parser.types';
import { StorageKey } from '../types/storage.types';
import { storage } from '../utils/browser-api';
import { ParserConfigSchema } from '../schemas/parser.schema';

/**
 * Repository для конфигураций парсера
 */
export class ConfigRepository {
  /**
   * Получить все конфигурации
   */
  async findAll(): Promise<ParserConfig[]> {
    const configs = await storage.get<ParserConfig[]>(StorageKey.CONFIGS);
    return configs ?? [];
  }

  /**
   * Найти конфигурацию по ID
   */
  async findById(id: string): Promise<ParserConfig | undefined> {
    const configs = await this.findAll();
    return configs.find(config => config.id === id);
  }

  /**
   * Найти конфигурации по URL сайта
   */
  async findByUrl(url: string): Promise<ParserConfig[]> {
    const configs = await this.findAll();
    return configs.filter(config => {
      if (typeof config.targetUrl === 'string') {
        return url.includes(config.targetUrl);
      }
      return config.targetUrl.test(url);
    });
  }

  /**
   * Сохранить конфигурацию (создать или обновить)
   */
  async save(config: ParserConfig): Promise<void> {
    // Валидация на границе системы
    const validatedConfig = ParserConfigSchema.parse(config);
    
    const configs = await this.findAll();
    const index = configs.findIndex(c => c.id === validatedConfig.id);

    if (index >= 0) {
      configs[index] = validatedConfig;
    } else {
      configs.push(validatedConfig);
    }

    await storage.set(StorageKey.CONFIGS, configs);
  }

  /**
   * Удалить конфигурацию
   */
  async delete(id: string): Promise<void> {
    const configs = await this.findAll();
    const filtered = configs.filter(config => config.id !== id);
    await storage.set(StorageKey.CONFIGS, filtered);
  }

  /**
   * Получить активную конфигурацию
   */
  async getActive(): Promise<ParserConfig | undefined> {
    const activeId = await storage.get<string>(StorageKey.ACTIVE_CONFIG);
    if (!activeId) return undefined;
    return this.findById(activeId);
  }

  /**
   * Установить активную конфигурацию
   */
  async setActive(id: string | null): Promise<void> {
    if (id === null) {
      await storage.remove(StorageKey.ACTIVE_CONFIG);
    } else {
      await storage.set(StorageKey.ACTIVE_CONFIG, id);
    }
  }

  /**
   * Очистить все конфигурации
   */
  async clear(): Promise<void> {
    await storage.remove(StorageKey.CONFIGS);
    await storage.remove(StorageKey.ACTIVE_CONFIG);
  }
}

/**
 * Singleton экземпляр repository
 */
export const configRepository = new ConfigRepository();
