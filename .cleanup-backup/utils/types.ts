/**
 * Утилиты для работы с типами данных
 */

import type { DataType } from '@/types';

/**
 * Определить тип значения
 */
export function inferDataType(value: unknown): DataType {
  if (value === null || value === undefined) {
    return 'string'; // По умолчанию
  }
  
  if (typeof value === 'boolean') {
    return 'boolean';
  }
  
  if (typeof value === 'number') {
    return Number.isInteger(value) ? 'integer' : 'number';
  }
  
  if (typeof value === 'string') {
    // Проверяем на специальные типы строк
    if (isValidUrl(value)) {
      return 'url';
    }
    
    if (isValidEmail(value)) {
      return 'email';
    }
    
    if (isValidDate(value)) {
      return 'date';
    }
    
    return 'string';
  }
  
  if (Array.isArray(value)) {
    return 'array';
  }
  
  if (typeof value === 'object') {
    return 'object';
  }
  
  return 'string';
}

/**
 * Проверить валидность URL
 */
function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str);
    return ['http:', 'https:', 'ftp:', 'mailto:'].includes(url.protocol);
  } catch {
    return false;
  }
}

/**
 * Проверить валидность email
 */
function isValidEmail(str: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(str);
}

/**
 * Проверить валидность даты
 */
function isValidDate(str: string): boolean {
  // Проверяем различные форматы дат
  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
    /^\d{2}\.\d{2}\.\d{4}$/, // DD.MM.YYYY
    /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
    /^\d{4}\/\d{2}\/\d{2}$/, // YYYY/MM/DD
  ];
  
  return datePatterns.some(pattern => pattern.test(str)) && !isNaN(Date.parse(str));
}

/**
 * Преобразовать значение к типу
 */
export function convertValueToType(value: unknown, type: DataType): unknown {
  switch (type) {
    case 'string':
      return String(value ?? '');
      
    case 'number':
      const num = Number(value);
      return isNaN(num) ? 0 : num;
      
    case 'integer':
      const int = parseInt(String(value), 10);
      return isNaN(int) ? 0 : int;
      
    case 'boolean':
      return Boolean(value);
      
    case 'date':
      if (typeof value === 'string') {
        const date = new Date(value);
        return isNaN(date.getTime()) ? new Date() : date;
      }
      return new Date();
      
    case 'array':
      return Array.isArray(value) ? value : [];
      
    case 'object':
      return typeof value === 'object' && value !== null ? value : {};
      
    default:
      return value;
  }
}

/**
 * Получить тип TypeScript для DataType
 */
export function getTypeScriptType(dataType: DataType): string {
  switch (dataType) {
    case 'string':
    case 'url':
    case 'email':
      return 'string';
      
    case 'number':
    case 'integer':
      return 'number';
      
    case 'boolean':
      return 'boolean';
      
    case 'date':
      return 'Date | string';
      
    case 'array':
      return 'unknown[]';
      
    case 'object':
      return 'Record<string, unknown>';
      
    default:
      return 'unknown';
  }
}

/**
 * Сгенерировать уникальный ID
 */
export function generateUniqueId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Сгенерировать UUID v4
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Форматировать размер файла
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Форматировать дату
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}
