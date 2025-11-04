/**
 * Config Sidebar Helpers - вспомогательные методы для ConfigSidebar
 */

import type { 
  ElementSelectedMessage, 
  TestResult,
  PageType
} from '@/types';
import type { SelectorConfig } from '@/types/selector';
import type { SchemaField } from '@/types/schema';

/**
 * Получить лейбл типа страницы
 */
export function getPageTypeLabel(pageType: PageType): string {
  const labels: Record<PageType, string> = {
    'work_detail': 'Страница произведения',
    'work_list': 'Каталог произведений',
    'chapter_list': 'Список глав',
    'chapter_read': 'Страница чтения',
    'team_profile': 'Профиль команды',
    'user_profile': 'Профиль пользователя'
  };
  return labels[pageType] || pageType;
}

/**
 * Получить лейбл типа извлечения
 */
export function getExtractionTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'text': 'Текст',
    'attribute': 'Атрибут',
    'html': 'HTML',
    'array': 'Массив',
    'count': 'Количество',
    'exists': 'Существование',
    'custom': 'Пользовательский'
  };
  return labels[type] || type;
}

/**
 * Создать конфиг селектора по умолчанию
 */
export function getDefaultSelectorConfig(): SelectorConfig {
  return {
    primary: '',
    fallback: [],
    type: 'text',
    required: false,
    confidence: 0,
    metadata: {
      generatedAt: new Date().toISOString(),
      confidence: 0,
      strategy: 'manual'
    }
  };
}

/**
 * Создать поле схемы по умолчанию
 */
export function getDefaultSchemaField(name: string, type: string = 'string'): SchemaField {
  return {
    name,
    type: type as any,
    required: false,
    description: `Поле ${name}`,
    metadata: {
      addedAt: new Date().toISOString(),
      source: 'manual'
    }
  };
}

/**
 * Форматировать время для отображения
 */
export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/**
 * Укоротить селектор для отображения
 */
export function truncateSelector(selector: string, maxLength: number = 50): string {
  if (selector.length <= maxLength) return selector;
  return selector.substring(0, maxLength - 3) + '...';
}

/**
 * Проверить валидность CSS селектора
 */
export function isValidSelector(selector: string): boolean {
  try {
    document.querySelector(selector);
    return true;
  } catch {
    return false;
  }
}

/**
 * Создать уникальное имя поля
 */
export function generateUniqueFieldName(existingNames: string[], baseName: string = 'field'): string {
  let counter = 1;
  let name = baseName;
  
  while (existingNames.includes(name)) {
    name = `${baseName}_${counter}`;
    counter++;
  }
  
  return name;
}