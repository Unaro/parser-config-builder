/**
 * Content Script - основной компонент для взаимодействия с DOM
 */

import './content-styles.css';

import type {
  ExtensionMessage,
  MessageResponse,
  ActivateExtensionMessage,
  StartSelectionMessage,
  TestConfigMessage,
  HighlightElementMessage,
  SaveConfigMessage,
  ElementSelectedMessage,
  ParserConfig
} from '@/types';
import { ElementSelector } from './element-selector';
import { ConfigSidebar } from './config-sidebar';
import { generateUniqueId } from '@/utils';

class ParserConfigContentScript {
  private elementSelector: ElementSelector;
  private configSidebar: ConfigSidebar;
  private isActive = false;
  private currentConfig: ParserConfig | null = null;

  constructor() {
    this.elementSelector = new ElementSelector();
    this.configSidebar = new ConfigSidebar();
    
    // Дожидаемся готовности DOM перед инжекцией стилей
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initialize());
    } else {
      this.initialize();
    }
  }

  private initialize(): void {
    this.setupMessageListeners();
    this.setupElementSelector();
    this.injectStylesSafely();
    console.log('Parser Config Builder: Content Script loaded');
  }

  /**
   * Безопасная инжекция стилей (учёт отсутствия head)
   */
  private injectStylesSafely(): void {
    // Если head отсутствует (редко, но возможно), используем documentElement или body
    const head = document.head || document.getElementsByTagName('head')[0] || document.documentElement || document.body;
    if (!head) return;

    if (document.getElementById('pcb-styles')) return;
    
    const styles = `
      /* Подсветка элементов */
      .pcb-highlight { outline: 3px solid #1890ff !important; background-color: rgba(24, 144, 255, 0.1) !important; position: relative !important; z-index: 999999 !important; }
      .pcb-highlight-hover { outline: 2px solid #722ed1 !important; background-color: rgba(114, 46, 209, 0.05) !important; }
      .pcb-highlight-selected { outline: 3px solid #52c41a !important; background-color: rgba(82, 196, 26, 0.1) !important; }
      body.pcb-active { cursor: crosshair !important; }
      body.pcb-active * { cursor: crosshair !important; }
      .pcb-sidebar, .pcb-sidebar * { cursor: default !important; }
    `;
    
    const styleEl = document.createElement('style');
    styleEl.id = 'pcb-styles';
    styleEl.textContent = styles;
    head.appendChild(styleEl);
  }

  // ... остальной код без изменений ...
}

// Инициализация content script с type-safe проверкой
if (typeof window !== 'undefined' && !(window as any).parserConfigContentScript) {
  (window as any).parserConfigContentScript = new ParserConfigContentScript();
}

export default ParserConfigContentScript;
