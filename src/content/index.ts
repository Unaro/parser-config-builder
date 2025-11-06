/**
 * Content Script для визуального выбора элементов на странице
 * Инъектируется на все страницы
 * @module content
 * @version 1.0.0
 */

import { eventBus } from '@lib/events/event-bus';
import { parserService } from '@lib/parser/parser.service';
import { ParserEventFactory } from '@lib/events/parser.events';
import type { ElementPickRequestEvent } from '@lib/events/parser.events';

console.log('[Content] Parser Config Builder content script loaded');

/**
 * Состояние element picker
 */
let isPickerActive = false;
let currentSelectorType: string | null = null;
let overlay: HTMLDivElement | null = null;
let hoveredElement: HTMLElement | null = null;

/**
 * Подписка на запрос выбора элемента
 */
eventBus.subscribe<ElementPickRequestEvent['data']>(
  'element.pick.request',
  (event) => {
    console.log('[Content] Element pick requested:', event.data.selectorType);
    activatePicker(event.data.selectorType);
  }
);

/**
 * Активировать режим выбора элемента
 */
function activatePicker(selectorType: string): void {
  if (isPickerActive) {
    deactivatePicker();
  }

  isPickerActive = true;
  currentSelectorType = selectorType;
  
  // Создать оверлей
  createOverlay();
  
  // Добавить обработчики событий
  document.addEventListener('mouseover', handleMouseOver);
  document.addEventListener('mouseout', handleMouseOut);
  document.addEventListener('click', handleClick, true);
  document.addEventListener('keydown', handleKeyDown);
  
  // Изменить курсор
  document.body.style.cursor = 'crosshair';
}

/**
 * Деактивировать режим выбора элемента
 */
function deactivatePicker(): void {
  isPickerActive = false;
  currentSelectorType = null;
  hoveredElement = null;
  
  // Удалить оверлей
  if (overlay) {
    overlay.remove();
    overlay = null;
  }
  
  // Удалить обработчики
  document.removeEventListener('mouseover', handleMouseOver);
  document.removeEventListener('mouseout', handleMouseOut);
  document.removeEventListener('click', handleClick, true);
  document.removeEventListener('keydown', handleKeyDown);
  
  // Восстановить курсор
  document.body.style.cursor = '';
}

/**
 * Создать оверлей для подсветки элемента
 */
function createOverlay(): void {
  overlay = document.createElement('div');
  overlay.id = 'parser-config-builder-overlay';
  overlay.style.cssText = `
    position: absolute;
    background: rgba(59, 130, 246, 0.3);
    border: 2px solid rgb(59, 130, 246);
    pointer-events: none;
    z-index: 999999;
    transition: all 0.1s ease;
  `;
  document.body.appendChild(overlay);
}

/**
 * Обновить позицию оверлея
 */
function updateOverlay(element: HTMLElement): void {
  if (!overlay) return;
  
  const rect = element.getBoundingClientRect();
  overlay.style.top = `${rect.top + window.scrollY}px`;
  overlay.style.left = `${rect.left + window.scrollX}px`;
  overlay.style.width = `${rect.width}px`;
  overlay.style.height = `${rect.height}px`;
}

/**
 * Обработчик наведения мыши
 */
function handleMouseOver(event: MouseEvent): void {
  if (!isPickerActive) return;
  
  const target = event.target as HTMLElement;
  if (!target || target === overlay) return;
  
  hoveredElement = target;
  updateOverlay(target);
}

/**
 * Обработчик ухода мыши
 */
function handleMouseOut(): void {
  if (!isPickerActive || !overlay) return;
  hoveredElement = null;
}

/**
 * Обработчик клика - выбор элемента
 */
function handleClick(event: MouseEvent): void {
  if (!isPickerActive || !hoveredElement || !currentSelectorType) return;
  
  event.preventDefault();
  event.stopPropagation();
  
  // Сгенерировать селектор
  const selector = parserService.generateSelector(hoveredElement);
  const previewText = hoveredElement.textContent?.trim().substring(0, 100) ?? '';
  
  // Отправить событие выбранного элемента
  const pickedEvent = ParserEventFactory.createElementPicked(
    currentSelectorType as any,
    selector,
    previewText
  );
  
  void eventBus.publish(pickedEvent);
  
  // Деактивировать picker
  deactivatePicker();
}

/**
 * Обработчик нажатия клавиш - ESC для отмены
 */
function handleKeyDown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && isPickerActive) {
    deactivatePicker();
  }
}

/**
 * Экспорт для тестов
 */
export { activatePicker, deactivatePicker };
