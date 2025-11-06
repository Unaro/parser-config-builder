/**
 * Схема данных
 */
export interface DataSchema {
  fields: SchemaField[];
  metadata: SchemaMetadata;
}

/**
 * Поле схемы
 */
export interface SchemaField {
  name: string;
  type: DataType;
  required: boolean;
  description?: string;
  validation?: FieldValidation;
  defaultValue?: unknown;
  arrayItemType?: DataType;
  objectProperties?: Record<string, SchemaField>;
}

/**
 * Типы данных
 */
export type DataType =
  | 'string'
  | 'number' 
  | 'integer'
  | 'boolean'
  | 'date'
  | 'url'
  | 'email'
  | 'array'
  | 'object';

/**
 * Правила валидации поля
 */
export interface FieldValidation {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  enum?: string[];
  format?: string;
  minItems?: number;
  maxItems?: number;
}

/**
 * Метаданные схемы
 */
export interface SchemaMetadata {
  name: string;
  version: string;
  description?: string;
  createdAt: string;
  fieldsCount: number;
  requiredFieldsCount: number;
}

/**
 * Предустановленные шаблоны схем
 */
export interface SchemaTemplate {
  name: string;
  description: string;
  pageType: string;
  fields: SchemaField[];
  tags: string[];
}

/**
 * Настройки генерации схемы
 */
export interface SchemaGenerationOptions {
  detectArrays: boolean;
  detectNumbers: boolean;
  detectDates: boolean;
  detectUrls: boolean;
  inferRequired: boolean;
  maxDepth: number;
}
