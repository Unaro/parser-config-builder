/**
 * Element Selector - компонент для выбора элементов на странице
 */

import type { GeneratedSelector } from '@/types';
import { getBestSelector } from '@/utils/selector';
import { 
  highlightElement, 
  unhighlightElement, 
  clearAllHighlights,
  isElementVisible 
} from '@/utils/dom';

interface SelectionOptions {
  fieldName: string;
  fieldType: string;
  onElementSelected: (element: Element, selector: GeneratedSelector) => void;
  onSelectionCancelled: () => void;
}

export class ElementSelector {
  private isSelecting = false;
  private currentOptions: SelectionOptions | null = null;
  private hoveredElement: Element | null = null;
  private selectedElement: Element | null = null;
  private abortController: AbortController | null = null;

  constructor() {
    this.setupKeyboardShortcuts();
  }

  /**
   * Начать выделение элемента
   */
  startSelection(options: SelectionOptions): void {
    if (this.isSelecting) {
      this.stopSelection();
    }

    this.isSelecting = true;
    this.currentOptions = options;
    this.abortController = new AbortController();
    
    // Очищаем предыдущие подсветки
    clearAllHighlights();
    
    // Добавляем обработчики событий
    this.addEventListeners();
    
    // Показываем индикатор режима выделения
    this.showSelectionIndicator();
    
    console.log(`Started element selection for field: ${options.fieldName}`);
  }

  /**
   * Остановить выделение элемента
   */
  stopSelection(): void {
    if (!this.isSelecting) return;

    this.isSelecting = false;
    
    // Удаляем обработчики событий
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    
    // Очищаем состояние
    this.clearHoverState();
    this.clearSelectedState();
    
    // Скрываем индикатор
    this.hideSelectionIndicator();
    
    this.currentOptions = null;
    
    console.log('Stopped element selection');
  }

  /**
   * Подсветить элемент по селектору
   */
  highlightBySelector(selector: string): void {
    try {
      clearAllHighlights();
      
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        if (isElementVisible(element)) {
          highlightElement(element, 'pcb-highlight-selected');
        }
      });
      
