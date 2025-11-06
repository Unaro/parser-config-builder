/**
 * Sidebar - боковое меню с изолированными стилями через Shadow DOM
 * @module content/Sidebar
 * @version 1.0.0
 */

import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { eventBus } from '@lib/events/event-bus';
import { ParserEventFactory } from '@lib/events/parser.events';
import type { SelectorConfig } from '@lib/types/parser.types';
import type { ElementPickedEvent } from '@lib/events/parser.events';

interface SidebarProps {
  onClose: () => void;
  initialUrl: string;
  initialName: string;
}

/**
 * Inline стили для полной изоляции от страницы
 */
const sidebarStyles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  .sidebar-container {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    position: fixed;
    top: 0;
    right: 0;
    width: 420px;
    height: 100vh;
    background: white;
    box-shadow: -4px 0 12px rgba(0, 0, 0, 0.15);
    z-index: 2147483647;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .sidebar-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 16px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .sidebar-title {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
  }

  .close-btn {
    background: rgba(255,255,255,0.2);
    border: none;
    color: white;
    font-size: 24px;
    width: 32px;
    height: 32px;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
  }

  .close-btn:hover {
    background: rgba(255,255,255,0.3);
  }

  .sidebar-content {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
  }

  .info-box {
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 20px;
  }

  .info-text {
    font-size: 13px;
    color: #1e40af;
    line-height: 1.5;
  }

  .form-group {
    margin-bottom: 16px;
  }

  .form-label {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: #374151;
    margin-bottom: 6px;
  }

  .form-input {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 14px;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .form-input:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  .form-input:disabled {
    background: #f3f4f6;
    cursor: not-allowed;
  }

  .selector-group {
    display: flex;
    gap: 8px;
    align-items: flex-end;
  }

  .selector-input-wrapper {
    flex: 1;
  }

  .pick-btn {
    padding: 10px 16px;
    background: #667eea;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
    white-space: nowrap;
    height: 40px;
  }

  .pick-btn:hover {
    background: #5568d3;
  }

  .pick-btn:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }

  .pick-btn.active {
    background: #10b981;
    animation: pulse 1.5s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }

  .section-divider {
    border-top: 1px solid #e5e7eb;
    padding-top: 16px;
    margin-top: 16px;
  }

  .section-title {
    font-size: 14px;
    font-weight: 600;
    color: #374151;
    margin-bottom: 12px;
  }

  .validation-result {
    margin-top: 6px;
    padding: 8px;
    border-radius: 4px;
    font-size: 12px;
  }

  .validation-success {
    background: #d1fae5;
    color: #065f46;
  }

  .validation-error {
    background: #fee2e2;
    color: #991b1b;
  }

  .preview-text {
    color: #6b7280;
    font-size: 11px;
    margin-top: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .sidebar-footer {
    padding: 16px 20px;
    border-top: 1px solid #e5e7eb;
    display: flex;
    gap: 12px;
    background: white;
  }

  .btn {
    flex: 1;
    padding: 12px;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-primary {
    background: #667eea;
    color: white;
  }

  .btn-primary:hover {
    background: #5568d3;
  }

  .btn-secondary {
    background: #f3f4f6;
    color: #374151;
  }

  .btn-secondary:hover {
    background: #e5e7eb;
  }
`;

/**
 * Компонент селектора с кнопкой выбора
 */
function SelectorField({
  label,
  value,
  selectorType,
  onChange,
  required = false
}: {
  label: string;
  value: string;
  selectorType: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  const [isPicking, setIsPicking] = useState(false);
  const [validation, setValidation] = useState<{ status: string; count?: number; preview?: string } | null>(null);

  useState(() => {
    const unsubscribe = eventBus.subscribe<ElementPickedEvent['data']>(
      'element.picked',
      (event) => {
        if (event.data.selectorType === selectorType) {
          onChange(event.data.selector);
          setIsPicking(false);
          setValidation({
            status: 'valid',
            count: 1,
            preview: event.data.previewText
          });
        }
      }
    );

    return () => unsubscribe();
  });

  const handlePick = async () => {
    setIsPicking(true);
    const event = ParserEventFactory.createElementPickRequest(selectorType as any);
    await eventBus.publish(event);
  };

  return (
    <div className="form-group">
      <label className="form-label">
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      <div className="selector-group">
        <div className="selector-input-wrapper">
          <input
            className="form-input"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="CSS selector"
          />
        </div>
        <button
          className={`pick-btn ${isPicking ? 'active' : ''}`}
          onClick={handlePick}
          disabled={isPicking}
          type="button"
        >
          {isPicking ? 'Click element...' : 'Pick'}
        </button>
      </div>
      {validation && (
        <div className={`validation-result ${validation.status === 'valid' ? 'validation-success' : 'validation-error'}`}>
          {validation.status === 'valid' ? (
            <>
              ✓ Found: {validation.count} element(s)
              {validation.preview && (
                <div className="preview-text">Preview: "{validation.preview}"</div>
              )}
            </>
          ) : (
            <>✗ Not found</>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Главный Sidebar компонент
 */
function Sidebar({ onClose, initialUrl, initialName }: SidebarProps) {
  const [name, setName] = useState(initialName);
  const [targetUrl] = useState(initialUrl);
  const [selectors, setSelectors] = useState<Partial<SelectorConfig>>({
    title: '',
    chapters: '',
    images: ''
  });

  const handleSave = async () => {
    if (!name || !selectors.title || !selectors.chapters || !selectors.images) {
      alert('Please fill all required fields (Title, Chapters, Images)');
      return;
    }

    const config = {
      id: crypto.randomUUID(),
      name,
      version: '1.0.0',
      targetUrl,
      selectors: selectors as SelectorConfig,
      metadata: {
        created: new Date(),
        updated: new Date(),
        author: 'user',
        tags: [],
        siteUrl: targetUrl
      }
    };

    const event = ParserEventFactory.createConfigCreated(config);
    await eventBus.publish(event);

    alert('Configuration saved!');
    onClose();
  };

  return (
    <>
      <style>{sidebarStyles}</style>
      <div className="sidebar-container">
        <div className="sidebar-header">
          <h2 className="sidebar-title">Create Parser Config</h2>
          <button className="close-btn" onClick={onClose} type="button">
            ×
          </button>
        </div>

        <div className="sidebar-content">
          <div className="info-box">
            <p className="info-text">
              <strong>Tip:</strong> Click "Pick" buttons, then click any element on the page to auto-generate its CSS selector!
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">Configuration Name <span style={{ color: '#ef4444' }}>*</span></label>
            <input
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., MangaReader Parser"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Site URL (auto-filled)</label>
            <input
              className="form-input"
              value={targetUrl}
              disabled
            />
          </div>

          <div className="section-divider">
            <h3 className="section-title">Required Selectors</h3>
            
            <SelectorField
              label="Title"
              value={selectors.title || ''}
              selectorType="title"
              onChange={(value) => setSelectors({ ...selectors, title: value })}
              required
            />

            <SelectorField
              label="Chapters List"
              value={selectors.chapters || ''}
              selectorType="chapters"
              onChange={(value) => setSelectors({ ...selectors, chapters: value })}
              required
            />

            <SelectorField
              label="Page Images"
              value={selectors.images || ''}
              selectorType="images"
              onChange={(value) => setSelectors({ ...selectors, images: value })}
              required
            />
          </div>

          <div className="section-divider">
            <h3 className="section-title">Optional Selectors</h3>
            
            <SelectorField
              label="Author"
              value={selectors.author || ''}
              selectorType="author"
              onChange={(value) => setSelectors({ ...selectors, author: value })}
            />

            <SelectorField
              label="Description"
              value={selectors.description || ''}
              selectorType="description"
              onChange={(value) => setSelectors({ ...selectors, description: value })}
            />

            <SelectorField
              label="Cover Image"
              value={selectors.cover || ''}
              selectorType="cover"
              onChange={(value) => setSelectors({ ...selectors, cover: value })}
            />
          </div>
        </div>

        <div className="sidebar-footer">
          <button className="btn btn-secondary" onClick={onClose} type="button">
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave} type="button">
            Save Config
          </button>
        </div>
      </div>
    </>
  );
}

/**
 * Инициализация и монтирование Sidebar с Shadow DOM
 */
export function mountSidebar() {
  // Проверяем, не смонтирован ли уже
  const existingRoot = document.getElementById('parser-config-builder-sidebar-root');
  if (existingRoot) {
    return;
  }

  // Создаем контейнер
  const container = document.createElement('div');
  container.id = 'parser-config-builder-sidebar-root';
  container.style.cssText = 'all: initial; position: fixed; top: 0; right: 0; z-index: 2147483647;';
  
  // Создаем Shadow DOM для полной изоляции стилей
  const shadowRoot = container.attachShadow({ mode: 'open' });
  
  // Создаем div внутри shadow root
  const innerContainer = document.createElement('div');
  shadowRoot.appendChild(innerContainer);

  document.body.appendChild(container);

  // Данные о текущей странице
  const currentUrl = window.location.origin;
  const siteName = document.title || new URL(currentUrl).hostname;

  // Монтируем React в Shadow DOM
  const root = createRoot(innerContainer);
  root.render(
    <Sidebar
      onClose={() => {
        root.unmount();
        container.remove();
      }}
      initialUrl={currentUrl}
      initialName={`${siteName} Parser`}
    />
  );
}

/**
 * Проверка, открыт ли Sidebar
 */
export function isSidebarOpen(): boolean {
  return !!document.getElementById('parser-config-builder-sidebar-root');
}
