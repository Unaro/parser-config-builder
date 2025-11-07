/**
 * DOM Protection Service - защита от интерактивных элементов
 * @module parser/dom-protection.service
 */

import type { PreParseAction } from '@lib/types/parser.types';

export class DOMProtectionService {
  private originalState: Map<string, any> = new Map();
  
  /**
   * Выполняет pre-parse actions перед парсингом
   */
  async executeActions(actions: PreParseAction[]): Promise<void> {
    for (const action of actions) {
      await this.executeAction(action);
    }
  }

  /**
   * Выполняет одно действие
   */
  private async executeAction(action: PreParseAction): Promise<void> {
    switch (action.type) {
      case 'disable-interactions':
        this.disableInteractions();
        break;
        
      case 'remove-overlays':
        this.removeOverlays();
        break;
        
      case 'expand-all':
        if (action.selector) {
          this.expandAll(action.selector);
        }
        break;
        
      case 'trigger-hover':
        if (action.selector) {
          await this.triggerHover(action.selector);
        }
        break;
        
      case 'wait-for-element':
        if (action.selector) {
          await this.waitForElement(action.selector, action.timeout || 5000);
        }
        break;
        
      case 'remove-elements':
        if (action.selector) {
          this.removeElements(action.selector);
        }
        break;
        
      case 'force-visible':
        if (action.selector) {
          this.forceVisible(action.selector);
        }
        break;
    }
  }

  /**
   * Отключает все интерактивные обработчики
   */
  private disableInteractions(): void {
    const style = document.createElement('style');
    style.id = 'parser-disable-interactions';
    style.textContent = `
      * {
        pointer-events: none !important;
      }
    `;
    document.head.appendChild(style);
    this.originalState.set('interactions-style', style);
  }

  /**
   * Удаляет модальные окна и overlays
   */
  private removeOverlays(): void {
    const overlaySelectors = [
      '.modal',
      '.overlay',
      '.popup',
      '[class*="modal"]',
      '[class*="overlay"]',
      '[class*="lightbox"]',
      '[role="dialog"]'
    ];
    
    overlaySelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        (el as HTMLElement).style.display = 'none';
      });
    });
  }

  /**
   * Раскрывает все collapsible элементы
   */
  private expandAll(selector: string): void {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
      const button = el.querySelector('button, [role="button"], .expand, .show-more') as HTMLElement;
      if (button) {
        button.click();
      }
    });
  }

  /**
   * Триггерит hover на элементах
   */
  private async triggerHover(selector: string): Promise<void> {
    const elements = document.querySelectorAll(selector);
    
    for (const element of Array.from(elements)) {
      const htmlElement = element as HTMLElement;
      
      // Сохраняем оригинальное состояние
      // const originalDisplay = htmlElement.style.display;
      
      // Триггерим hover события
      htmlElement.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      htmlElement.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
      
      // Ждем появления hover-контента
      await this.delay(300);
      
      // Ищем появившиеся элементы и делаем их постоянными
      const hoverElements = htmlElement.querySelectorAll('[class*="hover"], [class*="tooltip"]');
      hoverElements.forEach(el => {
        (el as HTMLElement).style.cssText += 'opacity: 1 !important; visibility: visible !important; display: block !important;';
      });
    }
  }

  /**
   * Ждет появления элемента
   */
  private waitForElement(selector: string, timeout: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (document.querySelector(selector)) {
        resolve();
        return;
      }
      
      const observer = new MutationObserver(() => {
        if (document.querySelector(selector)) {
          observer.disconnect();
          resolve();
        }
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Timeout waiting for: ${selector}`));
      }, timeout);
    });
  }

  /**
   * Удаляет элементы по селектору
   */
  private removeElements(selector: string): void {
    document.querySelectorAll(selector).forEach(el => el.remove());
  }

  /**
   * Делает элементы видимыми принудительно
   */
  private forceVisible(selector: string): void {
    document.querySelectorAll(selector).forEach(el => {
      const htmlEl = el as HTMLElement;
      htmlEl.style.cssText += `
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        height: auto !important;
        max-height: none !important;
      `;
    });
  }

  /**
   * Создает snapshot DOM для безопасного парсинга
   */
  createSnapshot(): Document {
    // Клонируем весь document
    const clone = document.cloneNode(true) as Document;
    
    // Удаляем все script и event listeners
    clone.querySelectorAll('script, noscript').forEach(el => el.remove());
    
    // Удаляем все onclick атрибуты
    clone.querySelectorAll('[onclick], [onmouseover], [onmouseenter]').forEach(el => {
      el.removeAttribute('onclick');
      el.removeAttribute('onmouseover');
      el.removeAttribute('onmouseenter');
      el.removeAttribute('onmouseleave');
    });
    
    return clone;
  }

  /**
   * Восстанавливает оригинальное состояние
   */
  restore(): void {
    // Удаляем добавленные стили
    const style = this.originalState.get('interactions-style');
    if (style) {
      style.remove();
    }
    
    this.originalState.clear();
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const domProtectionService = new DOMProtectionService();
