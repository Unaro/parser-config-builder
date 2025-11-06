/**
 * Sidebar с динамическими полями (исправленная версия)
 * @module content/Sidebar
 */

import { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { eventBus } from '@lib/events/event-bus';
import { ParserEventFactory } from '@lib/events/parser.events';
import { browser } from '@lib/utils/browser-api';
import type { CustomField, FieldType } from '@lib/types/parser.types';
import type { ElementPickedEvent, ElementPickCancelledEvent } from '@lib/events/parser.events';

interface SidebarProps {
  onClose: () => void;
  initialUrl: string;
  initialName: string;
}

const sidebarStyles = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  .sidebar-container {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    position: fixed; top: 0; right: 0; width: 440px; height: 100vh;
    background: white; box-shadow: -4px 0 12px rgba(0, 0, 0, 0.15);
    z-index: 2147483647; display: flex; flex-direction: column;
  }
  .sidebar-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white; padding: 16px 20px;
    display: flex; justify-content: space-between; align-items: center;
  }
  .sidebar-title { font-size: 18px; font-weight: 600; }
  .close-btn {
    background: rgba(255,255,255,0.2); border: none; color: white;
    font-size: 28px; width: 32px; height: 32px; border-radius: 6px;
    cursor: pointer; line-height: 1; transition: background 0.2s;
  }
  .close-btn:hover { background: rgba(255,255,255,0.3); }
  .sidebar-content { flex: 1; overflow-y: auto; padding: 20px; }
  .info-box {
    background: #eff6ff; border: 1px solid #bfdbfe;
    border-radius: 8px; padding: 12px; margin-bottom: 20px;
  }
  .info-text { font-size: 13px; color: #1e40af; line-height: 1.5; }
  .form-group { margin-bottom: 16px; }
  .form-label {
    display: block; font-size: 14px; font-weight: 500;
    color: #374151; margin-bottom: 6px;
  }
  .form-input {
    width: 100%; padding: 10px 12px; border: 1px solid #d1d5db;
    border-radius: 6px; font-size: 14px; transition: border 0.2s;
  }
  .form-input:focus {
    outline: none; border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
  .form-input:disabled { background: #f3f4f6; cursor: not-allowed; }
  .select {
    width: 100%; padding: 10px 12px; border: 1px solid #d1d5db;
    border-radius: 6px; font-size: 14px; background: white; cursor: pointer;
  }
  .field-row { display: flex; gap: 8px; align-items: flex-start; }
  .field-row-input { flex: 1; }
  .btn {
    padding: 10px 16px; border: none; border-radius: 6px;
    font-size: 14px; font-weight: 500; cursor: pointer;
    transition: all 0.2s; white-space: nowrap;
  }
  .btn-pick { background: #667eea; color: white; height: 40px; }
  .btn-pick:hover { background: #5568d3; }
  .btn-pick.active { background: #10b981; animation: pulse 1.5s infinite; }
  .btn-pick:disabled { background: #9ca3af; cursor: not-allowed; }
  .btn-remove { background: #ef4444; color: white; height: 40px; width: 40px; padding: 0; }
  .btn-remove:hover { background: #dc2626; }
  .btn-add { background: #10b981; color: white; width: 100%; }
  .btn-add:hover { background: #059669; }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
  .validation { margin-top: 6px; padding: 8px; border-radius: 4px; font-size: 12px; }
  .validation-success { background: #d1fae5; color: #065f46; }
  .validation-error { background: #fee2e2; color: #991b1b; }
  .preview { color: #6b7280; font-size: 11px; margin-top: 4px; }
  .array-preview {
    margin-top: 4px; padding: 6px; background: #f9fafb;
    border-radius: 4px; font-size: 11px;
  }
  .section-title {
    font-size: 14px; font-weight: 600; color: #374151;
    margin: 20px 0 12px; padding-top: 16px; border-top: 1px solid #e5e7eb;
  }
  .field-card {
    background: #f9fafb; border: 1px solid #e5e7eb;
    border-radius: 8px; padding: 12px; margin-bottom: 12px;
  }
  .sidebar-footer {
    padding: 16px 20px; border-top: 1px solid #e5e7eb;
    display: flex; gap: 12px; background: white;
  }
  .btn-footer { flex: 1; padding: 12px; border: none; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; }
  .btn-primary { background: #667eea; color: white; }
  .btn-primary:hover { background: #5568d3; }
  .btn-secondary { background: #f3f4f6; color: #374151; }
  .btn-secondary:hover { background: #e5e7eb; }
`;

interface FieldState extends Omit<CustomField, 'id'> {
  id: string;
  isPicking: boolean;
  validation: { status: string; count: number; preview?: string; arrayPreview?: string[] } | null;
}

function DynamicField({ 
  field, 
  onChange, 
  onRemove,
  onStartPick
}: { 
  field: FieldState;
  onChange: (updates: Partial<FieldState>) => void;
  onRemove: () => void;
  onStartPick: () => void;
}) {
  return (
    <div className="field-card">
      <div className="form-group">
        <label className="form-label">Field Name {field.required && <span style={{ color: '#ef4444' }}>*</span>}</label>
        <input
          className="form-input"
          value={field.name}
          onChange={(e) => onChange({ name: e.target.value, key: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
          placeholder="e.g., Title, Author, Genres"
        />
      </div>

      <div className="form-group">
        <label className="form-label">Field Type</label>
        <select
          className="select"
          value={field.type}
          onChange={(e) => onChange({ type: e.target.value as FieldType })}
        >
          <option value="string">Single Text</option>
          <option value="array">Array (multiple elements)</option>
          <option value="image">Image URL</option>
          <option value="object">Complex Object</option>
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">CSS Selector {field.required && <span style={{ color: '#ef4444' }}>*</span>}</label>
        <div className="field-row">
          <div className="field-row-input">
            <input
              className="form-input"
              value={field.selector}
              onChange={(e) => onChange({ selector: e.target.value })}
              placeholder="Click Pick"
            />
          </div>
          <button className={`btn btn-pick ${field.isPicking ? 'active' : ''}`} onClick={onStartPick} type="button">
            {field.isPicking ? 'Click...' : 'Pick'}
          </button>
          <button className="btn btn-remove" onClick={onRemove} type="button" title="Remove">×</button>
        </div>

        {field.validation && (
          <div className={`validation ${field.validation.status === 'valid' ? 'validation-success' : 'validation-error'}`}>
            {field.validation.status === 'valid' ? (
              <>
                ✓ Found: {field.validation.count} element(s)
                {field.type === 'array' && field.validation.arrayPreview && (
                  <div className="array-preview">
                    Preview: {field.validation.arrayPreview.join(', ')}
                    {field.validation.count > 3 && ` ... and ${field.validation.count - 3} more`}
                  </div>
                )}
                {field.type !== 'array' && field.validation.preview && (
                  <div className="preview">"{field.validation.preview}"</div>
                )}
              </>
            ) : <>✗ Not found</>}
          </div>
        )}
      </div>
    </div>
  );
}

function Sidebar({ onClose, initialUrl, initialName }: SidebarProps) {
  const [name, setName] = useState(initialName);
  const [targetUrl] = useState(initialUrl);
  const [fields, setFields] = useState<FieldState[]>([
    { id: crypto.randomUUID(), name: 'Title', key: 'title', type: 'string', selector: '', required: true, isPicking: false, validation: null },
    { id: crypto.randomUUID(), name: 'Chapters', key: 'chapters', type: 'array', selector: '', required: true, isPicking: false, validation: null },
    { id: crypto.randomUUID(), name: 'Images', key: 'images', type: 'array', selector: '', required: true, isPicking: false, validation: null }
  ]);

  useEffect(() => {
    const unsubPicked = eventBus.subscribe<ElementPickedEvent['data']>('element.picked', (event) => {
      setFields(prev => prev.map(f => 
        f.id === event.data.fieldId
          ? { ...f, selector: event.data.selector, isPicking: false,
              validation: { status: 'valid', count: event.data.elementCount,
                preview: event.data.previewText, arrayPreview: event.data.arrayPreview }}
          : f
      ));
    });

    const unsubCancelled = eventBus.subscribe<ElementPickCancelledEvent['data']>('element.pick.cancelled', (event) => {
      setFields(prev => prev.map(f => f.id === event.data.fieldId ? { ...f, isPicking: false } : f));
    });

    return () => { unsubPicked(); unsubCancelled(); };
  }, []);

  const handleSave = async () => {
    const requiredFields = fields.filter(f => f.required);
    const hasEmptyRequired = requiredFields.some(f => !f.selector);

    if (!name) { alert('Please enter configuration name'); return; }
    if (hasEmptyRequired) { alert('Please fill all required fields'); return; }

    const config = {
      id: crypto.randomUUID(), name, version: '1.0.0', targetUrl,
      fields: fields.map(({ id, name, key, type, selector, required, description }) => 
        ({ id, name, key, type, selector, required, description })),
      metadata: { created: new Date(), updated: new Date(), author: 'user', tags: [], siteUrl: targetUrl }
    };

    try {
      const response = await browser.runtime.sendMessage({ type: 'CONFIG_CREATED', config }) as { success: boolean };
      if (response?.success) {
        alert('Configuration saved!');
        onClose();
      } else {
        alert('Failed to save');
      }
    } catch (error) {
      console.error('[Sidebar] Save error:', error);
      alert('Error: ' + (error instanceof Error ? error.message : 'Unknown'));
    }
  };

  return (
    <>
      <style>{sidebarStyles}</style>
      <div className="sidebar-container">
        <div className="sidebar-header">
          <h2 className="sidebar-title">Create Parser Config</h2>
          <button className="close-btn" onClick={onClose} type="button">×</button>
        </div>
        <div className="sidebar-content">
          <div className="info-box">
            <p className="info-text"><strong>Tip:</strong> Click "Pick" then click an element. For arrays, one click selects all similar!</p>
          </div>
          <div className="form-group">
            <label className="form-label">Config Name <span style={{ color: '#ef4444' }}>*</span></label>
            <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., MangaReader Parser" />
          </div>
          <div className="form-group">
            <label className="form-label">Site URL (auto-filled)</label>
            <input className="form-input" value={targetUrl} disabled />
          </div>
          <h3 className="section-title">Fields</h3>
          {fields.map((field) => (
            <DynamicField key={field.id} field={field}
              onChange={(updates) => setFields(prev => prev.map(f => f.id === field.id ? { ...f, ...updates } : f))}
              onRemove={() => setFields(prev => prev.filter(f => f.id !== field.id))}
              onStartPick={async () => {
                setFields(prev => prev.map(f => ({ ...f, isPicking: f.id === field.id })));
                await eventBus.publish(ParserEventFactory.createElementPickRequest(field.id, field.type));
              }}
            />
          ))}
          <button className="btn btn-add" onClick={() => setFields([...fields, {
            id: crypto.randomUUID(), name: '', key: '', type: 'string', selector: '',
            required: false, isPicking: false, validation: null
          }])} type="button">+ Add Custom Field</button>
        </div>
        <div className="sidebar-footer">
          <button className="btn btn-footer btn-secondary" onClick={onClose} type="button">Cancel</button>
          <button className="btn btn-footer btn-primary" onClick={handleSave} type="button">Save Config</button>
        </div>
      </div>
    </>
  );
}

export function mountSidebar() {
  const existingRoot = document.getElementById('parser-config-builder-sidebar-root');
  if (existingRoot) return;
  const container = document.createElement('div');
  container.id = 'parser-config-builder-sidebar-root';
  container.style.cssText = 'all: initial; position: fixed; top: 0; right: 0; z-index: 2147483647;';
  const shadowRoot = container.attachShadow({ mode: 'open' });
  const innerContainer = document.createElement('div');
  shadowRoot.appendChild(innerContainer);
  document.body.appendChild(container);
  const currentUrl = window.location.origin;
  const siteName = document.title.split('-')[0]?.trim() || new URL(currentUrl).hostname;
  const root = createRoot(innerContainer);
  root.render(<Sidebar onClose={() => { root.unmount(); container.remove(); }} initialUrl={currentUrl} initialName={`${siteName} Parser`} />);
}

export function isSidebarOpen(): boolean {
  return !!document.getElementById('parser-config-builder-sidebar-root');
}
