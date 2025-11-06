/**
 * DOM утилиты для работы с элементами
 */

/**
 * Получить все атрибуты элемента
 */
export function getElementAttributes(element: Element): Record<string, string> {
  const attributes: Record<string, string> = {};
  
  for (const attr of element.attributes) {
    attributes[attr.name] = attr.value;
  }
  
  return attributes;
}

/**
 * Получить XPath для элемента
 */
export function getElementXPath(element: Element): string {
  const parts: string[] = [];
  let current = element as Element | null;

  while (current && current.nodeType === Node.ELEMENT_NODE) {
    let index = 1;
    let sibling = current.previousElementSibling;
    
    while (sibling) {
      if (sibling.tagName === current.tagName) {
        index++;
      }
      sibling = sibling.previousElementSibling;
    }
    
    const tagName = current.tagName.toLowerCase();
    const part = index > 1 ? `${tagName}[${index}]` : tagName;
    parts.unshift(part);
    
    current = current.parentElement;
  }
  
  return '/' + parts.join('/');
}

/**
 * Получить CSS путь для элемента
 */
export function getElementCSSPath(element: Element): string {
  const parts: string[] = [];
  let current = element as Element | null;

  while (current && current !== document.body) {
    let selector = current.tagName.toLowerCase();
    
    // Добавляем ID если есть
    if (current.id) {
      selector += `#${current.id}`;
      parts.unshift(selector);
      break;
    }
    
    // Добавляем классы
    if (current.className) {
      const classes = current.className.trim().split(/\s+/).filter(Boolean);
      if (classes.length > 0) {
        selector += `.${classes.join('.')}`;
      }
    }
    
    // Позиция среди соседей
    const siblings = Array.from(current.parentElement?.children || []);
    const sameTagSiblings = siblings.filter(s => s.tagName === current!.tagName);
    
    if (sameTagSiblings.length > 1) {
      const index = sameTagSiblings.indexOf(current) + 1;
      selector += `:nth-of-type(${index})`;
    }
    
    parts.unshift(selector);
    current = current.parentElement;
  }
  
  return parts.join(' > ');
}

/**
 * Проверить, видим ли элемент
 */
export function isElementVisible(element: Element): boolean {
  const style = window.getComputedStyle(element);
  
  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0' &&
    element.clientHeight > 0 &&
    element.clientWidth > 0
  );
}

/**
 * Найти элемент по селектору с фаллбэком
 */
export function findElement(selectors: string[]): Element | null {
  for (const selector of selectors) {
    try {
      const element = document.querySelector(selector);
      if (element && isElementVisible(element)) {
        return element;
      }
    } catch (error) {
      console.warn(`Invalid selector: ${selector}`, error);
    }
  }
  
  return null;
}

/**
 * Найти все элементы по селектору
 */
export function findElements(selectors: string[]): Element[] {
  for (const selector of selectors) {
    try {
      const elements = Array.from(document.querySelectorAll(selector))
        .filter(isElementVisible);
      
      if (elements.length > 0) {
        return elements;
      }
    } catch (error) {
      console.warn(`Invalid selector: ${selector}`, error);
    }
  }
  
  return [];
}

/**
 * Подсветить элемент
 */
export function highlightElement(element: Element, className = 'pcb-highlight'): void {
  element.classList.add(className);
}

/**
 * Убрать подсветку с элемента
 */
export function unhighlightElement(element: Element, className = 'pcb-highlight'): void {
  element.classList.remove(className);
}

/**
 * Убрать все подсветки на странице
 */
export function clearAllHighlights(className = 'pcb-highlight'): void {
  const highlighted = document.querySelectorAll(`.${className}`);
  highlighted.forEach(element => {
    element.classList.remove(className);
  });
}

/**
 * Получить размеры элемента
 */
export function getElementRect(element: Element): DOMRect {
  return element.getBoundingClientRect();
}

/**
 * Проверить, находится ли элемент в области видимости
 */
export function isElementInViewport(element: Element): boolean {
  const rect = getElementRect(element);
  
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= window.innerHeight &&
    rect.right <= window.innerWidth
  );
}
