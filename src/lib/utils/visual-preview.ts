/**
 * Visual Preview v4.4 - Multiple Selectors
 * @module utils/visual-preview
 */

const HIGHLIGHT_CLASS = 'parser-field-highlight';
const activeHighlights = new Map<string, Element[]>();

const colors: string[] = [
  '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
];

export function getFieldColor(index: number): string {
  return colors[index % colors.length] || '#667eea';
}

export function highlightField(fieldId: string, selector: string, colorIndex: number): number {
  try {
    const elements = document.querySelectorAll(selector);
    const color = getFieldColor(colorIndex);
    
    if (!document.getElementById('parser-highlight-styles')) {
      const style = document.createElement('style');
      style.id = 'parser-highlight-styles';
      style.textContent = `
        .${HIGHLIGHT_CLASS} {
          outline: 3px solid var(--highlight-color) !important;
          outline-offset: 2px !important;
          background-color: var(--highlight-bg) !important;
          position: relative !important;
          z-index: 999999 !important;
        }
      `;
      document.head.appendChild(style);
    }

    const highlighted: Element[] = [];
    elements.forEach((el) => {
      (el as HTMLElement).style.setProperty('--highlight-color', color);
      (el as HTMLElement).style.setProperty('--highlight-bg', `${color}10`);
      el.classList.add(HIGHLIGHT_CLASS);
      highlighted.push(el);
    });

    activeHighlights.set(fieldId, highlighted);
    return elements.length;
  } catch {
    return 0;
  }
}

export function clearFieldPreview(fieldId: string): void {
  const elements = activeHighlights.get(fieldId);
  if (elements) {
    elements.forEach(el => {
      el.classList.remove(HIGHLIGHT_CLASS);
      (el as HTMLElement).style.removeProperty('--highlight-color');
      (el as HTMLElement).style.removeProperty('--highlight-bg');
    });
    activeHighlights.delete(fieldId);
  }
}

export function clearAllPreviews(): void {
  activeHighlights.forEach((elements) => {
    elements.forEach(el => {
      el.classList.remove(HIGHLIGHT_CLASS);
      (el as HTMLElement).style.removeProperty('--highlight-color');
      (el as HTMLElement).style.removeProperty('--highlight-bg');
    });
  });
  activeHighlights.clear();
}
