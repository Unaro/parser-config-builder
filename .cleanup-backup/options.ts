/**
 * Options Page - страница настроек расширения
 */

import type { ParserConfig } from '@/types';

/**
 * Настройки расширения
 */
interface ExtensionSettings {
  // Поведение Sidebar
  autoOpenSelectorEditor: boolean;
  closePopupOnSelection: boolean;
  historyLimit: number;
  
  // Внешний вид
  highlightColor: string;
  highlightWidth: number;
  
  // Обновления
  version: string;
  updatedAt: string;
}

const DEFAULT_SETTINGS: ExtensionSettings = {
  autoOpenSelectorEditor: true,
  closePopupOnSelection: true,
  historyLimit: 10,
  highlightColor: '#1890ff',
  highlightWidth: 3,
  version: '1.0.0',
  updatedAt: new Date().toISOString()
};

class OptionsPage {
  private currentSettings: ExtensionSettings = DEFAULT_SETTINGS;
  private savedConfigs: Record<string, ParserConfig> = {};
  private currentSection = 'general';

  constructor() {
    console.log('OptionsPage: Initializing...');
    this.initialize();
  }

  private async initialize(): Promise<void> {
    await this.loadSettings();
    await this.loadConfigs();
    this.setupEventListeners();
    this.updateUI();
    console.log('OptionsPage: Initialized');
  }

  // === Загрузка данных ===
  
  private async loadSettings(): Promise<void> {
    try {
      const result = await chrome.storage.sync.get('extension_settings');
      if (result.extension_settings) {
        this.currentSettings = { ...DEFAULT_SETTINGS, ...result.extension_settings };
      }
      console.log('OptionsPage: Settings loaded:', this.currentSettings);
    } catch (error) {
      console.error('OptionsPage: Failed to load settings:', error);
    }
  }

  private async saveSettings(): Promise<void> {
    try {
      this.currentSettings.updatedAt = new Date().toISOString();
      await chrome.storage.sync.set({ extension_settings: this.currentSettings });
      this.showToast('Настройки сохранены', 'success');
      console.log('OptionsPage: Settings saved');
    } catch (error) {
      console.error('OptionsPage: Failed to save settings:', error);
      this.showToast('Ошибка сохранения настроек', 'error');
    }
  }

  private async loadConfigs(): Promise<void> {
    try {
      const result = await chrome.storage.local.get();
      this.savedConfigs = {};
      
      for (const [key, value] of Object.entries(result)) {
        if (key.startsWith('config_') && value && typeof value === 'object') {
          const domain = key.replace('config_', '');
          this.savedConfigs[domain] = value as ParserConfig;
        }
      }
      
      console.log('OptionsPage: Configs loaded:', Object.keys(this.savedConfigs));
      this.updateConfigsList();
      this.updateStatusBar();
    } catch (error) {
      console.error('OptionsPage: Failed to load configs:', error);
    }
  }

  // === Обработчики событий ===
  
