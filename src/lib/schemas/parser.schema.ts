/**
 * Zod Schemas v3.1
 * @module schemas/parser.schema
 */

import { z } from 'zod';

export const ObjectFieldDefinitionSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  key: z.string().min(1),
  type: z.enum(['string', 'number', 'image', 'url', 'array']),
  selector: z.string().min(1),
  required: z.boolean()
});

export const CustomObjectTypeSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  containerSelector: z.string().min(1),
  fields: z.array(ObjectFieldDefinitionSchema)
});

export const FieldTransformSchema = z.object({
  type: z.enum(['regex', 'split', 'replace', 'trim', 'lowercase', 'uppercase']),
  pattern: z.string().optional(),
  replacement: z.string().optional(),
  separator: z.string().optional()
});

export const CustomFieldSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  key: z.string().min(1),
  type: z.enum(['string', 'array', 'custom-object', 'image', 'url', 'number']),
  selector: z.string().min(1),
  required: z.boolean(),
  description: z.string().optional(),
  transform: FieldTransformSchema.optional(),
  customObjectTypeId: z.string().uuid().optional()
});

export const WaitStrategySchema = z.object({
  type: z.enum(['static', 'pagination', 'infinite-scroll', 'click-load', 'tab-switch', 'ajax-wait']),
  selector: z.string().optional(),
  timeout: z.number().optional(),
  scrollDistance: z.number().optional(),
  waitForSelector: z.string().optional(),
  maxIterations: z.number().optional()
});

export const PageConfigSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  urlPattern: z.string().min(1),
  fields: z.array(CustomFieldSchema),
  loadStrategy: WaitStrategySchema,
  customObjectTypes: z.array(CustomObjectTypeSchema).default([]),
  description: z.string().optional()
});

export const ParserMetadataSchema = z.object({
  created: z.coerce.date(),
  updated: z.coerce.date(),
  author: z.string(),
  tags: z.array(z.string()),
  siteUrl: z.string().url(),
  description: z.string().optional()
});

export const ParserOptionsSchema = z.object({
  delay: z.number().optional(),
  maxRetries: z.number().optional(),
  userAgent: z.string().optional(),
  headers: z.record(z.string()).optional()
}).optional();

export const ParserConfigSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  targetUrl: z.string().url(),
  pages: z.array(PageConfigSchema).min(1),
  metadata: ParserMetadataSchema,
  options: ParserOptionsSchema
});

export type ParserConfig = z.infer<typeof ParserConfigSchema>;
export type PageConfig = z.infer<typeof PageConfigSchema>;
export type CustomField = z.infer<typeof CustomFieldSchema>;
