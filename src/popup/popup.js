// Временный скрипт для popup (будет заменен на скомпилированный popup.ts)

class SimplePopupUI {
  constructor() {
    this.init();
  }
  
  init() {
    this.updateSiteInfo();
    this.setupEventListeners();
  }
  
  updateSiteInfo() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab && tab.url) {
        const domain = new URL(tab.url).hostname;
        const domainElement = document.getElementById('site-domain');
        if (domainElement) {
          domainElement.textContent = domain;
        }
        
        const statusElement = document.getElementById('site-status');
        if (statusElement && this.isSiteSupported(tab.url)) {
          statusElement.innerHTML = `
            <span class="status-indicator status-indicator--active"></span>
            Поддерживается
          `;
          
          const toggleBtn = document.getElementById('toggle-btn');
          const quickSelectBtn = document.getElementById('quick-select-btn');
          if (toggleBtn) toggleBtn.disabled = false;
          if (quickSelectBtn) quickSelectBtn.disabled = false;
        }
      }
    });
  }
  
  isSiteSupported(url) {
    return url.startsWith('http://') || url.startsWith('https://');
  }
  
  setupEventListeners() {
    const toggleBtn = document.getElementById('toggle-btn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        this.showToast('Расширение активировано! Перейдите на страницу.');
        setTimeout(() => window.close(), 1000);
      });
    }
    
    const quickSelectBtn = document.getElementById('quick-select-btn');
    if (quickSelectBtn) {
      quickSelectBtn.addEventListener('click', () => {
        this.showToast('Начинайте выделение элементов на странице!');
        setTimeout(() => window.close(), 1000);
      });
    }
    
    const helpBtn = document.getElementById('help-btn');
    if (helpBtn) {
      helpBtn.addEventListener('click', () => {
        chrome.tabs.create({ url: 'https://github.com/Unaro/parser-config-builder#readme' });
      });
    }
  }
  
  showToast(message, type = 'success') {
    console.log('Toast:', type, message);
    // Пока просто в консоль - заменим на нормальный toast позже
  }
}

// Инициализация
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new SimplePopupUI();
  });
} else {
  new SimplePopupUI();
}
