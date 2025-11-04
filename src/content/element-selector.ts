/**
 * Element Selector - add globalCleanup and CLEAR_HIGHLIGHTS handler
 */

import type { GeneratedSelector } from '@/types';
import { generateSelectors, validateSelector } from '@/utils/selector';

// ...existing code

export class ElementSelector {
  // ...existing fields

  public globalCleanup(): void {
    this.clearAllHighlights();
    this.selectorCache.clear();
  }

  public clearAllHighlights(): void {
    this.highlightedElements.forEach(element => {
      element.classList.remove('pcb-highlight', 'pcb-highlight-hover', 'pcb-highlight-selected');
    });
    this.highlightedElements = [];
    document.querySelectorAll('.pcb-highlight, .pcb-highlight-hover, .pcb-highlight-selected')
      .forEach(element => element.classList.remove('pcb-highlight', 'pcb-highlight-hover', 'pcb-highlight-selected'));
  }
}
