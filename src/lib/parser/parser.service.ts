/**
 * Parser Service
 * @module parser.service
 * @version 2.0.0
 */

import { matchesPattern } from '@lib/utils/url-pattern-matcher';
import type { ParserConfig, PageConfig, ParsedPageData, CustomField, WaitStrategy } from '../types/parser.types';

export class ParserService {
  detectPageType(config: ParserConfig, url: string): PageConfig | undefined {
    return config.pages.find(page => matchesPattern(url, page.urlPattern));
  }

  async parsePage(pageConfig: PageConfig, document: Document): Promise<ParsedPageData> {
    await this.applyLoadStrategy(pageConfig.loadStrategy);
    const data: Record<string, unknown> = {};
    for (const field of pageConfig.fields) {
      data[field.key] = this.extractField(document, field);
    }
    return { pageType: pageConfig.name, data };
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
    const maxIterations = strategy.maxIterations || 10;
    for (let i = 0; i < maxIterations; i++) {
      if (!strategy.selector) break;
      const btn = document.querySelector(strategy.selector) as HTMLElement;
      if (!btn) break;
      btn.click();
      await (strategy.waitForSelector ? this.waitForElement(strategy.waitForSelector, strategy.timeout || 5000) : this.delay(strategy.timeout || 1000));
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
      if (!btn || btn.style.display === 'none') break;
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
    const { type, selector, transform } = field;
    let value: unknown;
    switch (type) {
      case 'string': value = this.extractText(document, selector); break;
      case 'array': value = this.extractArray(document, selector); break;
      case 'image':
      case 'url': value = this.extractAttribute(document, selector, 'src', 'href'); break;
      case 'number': value = parseFloat(this.extractText(document, selector).replace(/[^0-9.]/g, '')); break;
      case 'object': value = this.extractObject(document, selector); break;
      default: value = '';
    }
    if (transform && typeof value === 'string') value = this.applyTransform(value, transform);
    return value;
  }

  private applyTransform(value: string, transform: { type: string; pattern?: string; replacement?: string }): string {
    switch (transform.type) {
      case 'trim': return value.trim();
      case 'lowercase': return value.toLowerCase();
      case 'uppercase': return value.toUpperCase();
      case 'replace': return transform.pattern && transform.replacement ? value.replace(new RegExp(transform.pattern, 'g'), transform.replacement) : value;
      case 'regex': return transform.pattern ? (value.match(new RegExp(transform.pattern))?.[0] || value) : value;
      default: return value;
    }
  }

  private extractText(doc: Document, sel: string): string { return doc.querySelector(sel)?.textContent?.trim() ?? ''; }
  private extractArray(doc: Document, sel: string): string[] { return Array.from(doc.querySelectorAll(sel)).map(el => el.textContent?.trim() ?? ''); }
  private extractAttribute(doc: Document, sel: string, ...attrs: string[]): string {
    const el = doc.querySelector(sel);
    if (!el) return '';
    for (const attr of attrs) {
      const val = el.getAttribute(attr);
      if (val) return val;
    }
    return '';
  }
  private extractObject(doc: Document, sel: string): Record<string, unknown> {
    const el = doc.querySelector(sel);
    return el ? { text: el.textContent?.trim() ?? '', html: el.innerHTML } : {};
  }

  validateSelector(doc: Document, sel: string, type: string): { isValid: boolean; elementCount: number; previewText?: string; arrayPreview?: string[]; error?: string; } {
    try {
      const els = doc.querySelectorAll(sel);
      if (els.length === 0) return { isValid: false, elementCount: 0, error: 'No elements' };
      if (type === 'array') return { isValid: true, elementCount: els.length, arrayPreview: Array.from(els).slice(0, 3).map(el => el.textContent?.trim() ?? '') };
      return { isValid: true, elementCount: els.length, previewText: els[0]?.textContent?.trim().substring(0, 100) };
    } catch (error) {
      return { isValid: false, elementCount: 0, error: error instanceof Error ? error.message : 'Invalid' };
    }
  }

  generateSelector(el: HTMLElement, detectArray = false): string {
    if (detectArray) return this.generateArraySelector(el);
    if (el.id) return `#${el.id}`;
    const cls = Array.from(el.classList).filter(c => !c.match(/^(hover|active|focus)/)).join('.');
    if (cls && document.querySelectorAll(`${el.tagName.toLowerCase()}.${cls}`).length === 1) return `${el.tagName.toLowerCase()}.${cls}`;
    return this.generatePathSelector(el);
  }

  private generateArraySelector(el: HTMLElement): string {
    const parent = el.parentElement;
    if (!parent) return this.generateSelector(el, false);
    const siblings = Array.from(parent.children).filter((c): c is HTMLElement => c.tagName === el.tagName && c.className === el.className);
    if (siblings.length > 1) {
      const cls = Array.from(el.classList).join('.');
      const pSel = this.generateSimpleSelector(parent);
      return cls ? `${pSel} ${el.tagName.toLowerCase()}.${cls}` : `${pSel} ${el.tagName.toLowerCase()}`;
    }
    return this.generateSelector(el, false);
  }

  private generateSimpleSelector(el: HTMLElement): string {
    if (el.id) return `#${el.id}`;
    const cls = Array.from(el.classList).filter(c => !c.match(/^(hover|active)/)).join('.');
    return cls ? `${el.tagName.toLowerCase()}.${cls}` : el.tagName.toLowerCase();
  }

  private generatePathSelector(el: HTMLElement): string {
    const path: string[] = [];
    let cur: HTMLElement | null = el;
    while (cur && cur !== document.body) {
      let sel = cur.tagName.toLowerCase();
      if (cur.id) { sel += `#${cur.id}`; path.unshift(sel); break; }
      const parent: HTMLElement | null = cur.parentElement;
      if (parent) {
        const sibs = Array.from(parent.children).filter((s): s is Element => s.tagName === cur!.tagName);
        if (sibs.length > 1) sel += `:nth-of-type(${sibs.indexOf(cur) + 1})`;
      }
      path.unshift(sel);
      cur = parent;
    }
    return path.join(' > ');
  }
}

export const parserService = new ParserService();
