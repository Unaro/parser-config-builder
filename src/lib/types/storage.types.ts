/**
 * Типы для работы с хранилищем браузера
 * @module storage.types
 * @version 1.0.0
 */

/**
 * Ключи хранилища
 */
export enum StorageKey {
  CONFIGS = 'parser_configs',
  ACTIVE_CONFIG = 'active_config_id',
  SETTINGS = 'user_settings',
  THEME = 'theme_preference'
}

/**
 * Настройки пользователя
 */
export interface UserSettings {
  readonly theme: 'light' | 'dark' | 'auto';
  readonly language: 'en' | 'ru';
  readonly autoSave: boolean;
  readonly showNotifications: boolean;
}

/**
 * Результат операции хранилища
 */
export type StorageResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string };
