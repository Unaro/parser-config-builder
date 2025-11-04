/**
 * Element Selector - интерактивное выделение элементов на странице
 */

import type { GeneratedSelector } from '@/types';
import { generateSelectors, validateSelector } from '@/utils/selector';

interface SelectionOptions {
  fieldName: string;
  fieldType: string;
  onElementSelected: (element: Element, selector: GeneratedSelector) => void;
  onSelectionCancelled: () => void;
}

export class ElementSelector {
  private isActive = false;
  private currentOptions: SelectionOptions | null = null;
  private hoveredElement: Element | null = null;
  private highlightedElements: Element[] = [];

  constructor() {
    this.setupEventListeners();
    console.log('ElementSelector: Initialized');
  }

  /**
   * Начать выделение элемента
   */
  public startSelection(options: SelectionOptions): void {
    if (this.isActive) {
      this.stopSelection();
    }

    this.isActive = true;
    this.currentOptions = options;
    
    // Добавляем визуальные индикаторы
    document.body.classList.add('pcb-selecting');
    
    console.log(`ElementSelector: Started selection for field "${options.fieldName}"`);
    
    // Показываем подсказку
    this.showHint('Наведите на элемент и кликните для выбора. ESC - отмена.');
  }

  /**
   * Остановить выделение
   */
  public stopSelection(): void {
    if (!this.isActive) return;

    this.isActive = false;
    this.currentOptions = null;
    this.hoveredElement = null;
    
    // Убираем визуальные индикаторы
    document.body.classList.remove('pcb-selecting');
    this.clearAllHighlights();
    this.hideHint();
    
    console.log('ElementSelector: Selection stopped');
  }

  /**
   * Подсветить элемент по селектору
   */
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

  /**
   * Убрать все подсветки
   */
  public clearAllHighlights(): void {
    // Убираем классы подсветки
    this.highlightedElements.forEach(element => {
      element.classList.remove('pcb-highlight', 'pcb-highlight-hover', 'pcb-highlight-selected');
    });
    
    // Очищаем массив
    this.highlightedElements = [];
    
    // На всякий случай убираем подсветку со всех элементов
    document.querySelectorAll('.pcb-highlight, .pcb-highlight-hover, .pcb-highlight-selected')
      .forEach(element => {
        element.classList.remove('pcb-highlight', 'pcb-highlight-hover', 'pcb-highlight-selected');
      });
  }

  /**
   * Настройка обработчиков событий
   */
  private setupEventListeners(): void {
    // Наведение мыши
    document.addEventListener('mouseover', (event) => {
      if (this.isActive) {
        this.handleMouseOver(event);
      }
    }, true);

    // Уход мыши
    document.addEventListener('mouseout', (event) => {
      if (this.isActive) {
        this.handleMouseOut(event);
      }
    }, true);

    // Клик
    document.addEventListener('click', (event) => {
      if (this.isActive) {
        this.handleClick(event);
      }
    }, true);

    // Клавиши
    document.addEventListener('keydown', (event) => {
      if (this.isActive) {
        this.handleKeyDown(event);
      }
    }, true);
  }

  /**
   * Обработка наведения мыши
   */
  private handleMouseOver(event: MouseEvent): void {
    const target = event.target as Element;
    if (!target || target === this.hoveredElement) return;

    // Убираем предыдущую подсветку hover
    if (this.hoveredElement) {
      this.hoveredElement.classList.remove('pcb-highlight-hover');
    }

    // Игнорируем элементы UI расширения
    if (target.closest('.pcb-sidebar') || target.classList.contains('pcb-ui')) {
      return;
    }

    this.hoveredElement = target;
    target.classList.add('pcb-highlight-hover');
  }

  /**
   * Обработка ухода мыши
   */
  private handleMouseOut(event: MouseEvent): void {
    const target = event.target as Element;
    if (!target) return;

    target.classList.remove('pcb-highlight-hover');
  }

  /**
   * Обработка клика
   */
  private handleClick(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const target = event.target as Element;
    if (!target) return;

    // Игнорируем элементы UI расширения
    if (target.closest('.pcb-sidebar') || target.classList.contains('pcb-ui')) {
      return;
    }

    this.selectElement(target);
  }

  /**
   * Обработка клавиш
   */
  private handleKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        this.cancelSelection();
        break;

      case 'Enter':
        event.preventDefault();
        if (this.hoveredElement) {
          this.selectElement(this.hoveredElement);
        }
        break;
    }
  }

  /**
   * Выбрать элемент
   */
  private selectElement(element: Element): void {
    // Генерируем селекторы
    const selectors = generateSelectors(element);
    const bestSelector = selectors[0];

    if (!bestSelector) {
      console.error('ElementSelector: Failed to generate selector for element', element);
      this.showError('Не удалось создать селектор для элемента');
      return;
    }

    // Подсвечиваем как выбранный
    this.clearAllHighlights();
    element.classList.add('pcb-highlight-selected');
    this.highlightedElements.push(element);

    console.log('ElementSelector: Element selected', {
      element,
      selector: bestSelector,
      fieldName: this.currentOptions?.fieldName
    });

    // Уведомляем parent
    if (this.currentOptions) {
      this.currentOptions.onElementSelected(element, bestSelector);
    }

    // Останавливаем выделение
    this.stopSelection();
  }

  /**
   * Отменить выделение
   */
  private cancelSelection(): void {
    console.log('ElementSelector: Selection cancelled');
    
    if (this.currentOptions) {
      this.currentOptions.onSelectionCancelled();
    }
    
    this.stopSelection();
  }

  /**
   * Показать подсказку
   */
  private showHint(text: string): void {
    const existing = document.getElementById('pcb-hint');
    if (existing) existing.remove();

    const hint = document.createElement('div');
    hint.id = 'pcb-hint';
    hint.className = 'pcb-hint';
    hint.textContent = text;
    hint.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 14px;
      z-index: 999999;
      pointer-events: none;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    `;

    document.body.appendChild(hint);
  }

  /**
   * Скрыть подсказку
   */
  private hideHint(): void {
    const hint = document.getElementById('pcb-hint');
    if (hint) hint.remove();
  }

  /**
   * Показать ошибку
   */
  private showError(text: string): void {
    const error = document.createElement('div');
    error.className = 'pcb-error';
    error.textContent = text;
    error.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ff4d4f;
      color: white;
      padding: 12px 16px;
      border-radius: 6px;
      font-size: 14px;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    `;

    document.body.appendChild(error);

    // Удаляем через 3 секунды
    setTimeout(() => {
      if (error.parentNode) {
        error.remove();
      }
    }, 3000);
  }
}
