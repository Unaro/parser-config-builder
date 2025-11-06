/**
 * Кнопка-триггер для открытия бокового меню
 * @module content/trigger-button
 * @version 1.0.0
 */

import { mountSidebar, isSidebarOpen } from './Sidebar';

/**
 * Создать кнопку-триггер
 */
export function createTriggerButton(): HTMLButtonElement {
  const button = document.createElement('button');
  button.id = 'parser-config-builder-trigger';
  button.innerHTML = '⚙️';
  button.title = 'Open Parser Config Builder';
  
  // Inline стили для полной изоляции
  Object.assign(button.style, {
    all: 'initial',
    position: 'fixed',
    top: '50%',
    right: '0',
    transform: 'translateY(-50%)',
    zIndex: '2147483646',
    width: '48px',
    height: '48px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    borderRadius: '8px 0 0 8px',
    boxShadow: '-2px 2px 8px rgba(0, 0, 0, 0.2)',
    cursor: 'pointer',
    fontSize: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease',
    opacity: '0.9',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  });

  // Hover эффект
  button.addEventListener('mouseenter', () => {
    button.style.opacity = '1';
    button.style.transform = 'translateY(-50%) translateX(-4px)';
  });

  button.addEventListener('mouseleave', () => {
    button.style.opacity = '0.9';
    button.style.transform = 'translateY(-50%)';
  });

  // Клик - открытие Sidebar
  button.addEventListener('click', () => {
    if (!isSidebarOpen()) {
      mountSidebar();
      button.style.display = 'none';
    }
  });

  return button;
}

/**
 * Инициализировать триггер кнопку
 */
export function initTriggerButton(): void {
  if (document.getElementById('parser-config-builder-trigger')) {
    return;
  }

  const button = createTriggerButton();
  document.body.appendChild(button);

  // Показываем кнопку когда Sidebar закрывается
  const observer = new MutationObserver(() => {
    if (!isSidebarOpen() && button.style.display === 'none') {
      button.style.display = 'flex';
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: false
  });
}
