/**
 * Content Script - основной компонент для взаимодействия с DOM
 */

import type {
  ExtensionMessage,
  MessageResponse,
  PopupMessage,
  SidebarMessage,
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
    
    this.setupMessageListeners();
    this.setupElementSelector();
    this.injectStyles();
    
    console.log('Parser Config Builder: Content Script loaded');
  }

  /**
   * Настройка слушателей сообщений
   */
  private setupMessageListeners(): void {
    chrome.runtime.onMessage.addListener(
      (message: ExtensionMessage, sender, sendResponse) => {
        this.handleMessage(message)
          .then(response => sendResponse(response))
          .catch(error => {
            console.error('Message handling error:', error);
            sendResponse({ success: false, error: error.message });
          });
        
        return true; // Асинхронный ответ
      }
    );
  }

  /**
   * Обработка сообщений
   */
  private async handleMessage(message: ExtensionMessage): Promise<MessageResponse> {
    switch (message.type) {
      case 'ACTIVATE_EXTENSION':
        return this.handleActivate(message);
        
      case 'DEACTIVATE_EXTENSION':
        return this.handleDeactivate();
        
      case 'START_SELECTION':
        return this.handleStartSelection(message);
        
      case 'STOP_SELECTION':
        return this.handleStopSelection();
        
      case 'TEST_CONFIG':
        return this.handleTestConfig(message);
        
      case 'HIGHLIGHT_ELEMENT':
        return this.handleHighlightElement(message);
        
      case 'GET_CONFIG':
        return this.handleGetConfig();
        
      case 'SAVE_CONFIG':
        return this.handleSaveConfig(message);
        
      default:
        return { success: false, error: 'Unknown message type' };
    }
  }

  /**
   * Активация расширения
   */
  private async handleActivate(message: PopupMessage): Promise<MessageResponse> {
    if (this.isActive) {
      return { success: true, data: 'Already active' };
    }

    try {
      this.isActive = true;
      
      // Показываем боковую панель
      this.configSidebar.show();
      
      // Инициализируем конфиг для текущей страницы
      await this.initializeConfig(message.pageType);
      
      // Добавляем CSS классы для активации
      document.body.classList.add('pcb-active');
      
      return { success: true, data: 'Extension activated' };
    } catch (error) {
      this.isActive = false;
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Деактивация расширения
   */
  private async handleDeactivate(): Promise<MessageResponse> {
    if (!this.isActive) {
      return { success: true, data: 'Already inactive' };
    }

    this.isActive = false;
    
    // Останавливаем выделение элементов
    this.elementSelector.stopSelection();
    
    // Скрываем боковую панель
    this.configSidebar.hide();
    
    // Убираем все подсветки
    this.elementSelector.clearAllHighlights();
    
    // Убираем CSS классы
    document.body.classList.remove('pcb-active');
    
    return { success: true, data: 'Extension deactivated' };
  }

  /**
   * Начало выделения элемента
   */
  private async handleStartSelection(message: SidebarMessage): Promise<MessageResponse> {
    if (!this.isActive) {
      return { success: false, error: 'Extension not active' };
    }

    const { fieldName, fieldType } = message;
    
    this.elementSelector.startSelection({
      fieldName,
      fieldType,
      onElementSelected: (element, selector) => {
        this.handleElementSelected(fieldName, element, selector);
      },
      onSelectionCancelled: () => {
        this.configSidebar.notifySelectionCancelled(fieldName);
      }
    });

    return { success: true, data: `Selection started for field: ${fieldName}` };
  }

  /**
   * Остановка выделения элемента
   */
  private async handleStopSelection(): Promise<MessageResponse> {
    this.elementSelector.stopSelection();
    return { success: true, data: 'Selection stopped' };
  }

  /**
   * Тестирование конфига
   */
  private async handleTestConfig(message: SidebarMessage): Promise<MessageResponse> {
    const { config } = message;
    
    try {
      const results = await this.testConfigOnPage(config);
      
      // Отправляем результаты в sidebar
      this.configSidebar.notifyTestResults(results);
      
      return { success: true, data: results };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Подсветка элемента по селектору
   */
  private async handleHighlightElement(message: SidebarMessage): Promise<MessageResponse> {
    const { selector } = message;
    
    try {
      this.elementSelector.highlightBySelector(selector);
      return { success: true, data: 'Element highlighted' };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Получение текущего конфига
   */
  private async handleGetConfig(): Promise<MessageResponse> {
    return { 
      success: true, 
      data: this.currentConfig ?? this.createDefaultConfig() 
    };
  }

  /**
   * Сохранение конфига
   */
  private async handleSaveConfig(message: PopupMessage): Promise<MessageResponse> {
    const { config } = message;
    
    try {
      // Валидируем конфиг
      const validation = await this.validateConfig(config);
      if (!validation.valid) {
        return { success: false, error: validation.errors.join(', ') };
      }
      
      this.currentConfig = config;
      
      // Сохраняем в storage
      await this.saveConfigToStorage(config);
      
      return { success: true, data: 'Config saved' };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Настройка element selector
   */
  private setupElementSelector(): void {
    // Уже настроено в конструкторе ElementSelector
  }

  /**
   * Обработчик выделенного элемента
   */
  private handleElementSelected(
    fieldName: string, 
    element: Element, 
    selector: any
  ): void {
    // Создаем сообщение для sidebar
    const message: ElementSelectedMessage = {
      type: 'ELEMENT_SELECTED',
      id: generateUniqueId(),
      timestamp: Date.now(),
      fieldName,
      element: {
        tagName: element.tagName,
        textContent: element.textContent,
        attributes: this.getElementAttributes(element),
        outerHTML: element.outerHTML
      },
      selector
    };
    
    // Отправляем в sidebar
    this.configSidebar.notifyElementSelected(message);
  }

  /**
   * Инициализация конфига для страницы
   */
  private async initializeConfig(pageType?: string): Promise<void> {
    const domain = window.location.hostname;
    const url = window.location.href;
    
    // Пытаемся загрузить существующий конфиг
    const existingConfig = await this.loadConfigFromStorage(domain);
    
    if (existingConfig) {
      this.currentConfig = existingConfig;
    } else {
      // Создаем новый конфиг
      this.currentConfig = this.createDefaultConfig(domain, pageType);
    }
    
    // Отправляем конфиг в sidebar
    this.configSidebar.updateConfig(this.currentConfig);
  }

  /**
   * Создание конфига по умолчанию
   */
  private createDefaultConfig(domain?: string, pageType?: string): ParserConfig {
    return {
      id: generateUniqueId(),
      platform: {
        name: domain ?? 'Unknown Platform',
        domain: domain ?? window.location.hostname,
        baseUrl: `${window.location.protocol}//${window.location.hostname}`,
        version: '1.0.0'
      },
      pageType: (pageType as any) ?? 'work_detail',
      schema: {
        fields: [],
        metadata: {
          name: 'Default Schema',
          version: '1.0.0',
          createdAt: new Date().toISOString(),
          fieldsCount: 0,
          requiredFieldsCount: 0
        }
      },
      selectors: {},
      metadata: {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };
  }

  /**
   * Тестирование конфига на текущей странице
   */
  private async testConfigOnPage(config: ParserConfig): Promise<any[]> {
    const results = [];
    
    for (const [fieldName, selectorConfig] of Object.entries(config.selectors)) {
      const schemaField = config.schema.fields.find(f => f.name === fieldName);
      if (!schemaField) continue;
      
      try {
        const element = this.findElementBySelectorConfig(selectorConfig);
        const extractedValue = this.extractValueFromElement(element, selectorConfig);
        
        const result = {
          fieldName,
          success: true,
          extractedValue,
          expectedType: schemaField.type,
          actualType: typeof extractedValue,
          selector: selectorConfig.primary,
          timestamp: new Date().toISOString()
        };
        
        results.push(result);
      } catch (error) {
        results.push({
          fieldName,
          success: false,
          error: (error as Error).message,
          expectedType: schemaField.type,
          actualType: 'error',
          selector: selectorConfig.primary,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    return results;
  }

  /**
   * Поиск элемента по конфигу селектора
   */
  private findElementBySelectorConfig(selectorConfig: any): Element {
    const selectors = [selectorConfig.primary, ...selectorConfig.fallback];
    
    for (const selector of selectors) {
      try {
        const element = document.querySelector(selector);
        if (element) return element;
      } catch (error) {
        console.warn(`Invalid selector: ${selector}`, error);
      }
    }
    
    throw new Error(`No element found for selectors: ${selectors.join(', ')}`);
  }

  /**
   * Извлечение значения из элемента
   */
  private extractValueFromElement(element: Element, selectorConfig: any): any {
    switch (selectorConfig.type) {
      case 'text':
        return element.textContent?.trim() ?? '';
        
      case 'attribute':
        const attrName = selectorConfig.attribute ?? 'value';
        return element.getAttribute(attrName) ?? '';
        
      case 'html':
        return element.innerHTML;
        
      case 'array':
        const elements = document.querySelectorAll(selectorConfig.primary);
        return Array.from(elements).map(el => el.textContent?.trim() ?? '');
        
      case 'count':
        const countElements = document.querySelectorAll(selectorConfig.primary);
        return countElements.length;
        
      case 'exists':
        return document.querySelector(selectorConfig.primary) !== null;
        
      default:
        return element.textContent?.trim() ?? '';
    }
  }

  /**
   * Валидация конфига
   */
  private async validateConfig(config: ParserConfig): Promise<{valid: boolean; errors: string[]}> {
    // Базовая валидация (расширится позже)
    const errors: string[] = [];
    
    if (!config.platform?.name) {
      errors.push('Platform name is required');
    }
    
    if (!config.schema?.fields?.length) {
      errors.push('Schema must have at least one field');
    }
    
    return { valid: errors.length === 0, errors };
  }

  /**
   * Сохранение конфига в storage
   */
  private async saveConfigToStorage(config: ParserConfig): Promise<void> {
    const key = `config_${config.platform.domain}`;
    await chrome.storage.local.set({ [key]: config });
  }

  /**
   * Загрузка конфига из storage
   */
  private async loadConfigFromStorage(domain: string): Promise<ParserConfig | null> {
    const key = `config_${domain}`;
    const result = await chrome.storage.local.get(key);
    return result[key] ?? null;
  }

  /**
   * Получение атрибутов элемента
   */
  private getElementAttributes(element: Element): Record<string, string> {
    const attributes: Record<string, string> = {};
    for (const attr of element.attributes) {
      attributes[attr.name] = attr.value;
    }
    return attributes;
  }

  /**
   * Инжекция CSS стилей
   */
  private injectStyles(): void {
    if (document.getElementById('pcb-styles')) return;
    
    const styles = `
      /* Подсветка элементов */
      .pcb-highlight {
        outline: 3px solid #1890ff !important;
        background-color: rgba(24, 144, 255, 0.1) !important;
        position: relative !important;
        z-index: 999999 !important;
      }
      
      .pcb-highlight-hover {
        outline: 2px solid #722ed1 !important;
        background-color: rgba(114, 46, 209, 0.05) !important;
      }
      
      .pcb-highlight-selected {
        outline: 3px solid #52c41a !important;
        background-color: rgba(82, 196, 26, 0.1) !important;
      }
      
      /* Активное состояние расширения */
      body.pcb-active {
        cursor: crosshair !important;
      }
      
      body.pcb-active * {
        cursor: crosshair !important;
      }
      
      /* Исключения для UI расширения */
      .pcb-sidebar,
      .pcb-sidebar * {
        cursor: default !important;
      }
    `;
    
    const styleElement = document.createElement('style');
    styleElement.id = 'pcb-styles';
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);
  }
}

// Инициализация content script
if (typeof window !== 'undefined' && !window.parserConfigContentScript) {
  window.parserConfigContentScript = new ParserConfigContentScript();
}

export default ParserConfigContentScript;
