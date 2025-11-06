/**
 * Content Script
 * @module content
 * @version 2.0.0
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

console.log('[Content] Parser Config Builder loaded');

function init(): void {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initTriggerButton());
  } else {
    initTriggerButton();
  }
}

init();

let isPickerActive = false;
let currentFieldId: string | null = null;
let currentFieldType: string | null = null;
let overlay: HTMLDivElement | null = null;
let hoveredElement: HTMLElement | null = null;

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

function isParsePageMessage(msg: unknown): msg is { type: 'PARSE_PAGE'; config: ParserConfig } {
  return typeof msg === 'object' && msg !== null && 'type' in msg && (msg as any).type === 'PARSE_PAGE';
}

function isOpenSidebarMessage(msg: unknown): msg is { type: 'OPEN_SIDEBAR' } {
  return typeof msg === 'object' && msg !== null && 'type' in msg && (msg as any).type === 'OPEN_SIDEBAR';
}

async function handleParsePage(config: ParserConfig): Promise<ParsedData> {
  try {
    // Определяем тип текущей страницы
    const pageConfig = parserService.detectPageType(config, window.location.href);
    
    if (!pageConfig) {
      throw new Error('No matching page configuration found for this URL');
    }

    // Парсим страницу
    const pageData = await parserService.parsePage(pageConfig, document);
    
    console.log('[Content] Parsed data:', pageData);
    return pageData.data;
  } catch (error) {
    console.error('[Content] Parse error:', error);
    throw error;
  }
}

eventBus.subscribe<ElementPickRequestEvent['data']>(
  'element.pick.request',
  (event) => {
    console.log('[Content] Pick request:', event.data);
    activatePicker(event.data.fieldId, event.data.fieldType);
  }
);

function activatePicker(fieldId: string, fieldType: string): void {
  if (isPickerActive) deactivatePicker();

  isPickerActive = true;
  currentFieldId = fieldId;
  currentFieldType = fieldType;
  
  createOverlay();
  
  document.addEventListener('mouseover', handleMouseOver, true);
  document.addEventListener('mouseout', handleMouseOut, true);
  document.addEventListener('click', handleClick, true);
  document.addEventListener('keydown', handleKeyDown, true);
  
  document.body.style.cursor = 'crosshair';
}

function deactivatePicker(cancelled = false): void {
  if (cancelled && currentFieldId) {
    const event = ParserEventFactory.createElementPickCancelled(currentFieldId);
    void eventBus.publish(event);
  }

  isPickerActive = false;
  currentFieldId = null;
  currentFieldType = null;
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
  if (!isPickerActive || !hoveredElement || !currentFieldId || !currentFieldType) return;
  
  const target = event.target as HTMLElement;
  if (target.closest('#parser-config-builder-sidebar-root')) return;
  
  event.preventDefault();
  event.stopPropagation();
  
  const isArrayType = currentFieldType === 'array';
  const selector = parserService.generateSelector(hoveredElement, isArrayType);
  
  const validation = parserService.validateSelector(document, selector, currentFieldType);
  
  const pickedEvent = ParserEventFactory.createElementPicked(
    currentFieldId,
    selector,
    validation.previewText || hoveredElement.textContent?.trim().substring(0, 100) || '',
    validation.elementCount,
    validation.arrayPreview
  );
  
  void eventBus.publish(pickedEvent);
  deactivatePicker(false);
}

function handleKeyDown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && isPickerActive) {
    event.preventDefault();
    event.stopPropagation();
    deactivatePicker(true);
  }
}

export { activatePicker, deactivatePicker };
