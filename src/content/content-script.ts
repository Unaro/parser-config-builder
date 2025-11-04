/**
 * Content Script - добавить обработчики новых сообщений
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
    this.configSidebar = new ConfigSidebar((msg: ExtensionMessage) => this.handleMessage(msg));
    
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

  // ... остальной код файла (handleActivate/handleDeactivate/... и др.) оставлен без изменений
}

if (typeof window !== 'undefined' && !(window as any).parserConfigContentScript) {
  (window as any).parserConfigContentScript = new ParserConfigContentScript();
}

export default ParserConfigContentScript;
