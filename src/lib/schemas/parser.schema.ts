/**
 * Zod-схемы для валидации конфигурации парсера
 * Используется на границах системы для валидации входных данных
 * @module parser.schema
 * @version 1.0.0
 */

import { z } from 'zod';

/**
 * Схема для конфигурации селекторов
 */
export const SelectorConfigSchema = z.object({
  title: z.string().min(1, 'Title selector is required'),
  chapters: z.string().min(1, 'Chapters selector is required'),
  images: z.string().min(1, 'Images selector is required'),
  nextPage: z.string().optional(),
  author: z.string().optional(),
  description: z.string().optional(),
  cover: z.string().optional(),
  tags: z.string().optional()
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
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be in semver format (e.g., 1.0.0)'),
  targetUrl: z.union([
    z.string().url(),
    z.instanceof(RegExp)
  ]),
  selectors: SelectorConfigSchema,
  metadata: ParserMetadataSchema,
  options: ParserOptionsSchema.optional()
}).strict();

/**
 * Схема для результата валидации селектора
 */
export const SelectorValidationResultSchema = z.object({
  selector: z.string(),
  status: z.enum(['valid', 'invalid', 'pending', 'untested']),
  elementCount: z.number().min(0),
  error: z.string().optional(),
  previewText: z.string().optional()
}).strict();

/**
 * Type-safe типы, производные от схем
 */
export type ParserConfigInput = z.input<typeof ParserConfigSchema>;
export type ParserConfigOutput = z.output<typeof ParserConfigSchema>;
export type SelectorConfigInput = z.input<typeof SelectorConfigSchema>;
export type SelectorConfigOutput = z.output<typeof SelectorConfigSchema>;
