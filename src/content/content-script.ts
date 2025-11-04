/**
 * Content Script - основной компонент для взаимодействия с DOM (с улучшенным статусом)
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
  GetStatusMessage,
  ToggleActiveMessage,
  StatusResponse,
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
  private currentlySelectingField: string | null = null;

  constructor() {
    this.elementSelector = new ElementSelector();
    this.configSidebar = new ConfigSidebar(async (msg: ExtensionMessage) => this.handleMessage(msg));

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

  private setupMessageListeners(): void {
    chrome.runtime.onMessage.addListener(
      (message: ExtensionMessage, _sender, sendResponse) => {
        this.handleMessage(message)
          .then(response => sendResponse(response))
          .catch(error => {
            console.error('Message handling error:', error);
            sendResponse({ success: false, error: (error as Error).message });
          });
        return true;
      }
    );
  }

  private async handleMessage(message: ExtensionMessage): Promise<MessageResponse> {
    switch (message.type) {
      case 'ACTIVATE_EXTENSION':
        return this.handleActivate(message as ActivateExtensionMessage);
      case 'DEACTIVATE_EXTENSION':
        return this.handleDeactivate();
      case 'GET_STATUS':
        return this.handleGetStatus(message as GetStatusMessage);
      case 'TOGGLE_ACTIVE':
        return this.handleToggleActive(message as ToggleActiveMessage);
      case 'START_SELECTION':
        return this.handleStartSelection(message as StartSelectionMessage);
      case 'STOP_SELECTION':
        return this.handleStopSelection();
      case 'TEST_CONFIG':
        return this.handleTestConfig(message as TestConfigMessage);
      case 'HIGHLIGHT_ELEMENT':
        return this.handleHighlightElement(message as HighlightElementMessage);
      case 'GET_CONFIG':
        return this.handleGetConfig();
      case 'SAVE_CONFIG':
        return this.handleSaveConfig(message as SaveConfigMessage);
      case 'UPDATE_SCHEMA':
        return this.handleUpdateSchema((message as any));
      case 'UPDATE_SELECTOR':
        return this.handleUpdateSelector((message as any));
      case 'UPDATE_PAGE_TYPE':
        return this.handleUpdatePageType((message as any));
      default:
        return { success: false, error: 'Unknown message type' };
    }
  }

  // --- Новые статусные обработчики ---
  private async handleGetStatus(message: GetStatusMessage): Promise<MessageResponse<StatusResponse>> {
    const domain = window.location.hostname;
    const status: StatusResponse = {
      isActive: this.isActive,
      hasSidebar: this.configSidebar && this.isActive, // Предполагаем, что сидбар появляется при активации
      pageType: this.currentConfig?.pageType,
      domain,
      ...(this.currentlySelectingField ? { selectingField: this.currentlySelectingField } : {}),
      fieldsCount: this.currentConfig?.schema.fields.length ?? 0,
      selectorsCount: Object.keys(this.currentConfig?.selectors ?? {}).length
    };
    return { success: true, data: status };
  }

  private async handleToggleActive(message: ToggleActiveMessage): Promise<MessageResponse> {
    if (this.isActive) {
      return this.handleDeactivate();
    } else {
      return this.handleActivate({ ...message, type: 'ACTIVATE_EXTENSION' } as ActivateExtensionMessage);
    }
  }

  // --- UPDATE handlers ---
  private async handleUpdateSchema(message: any): Promise<MessageResponse> {
    if (!this.currentConfig) return { success: false, error: 'Config not initialized' };
    this.currentConfig = { ...this.currentConfig, schema: message.schema };
    await this.saveConfigToStorage(this.currentConfig);
    this.configSidebar.updateConfig(this.currentConfig);
    return { success: true };
  }

  private async handleUpdateSelector(message: any): Promise<MessageResponse> {
    if (!this.currentConfig) return { success: false, error: 'Config not initialized' };
    const selectors = { ...this.currentConfig.selectors, [message.fieldName]: message.selectorConfig };
    this.currentConfig = { ...this.currentConfig, selectors };
    await this.saveConfigToStorage(this.currentConfig);
    this.configSidebar.updateConfig(this.currentConfig);
    return { success: true };
  }

  private async handleUpdatePageType(message: any): Promise<MessageResponse> {
    if (!this.currentConfig) return { success: false, error: 'Config not initialized' };
    this.currentConfig = { ...this.currentConfig, pageType: message.pageType } as ParserConfig;
    await this.saveConfigToStorage(this.currentConfig);
    this.configSidebar.updateConfig(this.currentConfig);
    return { success: true };
  }

  // --- Existing methods ---
  private async handleActivate(message: ActivateExtensionMessage): Promise<MessageResponse> {
    if (this.isActive) return { success: true, data: 'Already active' };
    try {
      this.isActive = true;
      this.configSidebar.show();
      await this.initializeConfig(message.pageType);
      document.body.classList.add('pcb-active');
      return { success: true, data: 'Extension activated' };
    } catch (error) {
      this.isActive = false;
      return { success: false, error: (error as Error).message };
    }
  }

  private async handleDeactivate(): Promise<MessageResponse> {
    if (!this.isActive) return { success: true, data: 'Already inactive' };
    this.isActive = false;
    this.currentlySelectingField = null;
    this.elementSelector.stopSelection();
    this.configSidebar.hide();
    this.elementSelector.clearAllHighlights();
    document.body.classList.remove('pcb-active');
    
    // Убираем уведомления при деактивации
    const notification = document.getElementById('pcb-selection-notification');
    if (notification) notification.remove();
    
    return { success: true, data: 'Extension deactivated' };
  }

  private async handleStartSelection(message: StartSelectionMessage): Promise<MessageResponse> {
    if (!this.isActive) return { success: false, error: 'Extension not active' };
    const { fieldName, fieldType } = message;
    this.currentlySelectingField = fieldName;
    
    // Показываем уведомление о режиме выбора
    this.showSelectionModeNotification(fieldName);
    
    this.elementSelector.startSelection({
      fieldName,
      fieldType,
      onElementSelected: (element, selector) => {
        this.currentlySelectingField = null;
        this.hideSelectionModeNotification();
        this.handleElementSelected(fieldName, element, selector);
      },
      onSelectionCancelled: () => {
        this.currentlySelectingField = null;
        this.hideSelectionModeNotification();
        this.configSidebar.notifySelectionCancelled(fieldName);
      }
    });

    return { success: true, data: `Selection started for field: ${fieldName}` };
  }

  private async handleStopSelection(): Promise<MessageResponse> {
    this.elementSelector.stopSelection();
    this.currentlySelectingField = null;
    this.hideSelectionModeNotification();
    
    // Показываем уведомление об остановке
    this.showStopSelectionNotification();
    
    return { success: true, data: 'Selection stopped' };
  }

  private async handleTestConfig(message: TestConfigMessage): Promise<MessageResponse> {
    const { config } = message;
    try {
      const results = await this.testConfigOnPage(config);
      this.configSidebar.notifyTestResults(results);
      return { success: true, data: results };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  private async handleHighlightElement(message: HighlightElementMessage): Promise<MessageResponse> {
    const { selector } = message;
    try {
      this.elementSelector.highlightBySelector(selector);
      return { success: true, data: 'Element highlighted' };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  private async handleGetConfig(): Promise<MessageResponse> {
    return { success: true, data: this.currentConfig ?? this.createDefaultConfig() };
  }

  private async handleSaveConfig(message: SaveConfigMessage): Promise<MessageResponse> {
    const { config } = message;
    try {
      const validation = await this.validateConfig(config);
      if (!validation.valid) return { success: false, error: validation.errors.join(', ') };
      this.currentConfig = config;
      await this.saveConfigToStorage(config);
      return { success: true, data: 'Config saved' };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  // --- Вспомогательные методы ---
  
  private showSelectionModeNotification(fieldName: string): void {
    this.hideSelectionModeNotification(); // Убираем предыдущее
    
    const notification = document.createElement('div');
    notification.id = 'pcb-selection-notification';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #1890ff 0%, #52c41a 100%);
      color: white;
      padding: 16px 24px;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      z-index: 999999;
      box-shadow: 0 4px 16px rgba(0,0,0,0.2);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      animation: slideInDown 0.3s ease-out;
    `;
    
    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <span style="font-size: 20px;">🎯</span>
        <div>
          <div>Режим выбора: <strong>${fieldName}</strong></div>
          <div style="font-size: 13px; opacity: 0.9; margin-top: 4px;">
            Кликните по элементу для выбора • ESC - отмена
          </div>
        </div>
        <button style="
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          width: 24px;
          height: 24px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        " onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;
    
    // Анимация
    if (!document.getElementById('pcb-selection-animations')) {
      const style = document.createElement('style');
      style.id = 'pcb-selection-animations';
      style.textContent = `
        @keyframes slideInDown {
          from { transform: translateX(-50%) translateY(-100%); opacity: 0; }
          to { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Автоудаление через 15 секунд
    setTimeout(() => {
      if (notification.parentNode) notification.remove();
    }, 15000);
  }
  
  private hideSelectionModeNotification(): void {
    const notification = document.getElementById('pcb-selection-notification');
    if (notification) notification.remove();
  }
  
  private showStopSelectionNotification(): void {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      z-index: 999999;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    `;
    
    notification.innerHTML = '⏹️ Режим выбора остановлен';
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) notification.remove();
    }, 2000);
  }

  private setupElementSelector(): void { /* no-op */ }

  private handleElementSelected(fieldName: string, element: Element, selector: any): void {
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
    this.configSidebar.notifyElementSelected(message);
  }

  private async initializeConfig(pageType?: string): Promise<void> {
    const domain = window.location.hostname;
    const existingConfig = await this.loadConfigFromStorage(domain);
    this.currentConfig = existingConfig ?? this.createDefaultConfig(domain, pageType);
    this.configSidebar.updateConfig(this.currentConfig);
  }

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

  private async testConfigOnPage(config: ParserConfig): Promise<any[]> {
    const results: any[] = [];
    for (const [fieldName, selectorConfig] of Object.entries(config.selectors)) {
      const schemaField = config.schema.fields.find(f => f.name === fieldName);
      if (!schemaField) continue;
      try {
        const element = this.findElementBySelectorConfig(selectorConfig as any);
        const extractedValue = this.extractValueFromElement(element, selectorConfig as any);
        results.push({
          fieldName,
          success: true,
          extractedValue,
          expectedType: (schemaField as any).type,
          actualType: typeof extractedValue,
          selector: (selectorConfig as any).primary,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        results.push({
          fieldName,
          success: false,
          error: (error as Error).message,
          expectedType: (schemaField as any).type,
          actualType: 'error',
          selector: (selectorConfig as any).primary,
          timestamp: new Date().toISOString()
        });
      }
    }
    return results;
  }

  private findElementBySelectorConfig(selectorConfig: any): Element {
    const selectors = [selectorConfig.primary, ...(selectorConfig.fallback ?? [])];
    for (const selector of selectors) {
      try { const element = document.querySelector(selector); if (element) return element; } catch {}
    }
    throw new Error(`No element found for selectors: ${selectors.join(', ')}`);
  }

  private extractValueFromElement(element: Element, selectorConfig: any): any {
    switch (selectorConfig.type) {
      case 'text': return element.textContent?.trim() ?? '';
      case 'attribute': return element.getAttribute(selectorConfig.attribute ?? 'value') ?? '';
      case 'html': return element.innerHTML;
      case 'array': return Array.from(document.querySelectorAll(selectorConfig.primary)).map(el => el.textContent?.trim() ?? '');
      case 'count': return document.querySelectorAll(selectorConfig.primary).length;
      case 'exists': return document.querySelector(selectorConfig.primary) !== null;
      default: return element.textContent?.trim() ?? '';
    }
  }

  private async validateConfig(config: ParserConfig): Promise<{valid: boolean; errors: string[]}> {
    const errors: string[] = [];
    if (!config.platform?.name) errors.push('Platform name is required');
    if (!config.schema?.fields?.length) errors.push('Schema must have at least one field');
    return { valid: errors.length === 0, errors };
  }

  private async saveConfigToStorage(config: ParserConfig): Promise<void> {
    const key = `config_${config.platform.domain}`;
    await chrome.storage.local.set({ [key]: config });
  }

  private async loadConfigFromStorage(domain: string): Promise<ParserConfig | null> {
    const key = `config_${domain}`;
    const result = await chrome.storage.local.get(key);
    return result[key] ?? null;
  }

  private getElementAttributes(element: Element): Record<string, string> {
    const attributes: Record<string, string> = {};
    for (const attr of element.attributes) attributes[attr.name] = attr.value;
    return attributes;
  }

  private injectStylesSafely(): void {
    const head = document.head || document.getElementsByTagName('head')[0] || document.documentElement || document.body;
    if (!head) return;
    if (document.getElementById('pcb-styles')) return;
    const styleElement = document.createElement('style');
    styleElement.id = 'pcb-styles';
    styleElement.textContent = `
      .pcb-highlight{outline:3px solid #1890ff!important;background-color:rgba(24,144,255,.1)!important;position:relative!important;z-index:999999!important}
      .pcb-highlight-hover{outline:2px solid #722ed1!important;background-color:rgba(114,46,209,.05)!important}
      .pcb-highlight-selected{outline:3px solid #52c41a!important;background-color:rgba(82,196,26,.1)!important}
      body.pcb-active,body.pcb-active *{cursor:crosshair!important}
      .pcb-sidebar,.pcb-sidebar *{cursor:default!important}
    `;
    head.appendChild(styleElement);
  }
}

if (typeof window !== 'undefined' && !(window as any).parserConfigContentScript) {
  (window as any).parserConfigContentScript = new ParserConfigContentScript();
}

export default ParserConfigContentScript;