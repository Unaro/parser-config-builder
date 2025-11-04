/**
 * DevTools-like Selector Generator - точная генерация как в браузере
 */

import type { GeneratedSelector, SelectorStrategy } from '@/types';

const HASH_CLASS_REGEX = /^(?:[a-z]{1,3}[-_])?[a-z0-9]{6,}$/i; // css-1a2b3c, _a1b2c3, ab12cd34
const STABLE_ATTRS = ['data-testid', 'data-test', 'data-qa', 'data-id', 'data-key', 'aria-label', 'role', 'itemprop'];

export function generateSelectors(element: Element): GeneratedSelector[] {
  const selectors: GeneratedSelector[] = [];

  // 1. ID-based (highest priority)
  const idSelector = generateIdBasedSelector(element);
  if (idSelector) selectors.push(idSelector);

  // 2. Attribute-based
  const attrSelector = generateAttributeBasedSelector(element);
  if (attrSelector) selectors.push(attrSelector);

  // 3. Full path from nearest stable anchor (DevTools-like)
  const fullPathSelector = generateFullPathSelector(element);
  if (fullPathSelector) selectors.push(fullPathSelector);

  // 4. Class-based (filtered from hashed)
  const classSelector = generateClassBasedSelector(element);
  if (classSelector) selectors.push(classSelector);

  // Sort by confidence desc, then by length asc
  return selectors.sort((a, b) => (b.confidence - a.confidence) || (a.selector.length - b.selector.length));
}

/**
 * Generate ID-based selector
 */
function generateIdBasedSelector(element: Element): GeneratedSelector | null {
  if (!element.id) return null;
  
  const selector = `#${cssEscape(element.id)}`;
  const count = queryCount(selector);
  
  if (count === 1) {
    return {
      selector,
      strategy: 'id',
      confidence: 1.0,
      uniqueness: 1.0,
      stability: 0.9,
      element
    };
  }
  
  return null;
}

/**
 * Generate attribute-based selector
 */
function generateAttributeBasedSelector(element: Element): GeneratedSelector | null {
  for (const attr of STABLE_ATTRS) {
    const value = element.getAttribute(attr);
    if (!value) continue;
    
    const selector = `[${attr}="${cssEscape(value)}"]`;
    const count = queryCount(selector);
    
    if (count === 1) {
      return {
        selector,
        strategy: 'data-attribute',
        confidence: 0.95,
        uniqueness: 1.0,
        stability: 0.95,
        element
      };
    }
  }
  
  return null;
}

/**
 * Generate full path selector like DevTools "Copy selector"
 */
function generateFullPathSelector(element: Element): GeneratedSelector | null {
  const path = buildDevToolsPath(element);
  if (!path) return null;
  
  const count = queryCount(path);
  let finalSelector = path;
  
  // If not unique, try to make it unique by adding nth-child selectors
  if (count > 1) {
    finalSelector = makeUniqueWithNthChild(element, path);
  }
  
  const finalCount = queryCount(finalSelector);
  
  return {
    selector: finalSelector,
    strategy: 'position',
    confidence: finalCount === 1 ? 0.9 : 0.7,
    uniqueness: finalCount === 1 ? 1.0 : 1.0 / Math.max(finalCount, 2),
    stability: 0.85,
    element
  };
}

/**
 * Build DevTools-like path from element to root or nearest unique anchor
 */
function buildDevToolsPath(element: Element): string | null {
  const segments: string[] = [];
  let current: Element | null = element;
  
  while (current && current.nodeType === Node.ELEMENT_NODE) {
    const segment = buildSegment(current);
    if (!segment) return null;
    
    segments.unshift(segment);
    
    // Stop if we found a unique anchor (ID or unique attribute)
    if (isUniqueAnchor(current)) {
      break;
    }
    
    current = current.parentElement;
    
    // Safety: don't go beyond html
    if (current && current.tagName.toLowerCase() === 'html') {
      break;
    }
  }
  
  return segments.join(' > ');
}

/**
 * Build segment for single element like DevTools
 */
function buildSegment(element: Element): string | null {
  const tagName = element.tagName.toLowerCase();
  
  // If element has unique ID, use it
  if (element.id && queryCount(`#${cssEscape(element.id)}`) === 1) {
    return `#${cssEscape(element.id)}`;
  }
  
  // Check for unique stable attributes
  for (const attr of STABLE_ATTRS) {
    const value = element.getAttribute(attr);
    if (value && queryCount(`[${attr}="${cssEscape(value)}"]`) === 1) {
      return `${tagName}[${attr}="${cssEscape(value)}"]`;
    }
  }
  
  // Use stable classes (filter out hashed ones)
  const stableClasses = getStableClasses(element);
  const classSelector = stableClasses.length > 0 ? `.${stableClasses.join('.')}` : '';
  
  // Add nth-child if needed for disambiguation
  const nthChild = getNthChildSelector(element);
  const nthSelector = nthChild > 1 ? `:nth-child(${nthChild})` : '';
  
  return `${tagName}${classSelector}${nthSelector}`;
}

