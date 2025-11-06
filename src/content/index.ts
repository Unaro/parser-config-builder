/**
 * Content Script - главная точка входа
 * @module content
 * @version 1.0.0
 */

import { eventBus } from '@lib/events/event-bus';
import { parserService } from '@lib/parser/parser.service';
import { ParserEventFactory } from '@lib/events/parser.events';
import { browser } from '@lib/utils/browser-api';
import { initTriggerButton } from './trigger-button';
import { mountSidebar } from './Sidebar';
import type { ElementPickRequestEvent } from '@lib/events/parser.events';
import type { ParserConfig, ParsedData } from '@lib/types/parser.types';
import './styles.css';

console.log('[Content] Parser Config Builder content script loaded');

/**
 * Инициализация при загрузке страницы
 */
function init(): void {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initTriggerButton();
    });
  } else {
    initTriggerButton();
  }
}

init();

/**
 * Состояние element picker
 */
let isPickerActive = false;
let currentSelectorType: string | null = null;
let overlay: HTMLDivElement | null = null;
let hoveredElement: HTMLElement | null = null;

/**
 * Обработка сообщений
 */
browser.runtime.onMessage.addListener((message: unknown) => {
  if (isParsePageMessage(message)) {
    return handleParsePage(message.config);
  }
  
  if (isOpenSidebarMessage(message)) {
    mountSidebar();
    return Promise.resolve({ success: true });
  }
  
  return undefined;
});

function isParsePageMessage(message: unknown): message is { type: 'PARSE_PAGE'; config: ParserConfig } {
  return (
    typeof message === 'object' &&
    message !== null &&
    'type' in message &&
    (message as { type: unknown }).type === 'PARSE_PAGE'
  );
}

function isOpenSidebarMessage(message: unknown): message is { type: 'OPEN_SIDEBAR' } {
  return (
    typeof message === 'object' &&
    message !== null &&
    'type' in message &&
    (message as { type: unknown }).type === 'OPEN_SIDEBAR'
  );
}

async function handleParsePage(config: ParserConfig): Promise<ParsedData> {
  try {
    const data = await parserService.parse(config, document);
    console.log('[Content] Parsed data:', data);
    return data;
  } catch (error) {
    console.error('[Content] Parse error:', error);
    throw error;
  }
}

eventBus.subscribe<ElementPickRequestEvent['data']>(
  'element.pick.request',
  (event) => {
    console.log('[Content] Element pick requested:', event.data.selectorType);
    activatePicker(event.data.selectorType);
  }
);

function activatePicker(selectorType: string): void {
  if (isPickerActive) {
    deactivatePicker();
  }

  isPickerActive = true;
  currentSelectorType = selectorType;
  
  createOverlay();
  
  document.addEventListener('mouseover', handleMouseOver, true);
  document.addEventListener('mouseout', handleMouseOut, true);
  document.addEventListener('click', handleClick, true);
  document.addEventListener('keydown', handleKeyDown, true);
  
  document.body.style.cursor = 'crosshair';
}

function deactivatePicker(): void {
  isPickerActive = false;
  currentSelectorType = null;
  hoveredElement = null;
  
  if (overlay) {
    overlay.remove();
    overlay = null;
  }
  
  document.removeEventListener('mouseover', handleMouseOver, true);
  document.removeEventListener('mouseout', handleMouseOut, true);
  document.removeEventListener('click', handleClick, true);
  document.removeEventListener('keydown', handleKeyDown, true);
  
  document.body.style.cursor = '';
}

function createOverlay(): void {
  overlay = document.createElement('div');
  overlay.id = 'parser-config-builder-overlay';
  overlay.className = 'parser-config-builder-overlay';
  document.body.appendChild(overlay);
}

function updateOverlay(element: HTMLElement): void {
  if (!overlay) return;
  
  const rect = element.getBoundingClientRect();
  overlay.style.top = `${rect.top + window.scrollY}px`;
  overlay.style.left = `${rect.left + window.scrollX}px`;
  overlay.style.width = `${rect.width}px`;
  overlay.style.height = `${rect.height}px`;
}

function handleMouseOver(event: MouseEvent): void {
  if (!isPickerActive) return;
  
  const target = event.target as HTMLElement;
  if (!target || target === overlay || target.closest('#parser-config-builder-sidebar-root')) return;
  
  hoveredElement = target;
  updateOverlay(target);
}

function handleMouseOut(): void {
  if (!isPickerActive || !overlay) return;
  hoveredElement = null;
}

function handleClick(event: MouseEvent): void {
  if (!isPickerActive || !hoveredElement || !currentSelectorType) return;
  
  const target = event.target as HTMLElement;
  if (target.closest('#parser-config-builder-sidebar-root')) {
    return;
  }
  
  event.preventDefault();
  event.stopPropagation();
  
  const selector = parserService.generateSelector(hoveredElement);
  const previewText = hoveredElement.textContent?.trim().substring(0, 100) ?? '';
  
  const pickedEvent = ParserEventFactory.createElementPicked(
    currentSelectorType as any,
    selector,
    previewText
  );
  
  void eventBus.publish(pickedEvent);
  deactivatePicker();
}

function handleKeyDown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && isPickerActive) {
    event.preventDefault();
    event.stopPropagation();
    deactivatePicker();
  }
}

export { activatePicker, deactivatePicker };
