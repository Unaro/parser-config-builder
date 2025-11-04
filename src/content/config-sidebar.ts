/**
 * Config Sidebar - боковая панель управления конфигурацией
 */

import type { 
  ParserConfig, 
  ElementSelectedMessage, 
  PageType,
  TestResult 
} from '@/types';
import type { SelectorConfig } from '@/types/selector';
import type { SchemaField } from '@/types/schema';
import { saveAs } from 'file-saver';
import {
  getPageTypeLabel,
  getExtractionTypeLabel,
  getDefaultSelectorConfig,
  getDefaultSchemaField,
  formatTime,
  truncateSelector,
  isValidSelector,
  generateUniqueFieldName
} from './config-sidebar-helpers';

export class ConfigSidebar {
  private isVisible = false;
  private sidebarElement: HTMLElement | null = null;
  private currentConfig: ParserConfig | null = null;
  private currentSection: 'main' | 'schema' | 'selector' = 'main';
  private selectedField: string | null = null;
  private selectionHistory: ElementSelectedMessage[] = [];
  private onMessage: (message: any) => void;

  constructor(onMessage: (message: any) => void) {
    this.onMessage = onMessage;
    console.log('ConfigSidebar: Initialized');
  }

  /**
   * Показать сайдбар
   */
  public show(): void {
    if (this.isVisible) return;

    this.createSidebar();
    this.isVisible = true;
    
    console.log('ConfigSidebar: Shown');
  }

  /**
   * Скрыть сайдбар
   */
  public hide(): void {
    if (!this.isVisible || !this.sidebarElement) return;

    this.sidebarElement.remove();
    this.sidebarElement = null;
    this.isVisible = false;
    this.currentSection = 'main';
    this.selectedField = null;
    
    console.log('ConfigSidebar: Hidden');
  }

  /**
   * Обновить конфиг
   */
  public updateConfig(config: ParserConfig): void {
    this.currentConfig = config;
    
    if (this.isVisible) {
      this.updateSidebarContent();
    }
    
    console.log('ConfigSidebar: Config updated', config.platform.name);
  }

  /**
   * Уведомить о выбранном элементе
   */
  public notifyElementSelected(message: ElementSelectedMessage): void {
    console.log('ConfigSidebar: Element selected notification', message);
    
    this.showNotification(
      `✅ Элемент выбран для поля "${message.fieldName}"`,
      'success'
    );
    
    this.addToSelectionHistory(message);
    
    // Автооткрытие редактора селектора
    if (this.selectedField === message.fieldName) {
      this.openSelectorEditor(message.fieldName, message.selector);
    }
  }

  /**
   * Уведомить об отмене выбора
   */
  public notifySelectionCancelled(fieldName: string): void {
    console.log('ConfigSidebar: Selection cancelled for field', fieldName);
    
    this.showNotification(
      `❌ Выбор элемента для поля "${fieldName}" отменён`,
      'warning'
    );
  }

  /**
   * Уведомить о результатах теста
   */
  public notifyTestResults(results: TestResult[]): void {
    console.log('ConfigSidebar: Test results', results);
    
    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;
    
    this.showNotification(
      `🧪 Тест завершён: ${successCount}/${totalCount} селекторов работают`,
      successCount === totalCount ? 'success' : 'warning'
    );
    
    this.updateTestResults(results);
  }

  /**
   * Открыть редактор селектора
   */
  private openSelectorEditor(fieldName: string, selector?: any): void {
    this.selectedField = fieldName;
    this.currentSection = 'selector';
    this.updateSidebarContent();
  }

  /**
   * Создать сайдбар
   */
  private createSidebar(): void {
    if (this.sidebarElement) return;

    this.sidebarElement = document.createElement('div');
    this.sidebarElement.id = 'pcb-sidebar';
    this.sidebarElement.className = 'pcb-sidebar pcb-ui';
    
    this.sidebarElement.style.cssText = `
      position: fixed;
      top: 0;
      right: 0;
      width: 400px;
      height: 100vh;
      background: white;
      border-left: 2px solid #1890ff;
      box-shadow: -2px 0 8px rgba(0, 0, 0, 0.15);
      z-index: 999998;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
    `;

    document.body.appendChild(this.sidebarElement);
    this.updateSidebarContent();
  }

  /**
   * Обновить содержимое сайдбара
   */
  private updateSidebarContent(): void {
    if (!this.sidebarElement || !this.currentConfig) return;

    this.sidebarElement.innerHTML = this.renderSidebar();
    this.bindEventListeners();
  }

  /**
   * Привязать обработчики событий
   */
  private bindEventListeners(): void {
    if (!this.sidebarElement) return;

    // Кнопка закрытия
    const closeBtn = this.sidebarElement.querySelector('#pcb-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hide());
    }

    // Панель управления
    this.bindControlPanelEvents();
    
    // Вкладки
    this.bindTabEvents();
    
    // Секция-специфичные события
    switch (this.currentSection) {
      case 'schema':
        this.bindSchemaEvents();
        break;
      case 'selector':
        this.bindSelectorEvents();
        break;
      default:
        this.bindMainSectionEvents();
        break;
    }
  }

