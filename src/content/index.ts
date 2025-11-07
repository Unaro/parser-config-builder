/**
 * Content Script v3.2
 * @module content
 */

import { eventBus } from '@lib/events/event-bus';
import { ParserEventFactory } from '@lib/events/parser.events';
import { parserService } from '@lib/parser/parser.service';
import { mountGearButton } from './GearButton';
import type { ElementPickRequestEvent } from '@lib/events/parser.events';

console.log('[Content] Script loaded');

// Монтируем кнопку при загрузке
mountGearButton();

let currentPickingFieldId: string | null = null;
let currentFieldType: string | null = null;
let overlay: HTMLElement | null = null;
let highlightedElement: HTMLElement | null = null;

eventBus.subscribe<ElementPickRequestEvent['data']>('element.pick.request', (event) => {
  console.log('[Content] Pick request:', event.data);
  currentPickingFieldId = event.data.fieldId;
  currentFieldType = event.data.fieldType;
  startElementPicking();
});

function startElementPicking() {
  createOverlay();
  document.addEventListener('mouseover', handleMouseOver);
  document.addEventListener('mouseout', handleMouseOut);
  document.addEventListener('click', handleClick, true);
  document.addEventListener('keydown', handleEscape);
}

function stopElementPicking() {
  removeOverlay();
  removeHighlight();
  document.removeEventListener('mouseover', handleMouseOver);
  document.removeEventListener('mouseout', handleMouseOut);
  document.removeEventListener('click', handleClick, true);
  document.removeEventListener('keydown', handleEscape);
}

function createOverlay() {
  if (overlay) return;
  overlay = document.createElement('div');
  overlay.id = 'parser-element-picker-overlay';
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.1);
    z-index: 2147483646;
    cursor: crosshair;
    pointer-events: none;
  `;
  document.body.appendChild(overlay);
}

function removeOverlay() {
  if (overlay) {
    overlay.remove();
    overlay = null;
  }
}

function createHighlight(element: HTMLElement) {
  removeHighlight();
  
  const rect = element.getBoundingClientRect();
  highlightedElement = document.createElement('div');
  highlightedElement.id = 'parser-element-highlight';
  highlightedElement.style.cssText = `
    position: fixed;
    top: ${rect.top}px;
    left: ${rect.left}px;
    width: ${rect.width}px;
    height: ${rect.height}px;
    border: 2px solid #10b981;
    background: rgba(16, 185, 129, 0.1);
    pointer-events: none;
    z-index: 2147483645;
    transition: all 0.1s;
  `;
  
  const label = document.createElement('div');
  label.style.cssText = `
    position: absolute;
    top: -28px;
    left: 0;
    background: #10b981;
    color: white;
    padding: 4px 12px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;
    font-family: system-ui, sans-serif;
  `;
  label.textContent = element.tagName.toLowerCase() + (element.className ? '.' + Array.from(element.classList).slice(0, 2).join('.') : '');
  highlightedElement.appendChild(label);
  
  document.body.appendChild(highlightedElement);
}

function removeHighlight() {
  if (highlightedElement) {
    highlightedElement.remove();
    highlightedElement = null;
  }
}

function handleMouseOver(e: MouseEvent) {
  const target = e.target as HTMLElement;
  if (!target || target.closest('#parser-config-builder-sidebar-root, #parser-gear-button-root')) return;
  createHighlight(target);
}

function handleMouseOut() {
  removeHighlight();
}

function handleClick(e: MouseEvent) {
  e.preventDefault();
  e.stopPropagation();
  
  const target = e.target as HTMLElement;
  if (!target || target.closest('#parser-config-builder-sidebar-root, #parser-gear-button-root')) return;
  
  if (!currentPickingFieldId) return;

  const isArrayType = currentFieldType === 'array' || currentFieldType === 'custom-object';
  const selector = parserService.generateSelector(target, isArrayType);
  
  const validation = parserService.validateSelector(document, selector, currentFieldType || 'string');
  
  const previewText = validation.previewText || target.textContent?.trim().substring(0, 100) || '';
  const arrayPreview = validation.arrayPreview;
  
  eventBus.publish(
    ParserEventFactory.createElementPicked(
      currentPickingFieldId,
      selector,
      previewText,
      validation.elementCount,
      arrayPreview
    )
  );
  
  stopElementPicking();
  currentPickingFieldId = null;
  currentFieldType = null;
}

function handleEscape(e: KeyboardEvent) {
  if (e.key === 'Escape' && currentPickingFieldId) {
    eventBus.publish(
      ParserEventFactory.createElementPickCancelled(currentPickingFieldId)
    );
    stopElementPicking();
    currentPickingFieldId = null;
    currentFieldType = null;
  }
}
