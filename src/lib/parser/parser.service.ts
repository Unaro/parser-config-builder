/**
 * Parser Service v4.4 - Multiple Selectors
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
    if (pageConfig.preParseActions) {
      await domProtectionService.executeActions(pageConfig.preParseActions);
    }
    
    if (subPage?.preParseActions) {
      await domProtectionService.executeActions(subPage.preParseActions);
    }
    
    const parseDoc = pageConfig.snapshotConfig?.enabled 
      ? domProtectionService.createSnapshot() 
      : document;
    
    const data: Record<string, unknown> = {};
    
    for (const field of pageConfig.commonFields) {
      data[field.key] = await this.extractFieldWithLoading(parseDoc, field);
    }
    
    if (subPage) {
      for (const field of subPage.fields) {
        data[field.key] = await this.extractFieldWithLoading(parseDoc, field);
      }
    }
    
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

  validateMultipleSelectors(document: Document, selectors: string[], type: string): {
    isValid: boolean;
    totalCount: number;
    perSelector: Array<{ selector: string; count: number }>;
    arrayPreview?: string[];
  } {
    const results = selectors.map(sel => {
      const elements = document.querySelectorAll(sel);
      return { selector: sel, count: elements.length, elements };
    });

    const totalCount = results.reduce((acc, r) => acc + r.count, 0);
    
    if (type === 'array') {
      const allElements = results.flatMap(r => Array.from(r.elements));
      const previews = allElements.slice(0, 5).map(el => el.textContent?.trim().substring(0, 50) || '');
      return {
        isValid: totalCount > 0,
        totalCount,
        perSelector: results.map(r => ({ selector: r.selector, count: r.count })),
        arrayPreview: previews
      };
    }

    return {
      isValid: totalCount > 0,
      totalCount,
      perSelector: results.map(r => ({ selector: r.selector, count: r.count }))
    };
  }

  private async extractFieldWithLoading(document: Document, field: CustomField): Promise<unknown> {
    if (field.preParseActions) {
      await domProtectionService.executeActions(field.preParseActions);
    }
    
    if (field.loadConfig && field.loadConfig.strategy !== 'none') {
      await this.applyFieldLoadStrategy(document, field);
    }

    const allSelectors = field.selectors && field.selectors.length > 0 
      ? field.selectors 
      : [field.selector];

    const { type, arrayItemType } = field;
    
    switch (type) {
      case 'string': {
        for (const selector of allSelectors) {
          const element = document.querySelector(selector);
          if (element?.textContent?.trim()) {
            return element.textContent.trim();
          }
        }
        return '';
      }
        
      case 'array': {
        const allElements: Element[] = [];
        for (const selector of allSelectors) {
          const elements = Array.from(document.querySelectorAll(selector));
          allElements.push(...elements);
        }
        
        switch (arrayItemType) {
          case 'number':
            return allElements.map(el => parseFloat(el.textContent?.trim().replace(/[^0-9.]/g, '') || '0'));
          case 'image':
            return allElements.map(el => el.getAttribute('src') || '');
          case 'url':
            return allElements.map(el => el.getAttribute('href') || '');
          case 'custom-object':
            return allElements.map(el => ({ raw: el.textContent?.trim() }));
          default:
            return allElements.map(el => el.textContent?.trim() || '');
        }
      }
        
      case 'image':
      case 'url': {
        for (const selector of allSelectors) {
          const element = document.querySelector(selector);
          const attr = element?.getAttribute(type === 'image' ? 'src' : 'href');
          if (attr) return attr;
        }
        return '';
      }
        
      case 'number': {
        for (const selector of allSelectors) {
          const element = document.querySelector(selector);
          if (element?.textContent) {
            return parseFloat(element.textContent.trim().replace(/[^0-9.]/g, '') || '0');
          }
        }
        return 0;
      }
        
      default: 
        return '';
    }
  }

  private async applyFieldLoadStrategy(document: Document, field: CustomField): Promise<void> {
    if (!field.loadConfig) return;

    const { strategy, buttonSelector, maxIterations = 5, waitAfterAction = 1000, stopWhenNoChange = true } = field.loadConfig;
    
    const primarySelector = (field.selectors && field.selectors.length > 0 && field.selectors[0]) 
      ? field.selectors[0] 
      : field.selector;

    if (!primarySelector) return;

    switch (strategy) {
      case 'none':
        break;

      case 'click-expand':
        if (buttonSelector) {
          const parentElement = document.querySelector(primarySelector);
          if (parentElement) {
            const button = parentElement.querySelector(buttonSelector) as HTMLElement;
            if (button) {
              button.click();
              await this.delay(waitAfterAction);
            }
          }
        }
        break;

      case 'infinite-scroll': {
        for (let i = 0; i < maxIterations; i++) {
          const allSelectors = field.selectors && field.selectors.length > 0 ? field.selectors : [field.selector];
          let allItems: Element[] = [];
          for (const sel of allSelectors) {
            if (sel) {
              allItems.push(...Array.from(document.querySelectorAll(sel)));
            }
          }
          
          if (allItems.length === 0) break;

          const lastItem = allItems[allItems.length - 1];
          if (lastItem) {
            lastItem.scrollIntoView({ behavior: 'smooth', block: 'end' });
          }

          const prevCount = allItems.length;
          await this.delay(waitAfterAction);

          if (stopWhenNoChange) {
            let newItems: Element[] = [];
            for (const sel of allSelectors) {
              if (sel) {
                newItems.push(...Array.from(document.querySelectorAll(sel)));
              }
            }
            if (newItems.length === prevCount) break;
          }
        }
        break;
      }

      case 'click-load-more':
        if (buttonSelector) {
          for (let i = 0; i < maxIterations; i++) {
            const button = document.querySelector(buttonSelector) as HTMLElement;
            if (!button) break;

            const allSelectors = field.selectors && field.selectors.length > 0 ? field.selectors : [field.selector];
            let prevCount = 0;
            for (const sel of allSelectors) {
              if (sel) {
                prevCount += document.querySelectorAll(sel).length;
              }
            }

            button.click();
            await this.delay(waitAfterAction);

            if (stopWhenNoChange) {
              let newCount = 0;
              for (const sel of allSelectors) {
                if (sel) {
                  newCount += document.querySelectorAll(sel).length;
                }
              }
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

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  generateSelector(el: HTMLElement, detectArray = false): string {
    return generateSmartSelector(el, detectArray ? 'array' : 'single');
  }
}

export const parserService = new ParserService();
