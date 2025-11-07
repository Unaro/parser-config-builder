/**
 * Parser Service v3.2 - Smart Selectors
 * @module parser.service
 */

import { matchesPattern } from '@lib/utils/url-pattern-matcher';
import { generateSmartSelector } from '@lib/utils/smart-selector-generator';
import type { ParserConfig, PageConfig, ParsedPageData, CustomField, WaitStrategy, CustomObjectType } from '../types/parser.types';

export class ParserService {
  detectPageType(config: ParserConfig, url: string): PageConfig | undefined {
    return config.pages.find(page => matchesPattern(url, page.urlPattern));
  }

  async parsePage(pageConfig: PageConfig, document: Document): Promise<ParsedPageData> {
    await this.applyLoadStrategy(pageConfig.loadStrategy);
    const data: Record<string, unknown> = {};
    
    for (const field of pageConfig.fields) {
      if (field.type === 'custom-object' && field.customObjectTypeId) {
        const objectType = pageConfig.customObjectTypes.find(t => t.id === field.customObjectTypeId);
        if (objectType) {
          data[field.key] = this.extractCustomObjects(document, objectType);
        }
      } else {
        data[field.key] = this.extractField(document, field);
      }
    }
    
    return { pageType: pageConfig.name, data };
  }

  /**
   * Валидация селектора с предпросмотром
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
      
      if (elements.length === 0) {
        return {
          isValid: false,
          elementCount: 0,
          error: 'No elements found'
        };
      }

      if (type === 'array' || type === 'custom-object') {
        const previews = Array.from(elements)
          .slice(0, 5)
          .map(el => el.textContent?.trim().substring(0, 50) || '');
        
        return {
          isValid: true,
          elementCount: elements.length,
          arrayPreview: previews
        };
      }

      const firstElement = elements[0];
      const previewText = firstElement?.textContent?.trim().substring(0, 100) || '';

      return {
        isValid: true,
        elementCount: elements.length,
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

  private extractCustomObjects(document: Document, objectType: CustomObjectType): Array<Record<string, unknown>> {
    const containers = document.querySelectorAll(objectType.containerSelector);
    const results: Array<Record<string, unknown>> = [];

    containers.forEach((container) => {
      const obj: Record<string, unknown> = {};
      
      objectType.fields.forEach((field) => {
        const element = container.querySelector(field.selector);
        if (!element) return;

        let value: unknown;
        
        switch (field.type) {
          case 'string':
            value = element.textContent?.trim() || '';
            break;
          case 'number':
            value = parseFloat(element.textContent?.trim().replace(/[^0-9.]/g, '') || '0');
            break;
          case 'image':
            value = element.getAttribute('src') || '';
            break;
          case 'url':
            value = element.getAttribute('href') || '';
            break;
          case 'array':
            value = Array.from(container.querySelectorAll(field.selector))
              .map(el => el.textContent?.trim() || '');
            break;
          default:
            value = '';
        }

        obj[field.key] = value;
      });

      results.push(obj);
    });

    return results;
  }

  private async applyLoadStrategy(strategy: WaitStrategy): Promise<void> {
    switch (strategy.type) {
      case 'static': break;
      case 'pagination': await this.handlePagination(strategy); break;
      case 'infinite-scroll': await this.handleInfiniteScroll(strategy); break;
      case 'click-load': await this.handleClickLoad(strategy); break;
      case 'tab-switch': await this.handleTabSwitch(strategy); break;
      case 'ajax-wait': await this.handleAjaxWait(strategy); break;
    }
  }

  private async handlePagination(strategy: WaitStrategy): Promise<void> {
    const maxIter = strategy.maxIterations || 10;
    for (let i = 0; i < maxIter; i++) {
      if (!strategy.selector) break;
      const btn = document.querySelector(strategy.selector) as HTMLElement;
      if (!btn) break;
      btn.click();
      await this.delay(strategy.timeout || 1000);
    }
  }

  private async handleInfiniteScroll(strategy: WaitStrategy): Promise<void> {
    const maxIter = strategy.maxIterations || 5;
    const dist = strategy.scrollDistance || 500;
    for (let i = 0; i < maxIter; i++) {
      const h = document.body.scrollHeight;
      window.scrollTo({ top: h - dist, behavior: 'smooth' });
      await this.delay(strategy.timeout || 2000);
      if (document.body.scrollHeight === h) break;
    }
  }

  private async handleClickLoad(strategy: WaitStrategy): Promise<void> {
    const maxIter = strategy.maxIterations || 10;
    for (let i = 0; i < maxIter; i++) {
      if (!strategy.selector) break;
      const btn = document.querySelector(strategy.selector) as HTMLElement;
      if (!btn) break;
      btn.click();
      await this.delay(strategy.timeout || 1000);
    }
  }

  private async handleTabSwitch(strategy: WaitStrategy): Promise<void> {
    if (!strategy.selector) return;
    const tabs = document.querySelectorAll(strategy.selector);
    for (const tab of Array.from(tabs)) {
      (tab as HTMLElement).click();
      await this.delay(strategy.timeout || 500);
    }
  }

  private async handleAjaxWait(strategy: WaitStrategy): Promise<void> {
    if (strategy.waitForSelector) {
      await this.waitForElement(strategy.waitForSelector, strategy.timeout || 5000);
    } else {
      await this.delay(strategy.timeout || 2000);
    }
  }

  private waitForElement(selector: string, timeout: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (document.querySelector(selector)) { resolve(); return; }
      const observer = new MutationObserver(() => {
        if (document.querySelector(selector)) { observer.disconnect(); resolve(); }
      });
      observer.observe(document.body, { childList: true, subtree: true });
      setTimeout(() => { observer.disconnect(); reject(new Error(`Timeout: ${selector}`)); }, timeout);
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private extractField(document: Document, field: CustomField): unknown {
    const { type, selector } = field;
    switch (type) {
      case 'string': return document.querySelector(selector)?.textContent?.trim() || '';
      case 'array': return Array.from(document.querySelectorAll(selector)).map(el => el.textContent?.trim() || '');
      case 'image':
      case 'url': return document.querySelector(selector)?.getAttribute(type === 'image' ? 'src' : 'href') || '';
      case 'number': return parseFloat(document.querySelector(selector)?.textContent?.trim().replace(/[^0-9.]/g, '') || '0');
      default: return '';
    }
  }

  /**
   * Генерирует умный селектор
   */
  generateSelector(el: HTMLElement, detectArray = false): string {
    return generateSmartSelector(el, detectArray ? 'array' : 'single');
  }
}

export const parserService = new ParserService();
