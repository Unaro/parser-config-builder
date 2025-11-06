/**
 * Element Selector - полная версия с on-demand генерацией и globalCleanup
 */

import type { GeneratedSelector } from '@/types';
import { generateSelectors, validateSelector } from '@/utils/selector';

interface SelectionOptions {
  fieldName: string;
  fieldType: string;
  onElementSelected: (element: Element, selector: GeneratedSelector) => void;
  onSelectionCancelled: () => void;
}

interface ElementSelectorCache {
  element: Element;
  selector: GeneratedSelector;
  timestamp: number;
}

export class ElementSelector {
  private isActive = false;
  private currentOptions: SelectionOptions | null = null;
  private hoveredElement: Element | null = null;
  private highlightedElements: Element[] = [];
  private selectorCache = new Map<Element, ElementSelectorCache>();

  constructor() {
    this.setupEventListeners();
    console.log('ElementSelector: Initialized');
  }

  public startSelection(options: SelectionOptions): void {
    if (this.isActive) this.stopSelection();
    this.isActive = true;
    this.currentOptions = options;
    this.selectorCache.clear();
    document.body.classList.add('pcb-selecting');
    console.log(`ElementSelector: Started selection for field "${options.fieldName}"`);
    this.showHint('Наведите на элемент и кликните для выбора. ESC - отмена.');
  }

  public stopSelection(): void {
    if (!this.isActive) return;
    this.isActive = false;
    this.currentOptions = null;
    this.hoveredElement = null;
    document.body.classList.remove('pcb-selecting');
    this.clearAllHighlights();
    this.hideHint();
    console.log('ElementSelector: Selection stopped');
  }

  public highlightBySelector(selector: string): void {
    this.clearAllHighlights();
    if (!validateSelector(selector)) {
      console.warn('Invalid selector:', selector);
      return;
    }
    try {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        element.classList.add('pcb-highlight-selected');
        this.highlightedElements.push(element);
      });
      console.log(`ElementSelector: Highlighted ${elements.length} elements for selector: ${selector}`);
    } catch (error) {
      console.error('Failed to highlight by selector:', selector, error);
    }
  }

  public clearAllHighlights(): void {
    this.highlightedElements.forEach(element => {
      element.classList.remove('pcb-highlight', 'pcb-highlight-hover', 'pcb-highlight-selected');
    });
    this.highlightedElements = [];
    document.querySelectorAll('.pcb-highlight, .pcb-highlight-hover, .pcb-highlight-selected')
      .forEach(element => {
        element.classList.remove('pcb-highlight', 'pcb-highlight-hover', 'pcb-highlight-selected');
      });
  }

  public globalCleanup(): void {
    this.clearAllHighlights();
    this.selectorCache.clear();
    this.hoveredElement = null;
  }

  private setupEventListeners(): void {
    document.addEventListener('mouseover', (event) => {
      if (this.isActive) this.handleMouseOver(event);
    }, true);
    document.addEventListener('mouseout', (event) => {
      if (this.isActive) this.handleMouseOut(event);
    }, true);
    document.addEventListener('click', (event) => {
      if (this.isActive) this.handleClick(event);
    }, true);
    document.addEventListener('keydown', (event) => {
      if (this.isActive) this.handleKeyDown(event);
    }, true);
  }

  private handleMouseOver(event: MouseEvent): void {
    const target = event.target as Element;
    if (!target || target === this.hoveredElement) return;
    if (this.hoveredElement) this.hoveredElement.classList.remove('pcb-highlight-hover');
    if (target.closest('.pcb-sidebar') || target.classList.contains('pcb-ui')) return;
    this.preGenerateSelector(target);
    this.hoveredElement = target;
    target.classList.add('pcb-highlight-hover');
    this.cleanupSelectorCache();
  }

  private handleMouseOut(event: MouseEvent): void {
    const target = event.target as Element;
    if (!target) return;
    target.classList.remove('pcb-highlight-hover');
  }

  private handleClick(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const target = event.target as Element;
    if (!target) return;
    if (target.closest('.pcb-sidebar') || target.classList.contains('pcb-ui')) return;
    this.selectElement(target);
  }

  private handleKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        this.cancelSelection();
        break;
      case 'Enter':
        event.preventDefault();
        if (this.hoveredElement) this.selectElement(this.hoveredElement);
        break;
    }
  }

  private preGenerateSelector(element: Element): void {
    if (this.selectorCache.has(element)) return;
    try {
      const selectors = generateSelectors(element);
      const best = selectors[0];
      if (best) {
        this.selectorCache.set(element, { element, selector: best, timestamp: Date.now() });
        console.log('ElementSelector: Pre-generated selector:', {
          element: element.tagName,
          selector: best.selector,
          confidence: best.confidence
        });
      }
    } catch (error) {
      console.error('ElementSelector: Failed to pre-generate selector:', error);
    }
  }

  private selectElement(element: Element): void {
    let cached = this.selectorCache.get(element);
    // On-demand генерация, если кэша нет
    if (!cached) {
      try {
        const selectors = generateSelectors(element);
        const best = selectors[0];
        if (best) {
          cached = { element, selector: best, timestamp: Date.now() };
          this.selectorCache.set(element, cached);
          console.log('ElementSelector: On-demand generation:', {
            element: element.tagName,
            selector: best.selector
          });
        }
      } catch (error) {
        console.error('ElementSelector: On-demand generation failed:', error);
      }
    }

    if (!cached) {
      this.showError('Селектор не был предварительно сгенерирован');
      return;
    }

    const { selector } = cached;
    this.clearAllHighlights();
    element.classList.add('pcb-highlight-selected');
    this.highlightedElements.push(element);

    console.log('ElementSelector: Element selected with cached selector', {
      element: element.tagName,
      selector: selector.selector,
      confidence: selector.confidence,
      fieldName: this.currentOptions?.fieldName
    });

    if (this.currentOptions) {
      this.currentOptions.onElementSelected(element, selector);
    }
    this.stopSelection();
  }

  private cancelSelection(): void {
    console.log('ElementSelector: Selection cancelled');
    if (this.currentOptions) this.currentOptions.onSelectionCancelled();
    this.stopSelection();
  }

  private showHint(text: string): void {
    const existing = document.getElementById('pcb-hint');
    if (existing) existing.remove();
    const hint = document.createElement('div');
    hint.id = 'pcb-hint';
    hint.className = 'pcb-hint';
    hint.textContent = text;
    hint.style.cssText = `
      position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.8); color: white; padding: 8px 16px; border-radius: 6px;
      font-size: 14px; z-index: 999999; pointer-events: none;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    `;
    document.body.appendChild(hint);
  }

  private hideHint(): void {
    const hint = document.getElementById('pcb-hint');
    if (hint) hint.remove();
  }

  private showError(text: string): void {
    const error = document.createElement('div');
    error.className = 'pcb-error';
    error.textContent = text;
    error.style.cssText = `
      position: fixed; top: 20px; right: 20px; background: #ff4d4f; color: white;
      padding: 12px 16px; border-radius: 6px; font-size: 14px; z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    `;
    document.body.appendChild(error);
    setTimeout(() => { if (error.parentNode) error.remove(); }, 3000);
  }

  private cleanupSelectorCache(): void {
    const now = Date.now();
    const maxAge = 30000;
    this.selectorCache.forEach((cache, element) => {
      if (now - cache.timestamp > maxAge) this.selectorCache.delete(element);
    });
  }
}
