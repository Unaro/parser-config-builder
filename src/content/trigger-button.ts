/**
 * Кнопка-триггер
 * @module content/trigger-button
 */

import { mountSidebar, isSidebarOpen } from './Sidebar';

export function createTriggerButton(): HTMLButtonElement {
  const button = document.createElement('button');
  button.id = 'parser-config-builder-trigger';
  
  // SVG иконка настроек
  button.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12 3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97 0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1 0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66z"/>
    </svg>
  `;
  
  button.title = 'Open Parser Config Builder';
  
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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease',
    opacity: '0.9',
    padding: '0'
  });

  button.addEventListener('mouseenter', () => {
    button.style.opacity = '1';
    button.style.transform = 'translateY(-50%) translateX(-4px)';
  });

  button.addEventListener('mouseleave', () => {
    button.style.opacity = '0.9';
    button.style.transform = 'translateY(-50%)';
  });

  button.addEventListener('click', () => {
    if (!isSidebarOpen()) {
      mountSidebar();
      button.style.display = 'none';
    }
  });

  return button;
}

export function initTriggerButton(): void {
  if (document.getElementById('parser-config-builder-trigger')) return;

  const button = createTriggerButton();
  document.body.appendChild(button);

  const observer = new MutationObserver(() => {
    if (!isSidebarOpen() && button.style.display === 'none') {
      button.style.display = 'flex';
    }
  });

  observer.observe(document.body, { childList: true, subtree: false });
}
