/**
 * Field Presets
 * @module constants/field-presets
 */

import type { FieldType } from '../types/parser.types';

export interface FieldPreset {
  readonly name: string;
  readonly key: string;
  readonly type: FieldType;
  readonly description: string;
  readonly category: 'work' | 'catalog' | 'chapter' | 'author' | 'common';
  readonly required?: boolean;
}

export const FIELD_PRESETS: readonly FieldPreset[] = [
  { name: 'Title', key: 'title', type: 'string', category: 'work', description: 'Название', required: true },
  { name: 'Description', key: 'description', type: 'string', category: 'work', description: 'Описание' },
  { name: 'Author', key: 'author', type: 'string', category: 'work', description: 'Автор' },
  { name: 'Cover Image', key: 'cover', type: 'image', category: 'work', description: 'Обложка' },
  { name: 'Rating', key: 'rating', type: 'number', category: 'work', description: 'Рейтинг' },
  { name: 'Genres', key: 'genres', type: 'array', category: 'work', description: 'Жанры' },
  { name: 'Tags', key: 'tags', type: 'array', category: 'work', description: 'Теги' },
  { name: 'Works', key: 'works', type: 'custom-object', category: 'catalog', description: 'Список произведений' },
  { name: 'Chapter Title', key: 'chapter_title', type: 'string', category: 'chapter', description: 'Название главы' },
  { name: 'Images', key: 'images', type: 'array', category: 'chapter', description: 'Изображения' },
  { name: 'Chapters', key: 'chapters', type: 'array', category: 'chapter', description: 'Список глав' },
];

export function searchPresets(query: string): readonly FieldPreset[] {
  const lowerQuery = query.toLowerCase();
  return FIELD_PRESETS.filter(p => p.name.toLowerCase().includes(lowerQuery) || p.key.includes(lowerQuery));
}
