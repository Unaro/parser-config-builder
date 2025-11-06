/**
 * Zod-схемы для multi-page конфигурации
 * @module parser.schema
 * @version 2.0.0
 */

import { z } from 'zod';

export const FieldTransformSchema = z.object({
  type: z.enum(['regex', 'split', 'replace', 'trim', 'lowercase', 'uppercase']),
  pattern: z.string().optional(),
  replacement: z.string().optional(),
  separator: z.string().optional()
}).strict();

export const CustomFieldSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  key: z.string().min(1),
  type: z.enum(['string', 'array', 'object', 'image', 'url', 'number']),
  selector: z.string().min(1),
  required: z.boolean(),
  description: z.string().optional(),
  transform: FieldTransformSchema.optional()
}).strict();

export const WaitStrategySchema = z.object({
  type: z.enum(['static', 'pagination', 'infinite-scroll', 'click-load', 'tab-switch', 'ajax-wait']),
  selector: z.string().optional(),
  timeout: z.number().min(0).max(30000).optional(),
  scrollDistance: z.number().min(0).optional(),
  waitForSelector: z.string().optional(),
  maxIterations: z.number().min(1).max(100).optional()
}).strict();

export const PageConfigSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  urlPattern: z.string().min(1),
  fields: z.array(CustomFieldSchema),
  loadStrategy: WaitStrategySchema,
  description: z.string().optional()
}).strict();

export const ParserMetadataSchema = z.object({
  created: z.coerce.date(),
  updated: z.coerce.date(),
  author: z.string().min(1),
  tags: z.array(z.string()),
  siteUrl: z.string().url(),
  description: z.string().optional()
}).strict();

export const ParserOptionsSchema = z.object({
  delay: z.number().min(0).max(10000).optional(),
  maxRetries: z.number().min(1).max(10).optional(),
  userAgent: z.string().optional(),
  headers: z.record(z.string(), z.string()).optional()
}).strict();

export const ParserConfigSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  targetUrl: z.string().url(),
  pages: z.array(PageConfigSchema).min(1),
  metadata: ParserMetadataSchema,
  options: ParserOptionsSchema.optional()
}).strict();

export type ParserConfigInput = z.input<typeof ParserConfigSchema>;
export type ParserConfigOutput = z.output<typeof ParserConfigSchema>;