  private setupEventListeners(): void {
    // Навигация
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const section = (e.target as HTMLElement).getAttribute('data-section');
        if (section) this.switchSection(section);
      });
    });

    // Общие настройки
    this.bindGeneralSettings();
    
    // Внешний вид
    this.bindAppearanceSettings();
    
    // Конфигурации
    this.bindConfigsSection();
    
    // Экспорт/Импорт
    this.bindExportImport();
  }

  private bindGeneralSettings(): void {
    const autoOpenEditor = document.getElementById('auto-open-selector-editor') as HTMLInputElement;
    if (autoOpenEditor) {
      autoOpenEditor.addEventListener('change', () => {
        this.currentSettings.autoOpenSelectorEditor = autoOpenEditor.checked;
        this.saveSettings();
      });
    }

    const closePopup = document.getElementById('close-popup-on-selection') as HTMLInputElement;
    if (closePopup) {
      closePopup.addEventListener('change', () => {
        this.currentSettings.closePopupOnSelection = closePopup.checked;
        this.saveSettings();
      });
    }

    const historyLimit = document.getElementById('history-limit') as HTMLInputElement;
    if (historyLimit) {
      historyLimit.addEventListener('change', () => {
        const value = parseInt(historyLimit.value);
        if (value >= 5 && value <= 50) {
          this.currentSettings.historyLimit = value;
          this.saveSettings();
        }
      });
    }
  }

  private bindAppearanceSettings(): void {
    const colorPicker = document.getElementById('highlight-color') as HTMLInputElement;
    const widthSelect = document.getElementById('highlight-width') as HTMLSelectElement;

    if (colorPicker) {
      colorPicker.addEventListener('change', () => {
        this.currentSettings.highlightColor = colorPicker.value;
        this.updateHighlightPreview();
        this.saveSettings();
      });
    }

    if (widthSelect) {
      widthSelect.addEventListener('change', () => {
        this.currentSettings.highlightWidth = parseInt(widthSelect.value);
        this.updateHighlightPreview();
        this.saveSettings();
      });
    }
  }

  private bindConfigsSection(): void {
    const refreshBtn = document.getElementById('refresh-configs-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.loadConfigs());
    }

    const testAllBtn = document.getElementById('test-all-configs-btn');
    if (testAllBtn) {
      testAllBtn.addEventListener('click', () => this.testAllConfigs());
    }
  }

  private bindExportImport(): void {
    const exportAllBtn = document.getElementById('export-all-btn');
    if (exportAllBtn) {
      exportAllBtn.addEventListener('click', () => this.exportAllConfigs());
    }

    const importBtn = document.getElementById('import-btn');
    const importFile = document.getElementById('import-file') as HTMLInputElement;
    
    if (importBtn && importFile) {
      importBtn.addEventListener('click', () => importFile.click());
      importFile.addEventListener('change', (e) => this.handleImport(e));
    }
  }

  // === UI обновления ===
  
  private switchSection(section: string): void {
    this.currentSection = section;
    
    // Обновляем навигацию
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-section') === section);
    });
    
    // Показываем соответствующую секцию
    document.querySelectorAll('.section').forEach(sec => {
      sec.classList.toggle('active', sec.id === `section-${section}`);
    });
  }

  private updateUI(): void {
    // Обновляем общие настройки
    const autoOpenEditor = document.getElementById('auto-open-selector-editor') as HTMLInputElement;
    if (autoOpenEditor) autoOpenEditor.checked = this.currentSettings.autoOpenSelectorEditor;

    const closePopup = document.getElementById('close-popup-on-selection') as HTMLInputElement;
    if (closePopup) closePopup.checked = this.currentSettings.closePopupOnSelection;

    const historyLimit = document.getElementById('history-limit') as HTMLInputElement;
    if (historyLimit) historyLimit.value = String(this.currentSettings.historyLimit);

    // Обновляем внешний вид
    const colorPicker = document.getElementById('highlight-color') as HTMLInputElement;
    if (colorPicker) colorPicker.value = this.currentSettings.highlightColor;

    const widthSelect = document.getElementById('highlight-width') as HTMLSelectElement;
    if (widthSelect) widthSelect.value = String(this.currentSettings.highlightWidth);

    this.updateHighlightPreview();
  }

  private updateHighlightPreview(): void {
    const preview = document.getElementById('highlight-preview');
    if (!preview) return;
    
    const element = preview.querySelector('.preview-element') as HTMLElement;
    if (element) {
      element.style.outline = `${this.currentSettings.highlightWidth}px solid ${this.currentSettings.highlightColor}`;
      element.style.backgroundColor = this.hexToRgba(this.currentSettings.highlightColor, 0.1);
    }
  }

  private updateConfigsList(): void {
    const list = document.getElementById('configs-list');
    if (!list) return;

    const configs = Object.entries(this.savedConfigs);
    
    if (configs.length === 0) {
      list.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #999;">
          <div style="font-size: 48px; margin-bottom: 16px;">📁</div>
          <div>Конфигурации отсутствуют</div>
          <div style="font-size: 13px; margin-top: 8px;">Создайте конфигурации на сайтах</div>
        </div>
      `;
      return;
    }

    list.innerHTML = configs.map(([domain, config]) => `
      <div class="config-card" data-domain="${domain}">
        <div class="config-header">
          <div class="config-info">
            <div class="config-name">${config.platform.name}</div>
            <div class="config-domain">${domain}</div>
          </div>
          <div class="config-stats">
            <span class="stat">📄 ${config.schema.fields.length}</span>
            <span class="stat">🎯 ${Object.keys(config.selectors).length}</span>
          </div>
        </div>
        
        <div class="config-meta">
          <span>Тип: ${this.getPageTypeLabel(config.pageType)}</span>
          <span>Обновлен: ${this.formatDate(config.metadata.updatedAt)}</span>
        </div>
        
        <div class="config-actions">
          <button class="btn btn--small btn--outline" data-action="test" data-domain="${domain}">
            🧪 Тест
          </button>
          <button class="btn btn--small btn--outline" data-action="export" data-domain="${domain}">
            📥 Экспорт
          </button>
          <button class="btn btn--small btn--danger" data-action="delete" data-domain="${domain}">
            🗑️ Удалить
          </button>
        </div>
      </div>
    `).join('');
    
    // Привязываем события
    this.bindConfigActions();
  }

  private bindConfigActions(): void {
    const actionBtns = document.querySelectorAll('[data-action][data-domain]');
    actionBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = (e.target as HTMLElement).getAttribute('data-action');
        const domain = (e.target as HTMLElement).getAttribute('data-domain');
        if (!action || !domain) return;
        
        switch (action) {
          case 'test':
            this.testConfig(domain);
            break;
          case 'export':
            this.exportConfig(domain);
            break;
          case 'delete':
            this.deleteConfig(domain);
            break;
        }
      });
    });
  }

  private updateStatusBar(): void {
    const totalElement = document.getElementById('total-configs');
    const lastUpdatedElement = document.getElementById('last-updated');
    const connectionElement = document.getElementById('connection-status');
    
    if (totalElement) totalElement.textContent = String(Object.keys(this.savedConfigs).length);
    if (lastUpdatedElement) lastUpdatedElement.textContent = this.formatDate(this.currentSettings.updatedAt);
    if (connectionElement) connectionElement.innerHTML = '✅ Подключено';
  }

  // === Операции с конфигами ===
  
  private async exportAllConfigs(): Promise<void> {
    try {
      const configsArray = Object.entries(this.savedConfigs).map(([domain, config]) => ({
        domain,
        config
      }));
      
      const exportData = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        configs: configsArray
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `parser-configs-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      
      URL.revokeObjectURL(url);
      this.showToast(`Экспортировано ${configsArray.length} конфигураций`, 'success');
    } catch (error) {
      console.error('Export error:', error);
      this.showToast('Ошибка экспорта', 'error');
    }
  }

  private exportConfig(domain: string): void {
    const config = this.savedConfigs[domain];
    if (!config) return;
    
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${domain}-config.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    this.showToast(`Конфиг ${domain} экспортирован`, 'success');
  }

  private async deleteConfig(domain: string): Promise<void> {
    if (!confirm(`Удалить конфигурацию для ${domain}?`)) return;
    
    try {
      await chrome.storage.local.remove(`config_${domain}`);
      delete this.savedConfigs[domain];
      this.updateConfigsList();
      this.updateStatusBar();
      this.showToast(`Конфиг ${domain} удалён`, 'success');
    } catch (error) {
      this.showToast('Ошибка удаления', 'error');
    }
  }

  private testConfig(domain: string): void {
    const config = this.savedConfigs[domain];
    if (!config) return;
    
    // Открываем вкладку с сайтом для теста
    chrome.tabs.create({ 
      url: config.platform.baseUrl,
      active: false 
    }).then(tab => {
      if (tab.id) {
        // Ждём загрузки и запускаем тест
        setTimeout(() => {
          chrome.tabs.sendMessage(tab.id!, {
            type: 'TEST_CONFIG',
            config,
            id: `options_${Date.now()}`,
            timestamp: Date.now()
          });
        }, 2000);
        
        this.showToast(`Тест запущен для ${domain}`, 'success');
      }
    }).catch(() => {
      this.showToast('Ошибка открытия вкладки', 'error');
    });
  }

  private async testAllConfigs(): Promise<void> {
    const domains = Object.keys(this.savedConfigs);
    if (domains.length === 0) {
      this.showToast('Нет конфигураций для теста', 'warning');
      return;
    }
    
    this.showToast(`Запуск теста ${domains.length} конфигураций...`, 'success');
    
    for (const domain of domains) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Пауза между тестами
      this.testConfig(domain);
    }
  }

  private async handleImport(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (data.configs && Array.isArray(data.configs)) {
        // Мульти-конфиг файл
        let imported = 0;
        for (const item of data.configs) {
          if (item.domain && item.config) {
            await chrome.storage.local.set({ [`config_${item.domain}`]: item.config });
            imported++;
          }
        }
        await this.loadConfigs();
        this.showToast(`Импортировано ${imported} конфигураций`, 'success');
      } else if (data.platform && data.schema) {
        // Одиночный конфиг
        const domain = data.platform.domain;
        await chrome.storage.local.set({ [`config_${domain}`]: data });
        await this.loadConfigs();
        this.showToast(`Конфиг ${domain} импортирован`, 'success');
      } else {
        this.showToast('Неверный формат файла', 'error');
      }
    } catch (error) {
      console.error('Import error:', error);
      this.showToast('Ошибка импорта', 'error');
    }
    
    // Очищаем input
    input.value = '';
  }

  // === Вспомогательные методы ===
  
  private getPageTypeLabel(pageType: string): string {
    const labels: Record<string, string> = {
      'work_detail': 'Страница произведения',
      'work_list': 'Каталог произведений',
      'chapter_list': 'Список глав',
      'chapter_read': 'Страница чтения',
      'team_profile': 'Профиль команды',
      'user_profile': 'Профиль пользователя'
    };
    return labels[pageType] || pageType;
  }

  private formatDate(isoString: string): string {
    return new Date(isoString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  private showToast(message: string, type: 'success' | 'error' | 'warning' = 'success'): void {
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.textContent = message;
    
    const colors = {
      success: '#52c41a',
      error: '#ff4d4f',
      warning: '#faad14'
    };
    
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 16px 20px;
      background: ${colors[type]};
      color: white;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      z-index: 999999;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      animation: slideInRight 0.3s ease-out;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      if (toast.parentNode) toast.remove();
    }, 4000);
  }
}

// Инициализация
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new OptionsPage());
} else {
  new OptionsPage();
}