  /**
   * Обработчики панели управления
   */
  private bindControlPanelEvents(): void {
    // Изменение типа страницы
    const pageTypeSelect = this.sidebarElement!.querySelector('#pcb-page-type') as HTMLSelectElement;
    if (pageTypeSelect) {
      pageTypeSelect.addEventListener('change', (e) => {
        const pageType = (e.target as HTMLSelectElement).value as PageType;
        this.onMessage({
          type: 'UPDATE_PAGE_TYPE',
          pageType,
          id: `sidebar_${Date.now()}`,
          timestamp: Date.now()
        });
      });
    }

    // Начать выбор
    const startBtn = this.sidebarElement!.querySelector('#pcb-start-selection');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        this.showFieldSelectionPrompt();
      });
    }

    // Остановить выбор
    const stopBtn = this.sidebarElement!.querySelector('#pcb-stop-selection');
    if (stopBtn) {
      stopBtn.addEventListener('click', () => {
        this.onMessage({
          type: 'STOP_SELECTION',
          id: `sidebar_${Date.now()}`,
          timestamp: Date.now()
        });
      });
    }

    // Тестировать конфиг
    const testBtn = this.sidebarElement!.querySelector('#pcb-test-config');
    if (testBtn) {
      testBtn.addEventListener('click', () => {
        if (this.currentConfig) {
          this.onMessage({
            type: 'TEST_CONFIG',
            config: this.currentConfig,
            id: `sidebar_${Date.now()}`,
            timestamp: Date.now()
          });
        }
      });
    }

    // Экспорт конфига
    const exportBtn = this.sidebarElement!.querySelector('#pcb-export-config');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        this.exportConfig();
      });
    }
  }

  /**
   * Обработчики вкладок
   */
  private bindTabEvents(): void {
    const tabs = this.sidebarElement!.querySelectorAll('.pcb-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        const section = (e.target as HTMLElement).getAttribute('data-section') as any;
        if (section !== this.currentSection) {
          this.currentSection = section;
          this.selectedField = null;
          this.updateSidebarContent();
        }
      });
    });
  }

  /**
   * Обработчики основной секции
   */
  private bindMainSectionEvents(): void {
    // Очистить историю
    const clearBtn = this.sidebarElement!.querySelector('#pcb-clear-history');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.selectionHistory = [];
        this.updateHistoryDisplay();
      });
    }

    // Клики по элементам истории
    const historyItems = this.sidebarElement!.querySelectorAll('.pcb-history-item');
    historyItems.forEach(item => {
      item.addEventListener('click', (e) => {
        const fieldName = (e.currentTarget as HTMLElement).getAttribute('data-field-name');
        if (fieldName) {
          this.openSelectorEditor(fieldName);
        }
      });
    });
  }

  /**
   * Обработчики редактора схемы
   */
  private bindSchemaEvents(): void {
    // Добавить поле
    const addBtn = this.sidebarElement!.querySelector('#pcb-add-field');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        this.showAddFieldDialog();
      });
    }

    // Редактировать поле
    const editBtns = this.sidebarElement!.querySelectorAll('.pcb-edit-field');
    editBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const fieldName = (e.target as HTMLElement).getAttribute('data-field')!;
        this.showEditFieldDialog(fieldName);
      });
    });

    // Привязать селектор
    const bindBtns = this.sidebarElement!.querySelectorAll('.pcb-bind-selector');
    bindBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const fieldName = (e.target as HTMLElement).getAttribute('data-field')!;
        this.startFieldSelection(fieldName);
      });
    });

    // Удалить поле
    const deleteBtns = this.sidebarElement!.querySelectorAll('.pcb-delete-field');
    deleteBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const fieldName = (e.target as HTMLElement).getAttribute('data-field')!;
        this.deleteField(fieldName);
      });
    });
  }

  /**
   * Обработчики редактора селектора
   */
  private bindSelectorEvents(): void {
    // Назад
    const backBtn = this.sidebarElement!.querySelector('#pcb-back-to-main');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.currentSection = 'main';
        this.selectedField = null;
        this.updateSidebarContent();
      });
    }

    // Изменение типа извлечения
    const typeSelect = this.sidebarElement!.querySelector('#pcb-extraction-type') as HTMLSelectElement;
    if (typeSelect) {
      typeSelect.addEventListener('change', () => {
        // Показываем/скрываем поле атрибута
        this.updateSidebarContent();
      });
    }

    // Добавить fallback
    const addFallbackBtn = this.sidebarElement!.querySelector('#pcb-add-fallback');
    if (addFallbackBtn) {
      addFallbackBtn.addEventListener('click', () => {
        this.addFallbackSelector();
      });
    }

    // Удалить fallback
    const removeBtns = this.sidebarElement!.querySelectorAll('.pcb-remove-fallback');
    removeBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt((e.target as HTMLElement).getAttribute('data-index')!);
        this.removeFallbackSelector(index);
      });
    });

    // Предпросмотр
    const previewBtn = this.sidebarElement!.querySelector('#pcb-preview-selector');
    if (previewBtn) {
      previewBtn.addEventListener('click', () => {
        this.previewSelector();
      });
    }

    // Сохранить
    const saveBtn = this.sidebarElement!.querySelector('#pcb-save-selector');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        this.saveSelector();
      });
    }
  }

  // ... Остальные методы будут в следующих файлах для сокращения размера
  
  private getPageTypeLabel = getPageTypeLabel;
  private getExtractionTypeLabel = getExtractionTypeLabel;
  private getDefaultSelectorConfig = getDefaultSelectorConfig;
  private formatTime = formatTime;
  private truncateSelector = truncateSelector;
  private isValidSelector = isValidSelector;
  private generateUniqueFieldName = generateUniqueFieldName;
}