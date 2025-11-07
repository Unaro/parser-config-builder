/**
 * Visual Preview v3 - Multi-layer с цветовой палитрой
 * @module utils/visual-preview
 */

interface PreviewLayer {
  fieldId: string;
  overlays: HTMLElement[];
  color: string;
  zIndex: number;
}

let previewLayers: Map<string, PreviewLayer> = new Map();

// Цветовая палитра для разных полей
const COLOR_PALETTE = [
  '#10b981', // green
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#ef4444', // red
  '#14b8a6', // teal
  '#f97316', // orange
  '#6366f1', // indigo
] as const;

/**
 * Получает цвет для поля по его индексу
 */
function getColorForField(fieldIndex: number): string {
  const color = COLOR_PALETTE[fieldIndex % COLOR_PALETTE.length];
  return color || '#10b981'; // fallback
}

/**
 * Подсвечивает элементы для конкретного поля
 */
export function highlightField(fieldId: string, selector: string, fieldIndex: number): number {
  // Удаляем предыдущую подсветку этого поля если была
  clearFieldPreview(fieldId);
  
  try {
    const elements = document.querySelectorAll(selector);
    const color = getColorForField(fieldIndex);
    const zIndex = 2147483600 + fieldIndex; // z-index растет с индексом
    
    const overlays: HTMLElement[] = [];
    
    elements.forEach((element, index) => {
      const rect = element.getBoundingClientRect();
      
      // Используем absolute positioning
      const overlay = document.createElement('div');
      overlay.className = 'parser-preview-highlight';
      overlay.dataset.fieldId = fieldId;
      overlay.style.cssText = `
        position: absolute;
        top: ${rect.top + window.scrollY}px;
        left: ${rect.left + window.scrollX}px;
        width: ${rect.width}px;
        height: ${rect.height}px;
        border: 3px solid ${color};
        background: ${color}15;
        pointer-events: none;
        z-index: ${zIndex};
        border-radius: 4px;
        box-shadow: 0 0 0 3px ${color}30;
        transition: opacity 0.2s;
      `;
      
      // Добавляем label с номером
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
        white-space: nowrap;
      `;
      label.textContent = `#${index + 1}`;
      overlay.appendChild(label);
      
      document.body.appendChild(overlay);
      overlays.push(overlay);
    });
    
    // Сохраняем layer
    previewLayers.set(fieldId, {
      fieldId,
      overlays,
      color,
      zIndex
    });
    
    // Скроллим к первому элементу при первой подсветке
    if (previewLayers.size === 1 && elements.length > 0) {
      const firstElement = elements[0];
      if (firstElement) {
        firstElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
    
    return elements.length;
  } catch (error) {
    console.error('Highlight error:', error);
    return 0;
  }
}

/**
 * Очищает подсветку конкретного поля
 */
export function clearFieldPreview(fieldId: string): void {
  const layer = previewLayers.get(fieldId);
  if (layer) {
    layer.overlays.forEach(overlay => overlay.remove());
    previewLayers.delete(fieldId);
  }
}

/**
 * Очищает все визуальные предпросмотры
 */
export function clearAllPreviews(): void {
  previewLayers.forEach(layer => {
    layer.overlays.forEach(overlay => overlay.remove());
  });
  previewLayers.clear();
}

/**
 * Проверяет подсвечено ли поле
 */
export function isFieldHighlighted(fieldId: string): boolean {
  return previewLayers.has(fieldId);
}

/**
 * Получает количество активных preview слоев
 */
export function getActivePreviewCount(): number {
  return previewLayers.size;
}

/**
 * Получает цвет для поля (для отображения в UI)
 */
export function getFieldColor(fieldIndex: number): string {
  return getColorForField(fieldIndex);
}
