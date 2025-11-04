/**
 * Утилиты для валидации данных
 */

import type { DataType, ValidationRule, SchemaField, ParserConfig } from '@/types';

/**
 * Валидация значения по типу
 */
export function validateValueByType(value: unknown, type: DataType): boolean {
  switch (type) {
    case 'string':
      return typeof value === 'string';
      
    case 'number':
      return typeof value === 'number' && !isNaN(value);
      
    case 'integer':
      return typeof value === 'number' && Number.isInteger(value);
      
    case 'boolean':
      return typeof value === 'boolean';
      
    case 'date':
      return value instanceof Date || (typeof value === 'string' && !isNaN(Date.parse(value)));
      
    case 'url':
      return typeof value === 'string' && isValidUrl(value);
      
    case 'email':
      return typeof value === 'string' && isValidEmail(value);
      
    case 'array':
      return Array.isArray(value);
      
    case 'object':
      return typeof value === 'object' && value !== null && !Array.isArray(value);
      
    default:
      return false;
  }
}

/**
 * Валидация значения по правилам
 */
export function validateValueByRules(value: unknown, rules: ValidationRule): ValidationResult {
  const errors: string[] = [];
  
  // Проверка типа
  if (!validateValueByType(value, rules.type)) {
    errors.push(`Expected ${rules.type}, got ${typeof value}`);
    return { valid: false, errors };
  }
  
  // Проверка строковых полей
  if (typeof value === 'string') {
    if (rules.minLength !== undefined && value.length < rules.minLength) {
      errors.push(`String too short. Min length: ${rules.minLength}`);
    }
    
    if (rules.maxLength !== undefined && value.length > rules.maxLength) {
      errors.push(`String too long. Max length: ${rules.maxLength}`);
    }
    
    if (rules.pattern && !new RegExp(rules.pattern).test(value)) {
      errors.push(`String doesn't match pattern: ${rules.pattern}`);
    }
    
    if (rules.enum && !rules.enum.includes(value)) {
      errors.push(`Value not in enum: ${rules.enum.join(', ')}`);
    }
  }
  
  // Проверка числовых полей
  if (typeof value === 'number') {
    if (rules.min !== undefined && value < rules.min) {
      errors.push(`Number too small. Min: ${rules.min}`);
    }
    
    if (rules.max !== undefined && value > rules.max) {
      errors.push(`Number too large. Max: ${rules.max}`);
    }
  }
  
  // Проверка массивов
  if (Array.isArray(value)) {
    if (rules.minItems !== undefined && value.length < rules.minItems) {
      errors.push(`Array too short. Min items: ${rules.minItems}`);
    }
    
    if (rules.maxItems !== undefined && value.length > rules.maxItems) {
      errors.push(`Array too long. Max items: ${rules.maxItems}`);
    }
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * Валидация поля схемы
 */
export function validateSchemaField(field: SchemaField): ValidationResult {
  const errors: string[] = [];
  
  if (!field.name || field.name.trim() === '') {
    errors.push('Field name is required');
  }
  
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(field.name)) {
    errors.push('Field name must be a valid identifier');
  }
  
  if (!field.type) {
    errors.push('Field type is required');
  }
  
  if (field.type === 'array' && !field.arrayItemType) {
    errors.push('Array fields must specify item type');
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * Валидация конфига парсера
 */
export function validateParserConfig(config: ParserConfig): ValidationResult {
  const errors: string[] = [];
  
  // Проверка основной информации
  if (!config.platform?.name) {
    errors.push('Platform name is required');
  }
  
  if (!config.platform?.domain) {
    errors.push('Platform domain is required');
  }
  
  if (!config.pageType) {
    errors.push('Page type is required');
  }
  
  // Проверка схемы
  if (!config.schema?.fields || config.schema.fields.length === 0) {
    errors.push('Schema must have at least one field');
  } else {
    for (const field of config.schema.fields) {
      const fieldValidation = validateSchemaField(field);
      if (!fieldValidation.valid) {
        errors.push(...fieldValidation.errors.map(err => `Field ${field.name}: ${err}`));
      }
    }
  }
  
  // Проверка селекторов
  const schemaFieldNames = config.schema?.fields.map(f => f.name) ?? [];
  const selectorFieldNames = Object.keys(config.selectors);
  
  // Проверяем, что все обязательные поля схемы имеют селекторы
  for (const field of config.schema?.fields ?? []) {
    if (field.required && !selectorFieldNames.includes(field.name)) {
      errors.push(`Required field "${field.name}" is missing a selector`);
    }
  }
  
  // Проверяем, что все селекторы соответствуют полям схемы
  for (const fieldName of selectorFieldNames) {
    if (!schemaFieldNames.includes(fieldName)) {
      errors.push(`Selector for unknown field: "${fieldName}"`);
    }
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * Проверка валидности URL
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Проверка валидности email
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Тип результата валидации
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}
