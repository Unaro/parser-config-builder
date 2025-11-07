/**
 * Parser Service v4.3 - Pre-Parse Actions
 * @module parser.service
 */

import { matchesPattern } from '@lib/utils/url-pattern-matcher';
import { generateSmartSelector } from '@lib/utils/smart-selector-generator';
import { domProtectionService } from './dom-protection.service';
import type { ParserConfig, PageConfig, SubPage, ParsedPageData, CustomField } from '../types/parser.types';

export class ParserService {
  detectPageAndSubPage(config: ParserConfig, url: string): { 
    page: PageConfig | undefined; 
    subPage: SubPage | undefined;
  } {
    for (const page of config.pages) {
      if (matchesPattern(url, page.urlPattern)) {
        const subPage = page.subPages?.find(sp => matchesPattern(url, sp.urlPattern));
        return { page, subPage };
      }
    }
    return { page: undefined, subPage: undefined };
  }

  async parsePage(pageConfig: PageConfig, subPage: SubPage | undefined, document: Document): Promise<ParsedPageData> {
    // 1. Выполняем Pre-Parse Actions страницы
    if (pageConfig.preParseActions) {
      await domProtectionService.executeActions(pageConfig.preParseActions);
    }
    
    // 2. Выполняем Pre-Parse Actions подстраницы
    if (subPage?.preParseActions) {
      await domProtectionService.executeActions(subPage.preParseActions);
    }
    
    // 3. Создаем snapshot если включен
    const parseDoc = pageConfig.snapshotConfig?.enabled 
      ? domProtectionService.createSnapshot() 
      : document;
    
    const data: Record<string, unknown> = {};
    
    // 4. Парсим Common Fields
    for (const field of pageConfig.commonFields) {
      data[field.key] = await this.extractFieldWithLoading(parseDoc, field);
    }
    
    // 5. Парсим SubPage Fields
    if (subPage) {
      for (const field of subPage.fields) {
        data[field.key] = await this.extractFieldWithLoading(parseDoc, field);
      }
    }
    
    // 6. Восстанавливаем состояние
    domProtectionService.restore();
    
    return { 
      pageType: subPage ? `${pageConfig.name} - ${subPage.name}` : pageConfig.name, 
      data 
    };
  }

