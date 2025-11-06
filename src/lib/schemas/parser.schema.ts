/**
 * Zod-схемы для валидации конфигурации парсера
 * @module parser.schema
 * @version 1.0.0
 */

import { z } from 'zod';

/**
 * Схема для кастомного поля
 */
export const CustomFieldSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Field name is required'),
  key: z.string().min(1, 'Field key is required'),
  type: z.enum(['string', 'array', 'object', 'image']),
  selector: z.string().min(1, 'Selector is required'),
  required: z.boolean(),
  description: z.string().optional()
}).strict();

/**
 * Схема для метаданных парсера
 */
export const ParserMetadataSchema = z.object({
  created: z.coerce.date(),
  updated: z.coerce.date(),
  author: z.string().min(1),
  tags: z.array(z.string()),
  siteUrl: z.string().url(),
  description: z.string().optional()
}).strict();

/**
 * Схема для опций парсера
 */
export const ParserOptionsSchema = z.object({
  delay: z.number().min(0).max(10000).optional(),
  maxRetries: z.number().min(1).max(10).optional(),
  userAgent: z.string().optional(),
  headers: z.record(z.string(), z.string()).optional()
}).strict();

/**
 * Основная схема конфигурации парсера
 */
export const ParserConfigSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be in semver format'),
  targetUrl: z.string().url(),
  fields: z.array(CustomFieldSchema).min(1, 'At least one field is required'),
  metadata: ParserMetadataSchema,
  options: ParserOptionsSchema.optional()
}).strict();

export type ParserConfigInput = z.input<typeof ParserConfigSchema>;
export type ParserConfigOutput = z.output<typeof ParserConfigSchema>;
export type CustomFieldInput = z.input<typeof CustomFieldSchema>;
export type CustomFieldOutput = z.output<typeof CustomFieldSchema>;