/**
 * Get stable (non-hashed) classes
 */
function getStableClasses(element: Element): string[] {
  const classes = Array.from(element.classList);
  return classes
    .filter(cls => !HASH_CLASS_REGEX.test(cls)) // Filter out hashed classes
    .slice(0, 2) // Limit to 2 most relevant classes
    .map(cls => cssEscape(cls));
}

/**
 * Get nth-child position
 */
function getNthChildSelector(element: Element): number {
  const parent = element.parentElement;
  if (!parent) return 1;
  
  const siblings = Array.from(parent.children);
  const sameTagSiblings = siblings.filter(sibling => 
    sibling.tagName.toLowerCase() === element.tagName.toLowerCase()
  );
  
  if (sameTagSiblings.length === 1) {
    return 1; // No need for nth-child if it's the only one
  }
  
  return sameTagSiblings.indexOf(element) + 1;
}

/**
 * Check if element is a unique anchor (has unique ID or attribute)
 */
function isUniqueAnchor(element: Element): boolean {
  if (element.id && queryCount(`#${cssEscape(element.id)}`) === 1) {
    return true;
  }
  
  for (const attr of STABLE_ATTRS) {
    const value = element.getAttribute(attr);
    if (value && queryCount(`[${attr}="${cssEscape(value)}"]`) === 1) {
      return true;
    }
  }
  
  return false;
}

/**
 * Make selector unique by adding nth-child where needed
 */
function makeUniqueWithNthChild(element: Element, baseSelector: string): string {
  let current = baseSelector;
  let attempts = 0;
  const maxAttempts = 5;
  
  while (queryCount(current) > 1 && attempts < maxAttempts) {
    // Try to add more specific nth-child selectors
    current = addNthChildToAmbiguousSegments(element, current);
    attempts++;
  }
  
  return current;
}

/**
 * Add nth-child to segments that need disambiguation
 */
function addNthChildToAmbiguousSegments(element: Element, selector: string): string {
  // This is a simplified approach - in practice, you'd parse the selector
  // and add nth-child to specific segments that cause ambiguity
  
  const segments = selector.split(' > ');
  let current: Element | null = element;
  const improvedSegments: string[] = [];
  
  // Work backwards from target element
  for (let i = segments.length - 1; i >= 0 && current; i--) {
    const segment = segments[i];
    
    if (!segment.includes(':nth-child')) {
      const nthChild = getNthChildSelector(current);
      if (nthChild > 1) {
        // Add nth-child to this segment
        const tagMatch = segment.match(/^([a-z]+)/i);
        if (tagMatch) {
          const newSegment = segment + `:nth-child(${nthChild})`;
          improvedSegments.unshift(newSegment);
        } else {
          improvedSegments.unshift(segment);
        }
      } else {
        improvedSegments.unshift(segment);
      }
    } else {
      improvedSegments.unshift(segment);
    }
    
    current = current.parentElement;
  }
  
  return improvedSegments.join(' > ');
}

/**
 * Generate class-based selector (fallback)
 */
function generateClassBasedSelector(element: Element): GeneratedSelector | null {
  const stableClasses = getStableClasses(element);
  if (stableClasses.length === 0) return null;
  
  const tagName = element.tagName.toLowerCase();
  const selector = `${tagName}.${stableClasses.join('.')}`;
  
  return {
    selector,
    strategy: 'class',
    confidence: 0.7,
    uniqueness: 1.0 / Math.max(queryCount(selector), 1),
    stability: 0.6,
    element
  };
}

/**
 * CSS escape utility
 */
function cssEscape(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/'/g, "\\'");
}

/**
 * Count elements matching selector
 */
export function queryCount(selector: string): number {
  try {
    return document.querySelectorAll(selector).length;
  } catch {
    return 0;
  }
}

/**
 * Validate selector syntax
 */
export function validateSelector(selector: string): boolean {
  try {
    document.querySelector(selector);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get best selector for element
 */
export function getBestSelector(element: Element): GeneratedSelector | null {
  const selectors = generateSelectors(element);
  return selectors[0] ?? null;
}