  async parseAllSubPages(pageConfig: PageConfig, document: Document): Promise<ParsedPageData[]> {
    const results: ParsedPageData[] = [];
    
    if (pageConfig.tabSelector) {
      const tabs = document.querySelectorAll(pageConfig.tabSelector);
      
      for (let i = 0; i < tabs.length; i++) {
        const tab = tabs[i] as HTMLElement;
        tab.click();
        await this.delay(1000);
        
        const currentUrl = window.location.href;
        const subPage = pageConfig.subPages?.find(sp => matchesPattern(currentUrl, sp.urlPattern));
        
        if (subPage) {
          const pageData = await this.parsePage(pageConfig, subPage, document);
          results.push(pageData);
        }
      }
    } else {
      const currentUrl = window.location.href;
      const subPage = pageConfig.subPages?.find(sp => matchesPattern(currentUrl, sp.urlPattern));
      const pageData = await this.parsePage(pageConfig, subPage, document);
      results.push(pageData);
    }
    
    return results;
  }

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
        return { isValid: false, elementCount: 0, error: 'No elements' };
      }

      if (type === 'array' || type === 'custom-object') {
        const previews = Array.from(elements).slice(0, 5).map(el => el.textContent?.trim().substring(0, 50) || '');
        return { isValid: true, elementCount: elements.length, arrayPreview: previews };
      }

      const firstElement = elements[0];
      const previewText = firstElement?.textContent?.trim().substring(0, 100) || '';

      return { isValid: true, elementCount: elements.length, previewText };
    } catch (error) {
      return { isValid: false, elementCount: 0, error: error instanceof Error ? error.message : 'Invalid' };
    }
  }

  /**
   * Извлекает поле с Pre-Parse Actions и Load Strategy
   */
  private async extractFieldWithLoading(document: Document, field: CustomField): Promise<unknown> {
    // 1. Выполняем Pre-Parse Actions поля
    if (field.preParseActions) {
      await domProtectionService.executeActions(field.preParseActions);
    }
    
    // 2. Применяем Load Strategy
    if (field.loadConfig && field.loadConfig.strategy !== 'none') {
      await this.applyFieldLoadStrategy(document, field);
    }

    // 3. Извлекаем данные
    const { type, selector, arrayItemType } = field;
    
    switch (type) {
      case 'string': 
        return document.querySelector(selector)?.textContent?.trim() || '';
        
      case 'array': {
        const elements = Array.from(document.querySelectorAll(selector));
        
        switch (arrayItemType) {
          case 'number':
            return elements.map(el => parseFloat(el.textContent?.trim().replace(/[^0-9.]/g, '') || '0'));
          case 'image':
            return elements.map(el => el.getAttribute('src') || '');
          case 'url':
            return elements.map(el => el.getAttribute('href') || '');
          case 'custom-object':
            // TODO: парсинг custom objects
            return elements.map(el => ({ raw: el.textContent?.trim() }));
          default:
            return elements.map(el => el.textContent?.trim() || '');
        }
      }
        
      case 'image':
      case 'url': 
        return document.querySelector(selector)?.getAttribute(type === 'image' ? 'src' : 'href') || '';
        
      case 'number': 
        return parseFloat(document.querySelector(selector)?.textContent?.trim().replace(/[^0-9.]/g, '') || '0');
        
      default: 
        return '';
    }
  }

  private async applyFieldLoadStrategy(document: Document, field: CustomField): Promise<void> {
    if (!field.loadConfig) return;

    const { strategy, buttonSelector, maxIterations = 5, waitAfterAction = 1000, stopWhenNoChange = true } = field.loadConfig;

    switch (strategy) {
      case 'none':
        break;

      case 'click-expand':
        if (buttonSelector) {
          const parentElement = document.querySelector(field.selector);
          if (parentElement) {
            const button = parentElement.querySelector(buttonSelector) as HTMLElement;
            if (button) {
              button.click();
              await this.delay(waitAfterAction);
            }
          }
        }
        break;

      case 'infinite-scroll':
        for (let i = 0; i < maxIterations; i++) {
          const items = document.querySelectorAll(field.selector);
          if (items.length === 0) break;

          const lastItem = items[items.length - 1];
          if (lastItem) {
            lastItem.scrollIntoView({ behavior: 'smooth', block: 'end' });
          }

          const prevCount = items.length;
          await this.delay(waitAfterAction);

          if (stopWhenNoChange) {
            const newItems = document.querySelectorAll(field.selector);
            if (newItems.length === prevCount) break;
          }
        }
        break;

      case 'click-load-more':
        if (buttonSelector) {
          for (let i = 0; i < maxIterations; i++) {
            const button = document.querySelector(buttonSelector) as HTMLElement;
            if (!button) break;

            const prevCount = document.querySelectorAll(field.selector).length;
            button.click();
            await this.delay(waitAfterAction);

            if (stopWhenNoChange) {
              const newCount = document.querySelectorAll(field.selector).length;
              if (newCount === prevCount) break;
            }
          }
        }
        break;

      case 'hover-expand':
        if (buttonSelector) {
          const element = document.querySelector(buttonSelector) as HTMLElement;
          if (element) {
            element.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
            await this.delay(waitAfterAction);
          }
        }
        break;
    }
  }

  // private waitForElement(selector: string, timeout: number): Promise<void> {
  //   return new Promise((resolve, reject) => {
  //     if (document.querySelector(selector)) { resolve(); return; }
  //     const observer = new MutationObserver(() => {
  //       if (document.querySelector(selector)) { observer.disconnect(); resolve(); }
  //     });
  //     observer.observe(document.body, { childList: true, subtree: true });
  //     setTimeout(() => { observer.disconnect(); reject(new Error(`Timeout: ${selector}`)); }, timeout);
  //   });
  // }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  generateSelector(el: HTMLElement, detectArray = false): string {
    return generateSmartSelector(el, detectArray ? 'array' : 'single');
  }
}

export const parserService = new ParserService();
