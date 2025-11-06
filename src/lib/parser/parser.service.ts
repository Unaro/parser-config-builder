/**
 * Service для парсинга страниц манги/комиксов
 * @module parser.service
 * @version 1.0.0
 */

import type { ParserConfig, ParsedData, Chapter, Page } from '../types/parser.types';

/**
 * Сервис для парсинга страниц
 */
export class ParserService {
  /**
   * Парсить страницу с использованием конфигурации
   */
  async parse(config: ParserConfig, document: Document): Promise<ParsedData> {
    const { selectors } = config;

    const title = this.extractText(document, selectors.title);
    const author = selectors.author 
      ? this.extractText(document, selectors.author) 
      : undefined;
    const description = selectors.description 
      ? this.extractText(document, selectors.description) 
      : undefined;
    const cover = selectors.cover 
      ? this.extractAttribute(document, selectors.cover, 'src') 
      : undefined;
    const tags = selectors.tags 
      ? this.extractTextArray(document, selectors.tags) 
      : undefined;

    const chapters = this.extractChapters(document, selectors.chapters);

    return {
      title,
      author,
      description,
      cover,
      tags,
      chapters
    };
  }

  /**
   * Извлечь текст из элемента по селектору
   */
  private extractText(document: Document, selector: string): string {
    const element = document.querySelector(selector);
    return element?.textContent?.trim() ?? '';
  }

  /**
   * Извлечь массив текстов из элементов по селектору
   */
  private extractTextArray(document: Document, selector: string): readonly string[] {
    const elements = document.querySelectorAll(selector);
    return Array.from(elements).map(el => el.textContent?.trim() ?? '');
  }

  /**
   * Извлечь атрибут из элемента по селектору
   */
  private extractAttribute(
    document: Document, 
    selector: string, 
    attribute: string
  ): string | undefined {
    const element = document.querySelector(selector);
    return element?.getAttribute(attribute) ?? undefined;
  }

  /**
   * Извлечь главы из элементов
   */
  private extractChapters(document: Document, selector: string): readonly Chapter[] {
    const elements = document.querySelectorAll(selector);
    
    return Array.from(elements).map((element, index) => {
      const link = element.querySelector('a');
      const title = element.textContent?.trim() ?? '';
      const url = link?.href ?? '';
      
      return {
        id: crypto.randomUUID(),
        title,
        url,
        number: index + 1
      };
    });
  }

  /**
   * Извлечь изображения страниц
   */
  extractImages(document: Document, selector: string): readonly Page[] {
    const elements = document.querySelectorAll(selector);
    
    return Array.from(elements).map((element, index) => {
      const img = element as HTMLImageElement;
      return {
        number: index + 1,
        imageUrl: img.src || img.dataset.src || ''
      };
    });
  }

  /**
   * Валидировать селектор на текущей странице
   */
  validateSelector(document: Document, selector: string): {
    isValid: boolean;
    elementCount: number;
    previewText?: string;
    error?: string;
  } {
    try {
      const elements = document.querySelectorAll(selector);
      const elementCount = elements.length;
      
      if (elementCount === 0) {
        return {
          isValid: false,
          elementCount: 0,
          error: 'No elements found'
        };
      }

      const firstElement = elements[0];
      const previewText = firstElement?.textContent?.trim().substring(0, 100);

      return {
        isValid: true,
        elementCount,
        previewText
      };
    } catch (error) {
      return {
        isValid: false,
        elementCount: 0,
        error: error instanceof Error ? error.message : 'Invalid selector'
      };
    }
  }

  /**
   * Сгенерировать CSS селектор для элемента
   */
  generateSelector(element: HTMLElement): string {
    if (element.id) {
      return `#${element.id}`;
    }

    const classes = Array.from(element.classList)
      .filter(cls => !cls.startsWith('hover') && !cls.startsWith('active'))
      .join('.');
    
    if (classes) {
      const selector = `${element.tagName.toLowerCase()}.${classes}`;
      const matches = document.querySelectorAll(selector);
      if (matches.length === 1) {
        return selector;
      }
    }

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

/**
 * Singleton экземпляр сервиса
 */
export const parserService = new ParserService();
