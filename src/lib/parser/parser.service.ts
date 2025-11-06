/**
 * Service для парсинга с динамическими полями
 * @module parser.service
 * @version 1.0.0
 */

import type { ParserConfig, ParsedData, CustomField } from '../types/parser.types';

export class ParserService {
  /**
   * Парсить страницу с использованием динамической конфигурации
   */
  async parse(config: ParserConfig, document: Document): Promise<ParsedData> {
    const result: ParsedData = {};

    for (const field of config.fields) {
      const value = this.extractField(document, field);
      result[field.key] = value;
    }

    return result;
  }

  /**
   * Извлечь значение поля по его типу
   */
  private extractField(
    document: Document,
    field: CustomField
  ): string | string[] | Record<string, unknown> {
    const { type, selector } = field;

    switch (type) {
      case 'string':
        return this.extractText(document, selector);
      
      case 'array':
        return this.extractArray(document, selector);
      
      case 'image':
        return this.extractImage(document, selector);
      
      case 'object':
        return this.extractObject(document, selector);
      
      default:
        return '';
    }
  }

  private extractText(document: Document, selector: string): string {
    const element = document.querySelector(selector);
    return element?.textContent?.trim() ?? '';
  }

  private extractArray(document: Document, selector: string): string[] {
    const elements = document.querySelectorAll(selector);
    return Array.from(elements).map(el => el.textContent?.trim() ?? '');
  }

  private extractImage(document: Document, selector: string): string {
    const element = document.querySelector(selector);
    if (!element) return '';
    
    const img = element as HTMLImageElement;
    return img.src || img.dataset.src || element.getAttribute('src') || '';
  }

  private extractObject(document: Document, selector: string): Record<string, unknown> {
    const element = document.querySelector(selector);
    if (!element) return {};
    
    return {
      text: element.textContent?.trim() ?? '',
      html: element.innerHTML
    };
  }

  /**
   * Валидировать селектор
   */
  validateSelector(document: Document, selector: string, type: string): {
    isValid: boolean;
    elementCount: number;
    previewText?: string;
    arrayPreview?: string[];
    error?: string;
  } {
    try {
      const elements = document.querySelectorAll(selector);
      const elementCount = elements.length;
      
      if (elementCount === 0) {
        return { isValid: false, elementCount: 0, error: 'No elements found' };
      }

      if (type === 'array') {
        const arrayPreview = Array.from(elements)
          .slice(0, 3)
          .map(el => el.textContent?.trim() ?? '');
        
        return {
          isValid: true,
          elementCount,
          arrayPreview
        };
      } else {
        const firstElement = elements[0];
        const previewText = firstElement?.textContent?.trim().substring(0, 100);

        return {
          isValid: true,
          elementCount,
          previewText
        };
      }
    } catch (error) {
      return {
        isValid: false,
        elementCount: 0,
        error: error instanceof Error ? error.message : 'Invalid selector'
      };
    }
  }

  /**
   * Сгенерировать селектор для элемента
   * Если detectArray = true, попытается найти селектор для массива элементов
   */
  generateSelector(element: HTMLElement, detectArray = false): string {
    if (detectArray) {
      return this.generateArraySelector(element);
    }

    if (element.id) {
      return `#${element.id}`;
    }

    const classes = Array.from(element.classList)
      .filter(cls => !cls.startsWith('hover') && !cls.startsWith('active') && !cls.startsWith('focus'))
      .join('.');
    
    if (classes) {
      const selector = `${element.tagName.toLowerCase()}.${classes}`;
      const matches = document.querySelectorAll(selector);
      if (matches.length === 1) {
        return selector;
      }
    }

    return this.generatePathSelector(element);
  }

  /**
   * Сгенерировать селектор для массива элементов
   * Кликнули на один элемент → находим все похожие
   */
  private generateArraySelector(element: HTMLElement): string {
    const parent = element.parentElement;
    if (!parent) {
      return this.generateSelector(element, false);
    }

    // Находим всех siblings с таким же тегом и классами
    const siblings = Array.from(parent.children).filter(
      (child): child is HTMLElement => 
        child.tagName === element.tagName &&
        child.className === element.className
    );

    if (siblings.length > 1) {
      // Есть похожие элементы - создаем общий селектор
      const elementClasses = Array.from(element.classList).join('.');
      const parentSelector = this.generateSimpleSelector(parent);
      
      if (elementClasses) {
        return `${parentSelector} ${element.tagName.toLowerCase()}.${elementClasses}`;
      } else {
        return `${parentSelector} ${element.tagName.toLowerCase()}`;
      }
    }

    // Нет siblings - поднимаемся выше
    if (parent.parentElement) {
      const grandParent = parent.parentElement;
      const parentSiblings = Array.from(grandParent.children).filter(
        (child): child is HTMLElement => child.tagName === parent.tagName
      );

      if (parentSiblings.length > 1) {
        const elementClasses = Array.from(element.classList).join('.');
        const parentClasses = Array.from(parent.classList).join('.');
        const grandParentSelector = this.generateSimpleSelector(grandParent);
        
        return `${grandParentSelector} ${parent.tagName.toLowerCase()}${parentClasses ? '.' + parentClasses : ''} ${element.tagName.toLowerCase()}${elementClasses ? '.' + elementClasses : ''}`;
      }
    }

    return this.generateSelector(element, false);
  }

  /**
   * Простой селектор для элемента (без полного пути)
   */
  private generateSimpleSelector(element: HTMLElement): string {
    if (element.id) return `#${element.id}`;
    
    const classes = Array.from(element.classList)
      .filter(cls => !cls.startsWith('hover') && !cls.startsWith('active'))
      .join('.');
    
    return classes ? `${element.tagName.toLowerCase()}.${classes}` : element.tagName.toLowerCase();
  }

  /**
   * Полный путь селектора
   */
  private generatePathSelector(element: HTMLElement): string {
    const path: string[] = [];
    let current: HTMLElement | null = element;

    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();
      
      if (current.id) {
        selector += `#${current.id}`;
        path.unshift(selector);
        break;
      }

      const currentElement: HTMLElement = current;
      const parent: HTMLElement | null = currentElement.parentElement;
      
      if (parent) {
        const siblings: Element[] = Array.from(parent.children);
        const sameTagSiblings: Element[] = siblings.filter(
          (s: Element) => s.tagName === currentElement.tagName
        );
        
        if (sameTagSiblings.length > 1) {
          const index = sameTagSiblings.indexOf(currentElement) + 1;
          selector += `:nth-of-type(${index})`;
        }
      }

      path.unshift(selector);
      current = parent;
    }

    return path.join(' > ');
  }
}

export const parserService = new ParserService();