      if (elements.length === 0) {
        console.warn(`No elements found for selector: ${selector}`);
      }
    } catch (error) {
      console.error(`Invalid selector: ${selector}`, error);
    }
  }

  /**
   * Очистить все подсветки
   */
  clearAllHighlights(): void {
    clearAllHighlights('pcb-highlight');
    clearAllHighlights('pcb-highlight-hover');
    clearAllHighlights('pcb-highlight-selected');
  }

  /**
   * Добавить обработчики событий
   */
  private addEventListeners(): void {
    if (!this.abortController) return;
    
    const { signal } = this.abortController;

    // Отслеживание наведения мыши
    document.addEventListener('mouseover', this.handleMouseOver, { signal, capture: true });
    document.addEventListener('mouseout', this.handleMouseOut, { signal, capture: true });
    
    // Клик для выбора элемента
    document.addEventListener('click', this.handleClick, { signal, capture: true });
    
    // Клавиатурные сочетания
    document.addEventListener('keydown', this.handleKeyDown, { signal, capture: true });
    
    // Предотвращаем контекстное меню
    document.addEventListener('contextmenu', this.handleContextMenu, { signal, capture: true });
  }

  /**
   * Обработчик наведения мыши
   */
  private handleMouseOver = (event: MouseEvent): void => {
    if (!this.isSelecting) return;
    
    event.stopPropagation();
    
    const target = event.target as Element;
    if (!target || target === this.hoveredElement) return;
    
    // Игнорируем элементы UI расширения
    if (this.isExtensionElement(target)) return;
    
    // Очищаем предыдущую подсветку
    this.clearHoverState();
    
    // Подсвечиваем новый элемент
    this.hoveredElement = target;
    highlightElement(target, 'pcb-highlight-hover');
    
    // Показываем информацию об элементе
    this.showElementInfo(target);
  };

  /**
   * Обработчик ухода мыши
   */
  private handleMouseOut = (_event: MouseEvent): void => {
    if (!this.isSelecting) return;
    
    // Не убираем подсветку сразу, только при наведении на новый элемент
  };

  /**
   * Обработчик клика
   */
  private handleClick = (event: MouseEvent): void => {
    if (!this.isSelecting || !this.currentOptions) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    const target = event.target as Element;
    if (!target || this.isExtensionElement(target)) return;
    
    this.selectElement(target);
  };

  /**
   * Выбрать элемент
   */
  private selectElement(target: Element): void {
    if (!this.currentOptions) return;
    
    // Генерируем селектор для выбранного элемента
    const selector = getBestSelector(target);
    if (!selector) {
      console.error('Failed to generate selector for element:', target);
      return;
    }
    
    // Подсвечиваем выбранный элемент
    this.clearHoverState();
    this.selectedElement = target;
    highlightElement(target, 'pcb-highlight-selected');
    
    // Уведомляем о выборе
    this.currentOptions.onElementSelected(target, selector);
    
    // Останавливаем выделение
    this.stopSelection();
  }

  /**
   * Обработчик клавиатуры
   */
  private handleKeyDown = (event: KeyboardEvent): void => {
    if (!this.isSelecting || !this.currentOptions) return;
    
    switch (event.code) {
      case 'Escape':
        event.preventDefault();
        this.currentOptions.onSelectionCancelled();
        this.stopSelection();
        break;
        
      case 'Enter':
        if (this.hoveredElement) {
          event.preventDefault();
          // Прямой вызов логики выбора элемента
          this.selectElement(this.hoveredElement);
        }
        break;
    }
  };

  /**
   * Обработчик контекстного меню
   */
  private handleContextMenu = (event: MouseEvent): void => {
    if (this.isSelecting) {
      event.preventDefault();
    }
  };

  /**
   * Настройка клавиатурных сочетаний
   */
  private setupKeyboardShortcuts(): void {
    // Глобальные сочетания (всегда активны)
    document.addEventListener('keydown', (event) => {
      // Ctrl/Cmd + Shift + E - включить/выключить режим выделения
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.code === 'KeyE') {
        event.preventDefault();
        
        if (this.isSelecting) {
          this.currentOptions?.onSelectionCancelled();
          this.stopSelection();
        } else {
          // Запрос начала выделения через сообщение
          console.log('Selection shortcut triggered');
        }
      }
    });
  }

  /**
   * Показать индикатор режима выделения
   */
  private showSelectionIndicator(): void {
    if (document.getElementById('pcb-selection-indicator')) return;
    
    const indicator = document.createElement('div');
    indicator.id = 'pcb-selection-indicator';
    indicator.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: #1890ff;
        color: white;
        padding: 12px 16px;
        border-radius: 6px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        z-index: 10000000;
        pointer-events: none;
        animation: pcb-fade-in 0.3s ease-out;
      ">
        🎯 Выберите элемент для поля "${this.currentOptions?.fieldName}"
        <div style="font-size: 12px; margin-top: 4px; opacity: 0.9;">
          ESC - отмена | Enter - выбрать наведенный
        </div>
      </div>
    `;
    
    // Добавляем CSS анимацию
    if (!document.getElementById('pcb-animations')) {
      const style = document.createElement('style');
      style.id = 'pcb-animations';
      style.textContent = `
        @keyframes pcb-fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes pcb-fade-out {
          from { opacity: 1; transform: translateY(0); }
          to { opacity: 0; transform: translateY(-10px); }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(indicator);
  }

  /**
   * Скрыть индикатор режима выделения
   */
  private hideSelectionIndicator(): void {
    const indicator = document.getElementById('pcb-selection-indicator');
    if (indicator) {
      indicator.remove();
    }
  }

  /**
   * Показать информацию об элементе
   */
  private showElementInfo(element: Element): void {
    const info = this.getElementInfo(element);
    
    // Обновляем или создаем информационную панель
    let infoPanel = document.getElementById('pcb-element-info');
    
    if (!infoPanel) {
      infoPanel = document.createElement('div');
      infoPanel.id = 'pcb-element-info';
      document.body.appendChild(infoPanel);
    }
    
    infoPanel.innerHTML = `
      <div style="
        position: fixed;
        bottom: 20px;
        left: 20px;
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 12px 16px;
        border-radius: 6px;
        font-family: monospace;
        font-size: 12px;
        max-width: 400px;
        z-index: 10000000;
        pointer-events: none;
      ">
        <div style="margin-bottom: 8px; font-weight: bold;">${info.tagName}</div>
        ${info.classes ? `<div>Classes: ${info.classes}</div>` : ''}
        ${info.id ? `<div>ID: ${info.id}</div>` : ''}
        ${info.text ? `<div>Text: ${info.text}</div>` : ''}
      </div>
    `;
  }

  /**
   * Получить информацию об элементе с правильной типизацией
   */
  private getElementInfo(element: Element): {
    tagName: string;
    classes?: string | undefined;
    id?: string | undefined;
    text?: string | undefined;
  } {
    const className = element.className;
    const elementId = element.id;
    const textContent = element.textContent?.trim();
    
    return {
      tagName: element.tagName.toLowerCase(),
      classes: className ? className.toString().trim() : undefined,
      id: elementId || undefined,
      text: textContent && textContent.length > 0 ? textContent.substring(0, 50) : undefined
    };
  }

  /**
   * Проверить, является ли элемент частью UI расширения
   */
  private isExtensionElement(element: Element): boolean {
    return element.closest('.pcb-sidebar') !== null ||
           element.closest('#pcb-selection-indicator') !== null ||
           element.closest('#pcb-element-info') !== null ||
           element.id?.startsWith('pcb-') === true ||
           element.classList.contains('pcb-ui');
  }

  /**
   * Очистить состояние наведения
   */
  private clearHoverState(): void {
    if (this.hoveredElement) {
      unhighlightElement(this.hoveredElement, 'pcb-highlight-hover');
      this.hoveredElement = null;
    }
    
    const infoPanel = document.getElementById('pcb-element-info');
    if (infoPanel) {
      infoPanel.remove();
    }
  }

  /**
   * Очистить состояние выбора
   */
  private clearSelectedState(): void {
    if (this.selectedElement) {
      unhighlightElement(this.selectedElement, 'pcb-highlight-selected');
      this.selectedElement = null;
    }
  }
}
