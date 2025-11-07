/**
 * Visual Preview v2 - Absolute positioning без багов скролла
 * @module utils/visual-preview
 */

let previewOverlays: HTMLElement[] = [];

/**
 * Подсвечивает элементы по селектору на странице
 */
export function highlightElements(selector: string, color = '#10b981'): number {
  clearPreview();
  
  try {
    const elements = document.querySelectorAll(selector);
    
    elements.forEach((element, index) => {
      const rect = element.getBoundingClientRect();
      
      // Используем absolute positioning относительно document
      const overlay = document.createElement('div');
      overlay.className = 'parser-preview-highlight';
      overlay.style.cssText = `
        position: absolute;
        top: ${rect.top + window.scrollY}px;
        left: ${rect.left + window.scrollX}px;
        width: ${rect.width}px;
        height: ${rect.height}px;
        border: 3px solid ${color};
        background: ${color}15;
        pointer-events: none;
        z-index: 2147483644;
        border-radius: 4px;
        box-shadow: 0 0 0 3px ${color}30;
        transition: opacity 0.2s;
      `;
      
      // Добавляем номер элемента
      const label = document.createElement('div');
      label.style.cssText = `
        position: absolute;
        top: -26px;
        left: -2px;
        background: ${color};
        color: white;
        padding: 3px 10px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 700;
        font-family: system-ui, sans-serif;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      `;
      label.textContent = `#${index + 1}`;
      overlay.appendChild(label);
      
      document.body.appendChild(overlay);
      previewOverlays.push(overlay);
    });
    
    // Скроллим к первому элементу
    const firstElement = elements[0];
    if (firstElement) {
      firstElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    return elements.length;
  } catch (error) {
    console.error('Highlight error:', error);
    return 0;
  }
}

/**
 * Очищает все визуальные предпросмотры
 */
export function clearPreview(): void {
  previewOverlays.forEach(overlay => overlay.remove());
  previewOverlays = [];
}
