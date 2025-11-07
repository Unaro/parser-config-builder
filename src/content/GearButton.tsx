/**
 * Gear Button - триггер для открытия Sidebar
 * @module content/GearButton
 */

import { createRoot } from 'react-dom/client';
import { mountSidebar, isSidebarOpen } from './Sidebar';

const styles = `
  .gear-button {
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 60px;
    height: 60px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    border-radius: 50%;
    cursor: pointer;
    z-index: 2147483646;
    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    color: white;
    font-size: 28px;
  }
  
  .gear-button:hover {
    transform: scale(1.1) rotate(90deg);
    box-shadow: 0 12px 28px rgba(102, 126, 234, 0.6);
  }
  
  .gear-button:active {
    transform: scale(0.95) rotate(90deg);
  }

  .gear-icon {
    animation: rotate 10s linear infinite;
  }

  @keyframes rotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .tooltip {
    position: absolute;
    bottom: 70px;
    right: 0;
    background: #1f2937;
    color: white;
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s;
    font-family: system-ui, sans-serif;
  }

  .gear-button:hover .tooltip {
    opacity: 1;
  }

  .tooltip::after {
    content: '';
    position: absolute;
    top: 100%;
    right: 20px;
    border: 6px solid transparent;
    border-top-color: #1f2937;
  }
`;

function GearButton() {
  const handleClick = () => {
    if (!isSidebarOpen()) {
      mountSidebar();
    }
  };

  return (
    <>
      <style>{styles}</style>
      <button className="gear-button" onClick={handleClick} type="button">
        <span className="gear-icon">⚙️</span>
        <span className="tooltip">Open Parser Config</span>
      </button>
    </>
  );
}

export function mountGearButton() {
  // Проверяем что кнопка еще не создана
  if (document.getElementById('parser-gear-button-root')) {
    return;
  }

  const container = document.createElement('div');
  container.id = 'parser-gear-button-root';
  container.style.cssText = 'all: initial; position: fixed; bottom: 24px; right: 24px; z-index: 2147483646;';
  
  const shadow = container.attachShadow({ mode: 'open' });
  const mountPoint = document.createElement('div');
  shadow.appendChild(mountPoint);
  
  document.body.appendChild(container);
  
  const root = createRoot(mountPoint);
  root.render(<GearButton />);
  
  console.log('[GearButton] Mounted');
}

export function unmountGearButton() {
  const existing = document.getElementById('parser-gear-button-root');
  if (existing) {
    existing.remove();
  }
}
