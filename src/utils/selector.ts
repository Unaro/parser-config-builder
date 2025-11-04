/**
 * Утилиты для генерации селекторов
 */

import type { GeneratedSelector, SelectorStrategy } from '@/types';
import { getElementAttributes, getElementXPath } from './dom';

/**
 * Приоритеты стратегий (от наиболее стабильных к менее)
 */
const STRATEGY_PRIORITY: SelectorStrategy[] = [
  'data-attribute',
  'semantic', 
  'id',
  'class',
  'tag',
  'xpath',
  'position',
  'text-content'
];

/**
 * Сгенерировать селекторы для элемента
 */
export function generateSelectors(element: Element): GeneratedSelector[] {
  const selectors: GeneratedSelector[] = [];
  
  // Пробуем все стратегии
  for (const strategy of STRATEGY_PRIORITY) {
    const selector = generateSelectorByStrategy(element, strategy);
    if (selector) {
      selectors.push(selector);
    }
  }
  
  return selectors.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Сгенерировать селектор по стратегии
 */
function generateSelectorByStrategy(
  element: Element, 
  strategy: SelectorStrategy
): GeneratedSelector | null {
  const attributes = getElementAttributes(element);
  let selector: string | null = null;
  let confidence = 0;
  
  switch (strategy) {
    case 'data-attribute':
      selector = generateDataAttributeSelector(attributes);
      confidence = selector ? 0.95 : 0;
      break;
      
    case 'semantic':
      selector = generateSemanticSelector(attributes);
      confidence = selector ? 0.90 : 0;
      break;
      
    case 'id':
      selector = attributes.id ? `#${attributes.id}` : null;
      confidence = selector ? 0.85 : 0;
      break;
      
    case 'class':
      selector = generateClassSelector(attributes);
      confidence = selector ? 0.70 : 0;
      break;
      
    case 'tag':
      selector = element.tagName.toLowerCase();
      confidence = 0.30;
      break;
      
    case 'xpath':
      selector = getElementXPath(element);
      confidence = 0.50;
      break;
      
    case 'position':
      selector = generatePositionSelector(element);
      confidence = selector ? 0.40 : 0;
      break;
      
    case 'text-content':
      selector = generateTextContentSelector(element);
      confidence = selector ? 0.35 : 0;
      break;
  }
  
  if (!selector) return null;
  
  return {
    selector,
    strategy,
    confidence,
    uniqueness: calculateUniqueness(selector),
    stability: calculateStability(strategy),
    element
  };
}

/**
 * Генерация data-* селекторов
 */
function generateDataAttributeSelector(attributes: Record<string, string>): string | null {
  const dataAttrs = Object.keys(attributes).filter(key => key.startsWith('data-'));
  
  if (dataAttrs.length === 0) return null;
  
  // Приоритет определённым атрибутам
  const priorityAttrs = ['data-testid', 'data-test', 'data-cy', 'data-id'];
  
  for (const attr of priorityAttrs) {
    if (attributes[attr]) {
      return `[${attr}="${attributes[attr]}"]`;
    }
  }
  
  // Используем первый data-* атрибут
  const firstDataAttr = dataAttrs[0];
  return firstDataAttr ? `[${firstDataAttr}="${attributes[firstDataAttr]}"]` : null;
}

/**
 * Генерация семантических селекторов
 */
function generateSemanticSelector(attributes: Record<string, string>): string | null {
  const semanticAttrs = ['itemprop', 'itemtype', 'itemscope', 'role', 'aria-label'];
  
  for (const attr of semanticAttrs) {
    if (attributes[attr]) {
      return `[${attr}="${attributes[attr]}"]`;
    }
  }
  
  return null;
}

/**
 * Генерация классовых селекторов
 */
function generateClassSelector(attributes: Record<string, string>): string | null {
  if (!attributes.class) return null;
  
  const classes = attributes.class.trim().split(/\s+/).filter(Boolean);
  if (classes.length === 0) return null;
  
  // Используем все классы для большей уникальности
  return `.${classes.join('.')}`;
}

/**
 * Генерация позиционных селекторов
 */
function generatePositionSelector(element: Element): string | null {
  const parent = element.parentElement;
  if (!parent) return null;
  
  const siblings = Array.from(parent.children);
  const index = siblings.indexOf(element);
  
  if (index === -1) return null;
  
  const tagName = element.tagName.toLowerCase();
  const sameTagSiblings = siblings.filter(s => s.tagName === element.tagName);
  
  if (sameTagSiblings.length === 1) {
    return tagName;
  }
  
  const sameTagIndex = sameTagSiblings.indexOf(element);
  return `${tagName}:nth-of-type(${sameTagIndex + 1})`;
}

/**
 * Генерация селекторов по текстовому содержимому
 */
function generateTextContentSelector(element: Element): string | null {
  const text = element.textContent?.trim();
  if (!text || text.length > 50) return null; // Слишком длинный текст
  
  const tagName = element.tagName.toLowerCase();
  return `${tagName}:contains("${text}")`;
}

/**
 * Вычислить уникальность селектора
 */
function calculateUniqueness(selector: string): number {
  try {
    const matches = document.querySelectorAll(selector);
    return matches.length === 1 ? 1.0 : 1.0 / matches.length;
  } catch {
    return 0;
  }
}

/**
 * Вычислить стабильность стратегии
 */
function calculateStability(strategy: SelectorStrategy): number {
  const stabilityMap: Record<SelectorStrategy, number> = {
    'data-attribute': 0.95,
    'semantic': 0.90,
    'id': 0.85,
    'class': 0.70,
    'tag': 0.50,
    'xpath': 0.40,
    'position': 0.30,
    'text-content': 0.25
  };
  
  return stabilityMap[strategy] ?? 0;
}

/**
 * Получить лучший селектор для элемента
 */
export function getBestSelector(element: Element): GeneratedSelector | null {
  const selectors = generateSelectors(element);
  return selectors[0] ?? null;
}

/**
 * Проверить работу селектора
 */
export function validateSelector(selector: string): boolean {
  try {
    document.querySelector(selector);
    return true;
  } catch {
    return false;
  }
}
