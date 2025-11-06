/**
 * Multi-Page Sidebar с умным URL matching
 * @module content/Sidebar
 * @version 2.0.0
 */

import { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { eventBus } from '@lib/events/event-bus';
import { ParserEventFactory } from '@lib/events/parser.events';
import { browser } from '@lib/utils/browser-api';
import { extractPattern, suggestPatterns, matchesPattern, describePattern } from '@lib/utils/url-pattern-matcher';
import type { CustomField, FieldType, PageConfig, LoadStrategy } from '@lib/types/parser.types';
import type { ElementPickedEvent, ElementPickCancelledEvent } from '@lib/events/parser.events';

interface SidebarProps {
  onClose: () => void;
  initialUrl: string;
  initialName: string;
}

const styles = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  .sidebar { font-family: -apple-system, system-ui, sans-serif; position: fixed; top: 0; right: 0; width: 500px; height: 100vh; background: white; box-shadow: -4px 0 12px rgba(0,0,0,0.15); z-index: 2147483647; display: flex; flex-direction: column; }
  .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; }
  .title { font-size: 18px; font-weight: 600; }
  .close { background: rgba(255,255,255,0.2); border: none; color: white; font-size: 28px; width: 32px; height: 32px; border-radius: 6px; cursor: pointer; line-height: 1; transition: background 0.2s; }
  .close:hover { background: rgba(255,255,255,0.3); }
  .content { flex: 1; overflow-y: auto; padding: 20px; }
  .info { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px; margin-bottom: 20px; font-size: 13px; color: #1e40af; line-height: 1.5; }
  .group { margin-bottom: 16px; }
  .label { display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 6px; }
  .input { width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; font-family: inherit; }
  .input:focus { outline: none; border-color: #667eea; box-shadow: 0 0 0 3px rgba(102,126,234,0.1); }
  .input:disabled { background: #f3f4f6; }
  .select { width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; background: white; cursor: pointer; }
  .row { display: flex; gap: 8px; align-items: flex-end; }
  .row-input { flex: 1; }
  .btn { padding: 10px 16px; border: none; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; transition: 0.2s; }
  .btn-pick { background: #667eea; color: white; height: 40px; white-space: nowrap; }
  .btn-pick:hover { background: #5568d3; }
  .btn-pick.active { background: #10b981; animation: pulse 1.5s infinite; }
  .btn-remove { background: #ef4444; color: white; height: 40px; width: 40px; }
  .btn-remove:hover { background: #dc2626; }
  .btn-add { background: #10b981; color: white; width: 100%; margin-top: 12px; }
  .btn-add:hover { background: #059669; }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
  .validation { margin-top: 6px; padding: 8px; border-radius: 4px; font-size: 12px; }
  .valid { background: #d1fae5; color: #065f46; }
  .invalid { background: #fee2e2; color: #991b1b; }
  .preview { color: #6b7280; font-size: 11px; margin-top: 4px; }
  .section { margin-top: 20px; padding-top: 16px; border-top: 1px solid #e5e7eb; }
  .section-title { font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 12px; }
  .card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; margin-bottom: 12px; }
  .page-card { background: #faf5ff; border: 2px solid #e9d5ff; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
  .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
  .page-title { font-size: 16px; font-weight: 600; color: #6b21a8; }
  .tabs { display: flex; gap: 8px; margin-bottom: 16px; border-bottom: 2px solid #e5e7eb; overflow-x: auto; }
  .tab { padding: 8px 16px; border: none; background: none; cursor: pointer; font-size: 14px; font-weight: 500; color: #6b7280; border-bottom: 2px solid transparent; margin-bottom: -2px; transition: 0.2s; white-space: nowrap; }
  .tab:hover { color: #374151; }
  .tab.active { color: #667eea; border-bottom-color: #667eea; }
  .footer { padding: 16px 20px; border-top: 1px solid #e5e7eb; display: flex; gap: 12px; background: white; }
  .btn-footer { flex: 1; padding: 12px; border: none; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; }
  .btn-primary { background: #667eea; color: white; }
  .btn-primary:hover { background: #5568d3; }
  .btn-secondary { background: #f3f4f6; color: #374151; }
  .btn-secondary:hover { background: #e5e7eb; }
  .pattern-suggestions { background: #fef3c7; border: 1px solid #fde68a; border-radius: 6px; padding: 10px; margin-top: 8px; }
  .pattern-option { display: block; padding: 6px 8px; margin: 4px 0; background: white; border: 1px solid #d1d5db; border-radius: 4px; cursor: pointer; font-size: 12px; transition: 0.2s; }
  .pattern-option:hover { border-color: #667eea; background: #f0f4ff; }
  .pattern-desc { color: #78716c; font-size: 11px; margin-top: 2px; }
  .helper-text { font-size: 12px; color: #6b7280; margin-top: 4px; }
`;

interface FieldState extends CustomField {
  isPicking: boolean;
  validation: { status: string; count: number; preview?: string; arrayPreview?: string[] } | null;
}

interface PageState extends Omit<PageConfig, 'fields'> {
  fields: FieldState[];
}

function DynamicField({ field, onChange, onRemove, onPick }: {
  field: FieldState;
  onChange: (updates: Partial<FieldState>) => void;
  onRemove: () => void;
  onPick: () => void;
}) {
  return (
    <div className="card">
      <div className="group">
        <label className="label">Name {field.required && <span style={{ color: '#ef4444' }}>*</span>}</label>
        <input className="input" value={field.name} onChange={(e) => onChange({ name: e.target.value, key: e.target.value.toLowerCase().replace(/\s+/g, '_') })} placeholder="e.g., Title, Genres" />
      </div>
      <div className="group">
        <label className="label">Type</label>
        <select className="select" value={field.type} onChange={(e) => onChange({ type: e.target.value as FieldType })}>
          <option value="string">Single Text</option>
          <option value="array">Array (auto-detect all)</option>
          <option value="image">Image URL</option>
          <option value="url">Link URL</option>
          <option value="number">Number</option>
          <option value="object">Complex Object</option>
        </select>
      </div>
      <div className="group">
        <label className="label">Selector</label>
        <div className="row">
          <div className="row-input">
            <input className="input" value={field.selector} onChange={(e) => onChange({ selector: e.target.value })} placeholder="Click Pick" />
          </div>
          <button className={`btn btn-pick ${field.isPicking ? 'active' : ''}`} onClick={onPick} type="button">
            {field.isPicking ? 'Click...' : 'Pick'}
          </button>
          <button className="btn btn-remove" onClick={onRemove} type="button">×</button>
        </div>
        {field.validation && (
          <div className={`validation ${field.validation.status === 'valid' ? 'valid' : 'invalid'}`}>
            {field.validation.status === 'valid' ? (
              <>Found: {field.validation.count}
                {field.type === 'array' && field.validation.arrayPreview && <div className="preview">Preview: {field.validation.arrayPreview.join(', ')}</div>}
                {field.type !== 'array' && field.validation.preview && <div className="preview">"{field.validation.preview}"</div>}
              </>
            ) : <>Not found</>}
          </div>
        )}
      </div>
    </div>
  );
}

function PageEditor({ page, onChange, onRemove, currentUrl }: {
  page: PageState;
  onChange: (updates: Partial<PageState>) => void;
  onRemove: () => void;
  currentUrl: string;
}) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const patternSuggestions = suggestPatterns(currentUrl);

  const handleAddField = () => {
    onChange({ fields: [...page.fields, { id: crypto.randomUUID(), name: '', key: '', type: 'string', selector: '', required: false, isPicking: false, validation: null }] });
  };

  const handleSelectPattern = (pattern: string) => {
    onChange({ urlPattern: pattern });
    setShowSuggestions(false);
  };

  return (
    <div className="page-card">
      <div className="page-header">
        <input className="input page-title" value={page.name} onChange={(e) => onChange({ name: e.target.value })} placeholder="Page Name" style={{ background: 'transparent', border: 'none', padding: 0, fontSize: '16px', fontWeight: 600, color: '#6b21a8' }} />
        <button className="btn btn-remove" onClick={onRemove} type="button">×</button>
      </div>

      <div className="group">
        <label className="label">URL Pattern <span style={{ color: '#ef4444' }}>*</span></label>
        <input className="input" value={page.urlPattern} onChange={(e) => onChange({ urlPattern: e.target.value })} placeholder="/manga/*/chapters" />
        <div className="helper-text">Matches current page: {matchesPattern(currentUrl, page.urlPattern) ? 'YES' : 'NO'}</div>
        
        {!showSuggestions && <button className="btn btn-pick" onClick={() => setShowSuggestions(true)} type="button" style={{ marginTop: '8px', width: '100%', height: 'auto', padding: '8px' }}>Show Suggestions</button>}

        {showSuggestions && (
          <div className="pattern-suggestions">
            <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: '#92400e' }}>Suggested patterns:</div>
            {patternSuggestions.map((pattern, index) => (
              <button key={index} className="pattern-option" onClick={() => handleSelectPattern(pattern)} type="button">
                <code>{pattern}</code>
                <div className="pattern-desc">{describePattern(pattern)}</div>
              </button>
            ))}
            <button className="btn btn-secondary" onClick={() => setShowSuggestions(false)} type="button" style={{ marginTop: '8px', width: '100%', fontSize: '12px' }}>Close</button>
          </div>
        )}
      </div>

      <div className="group">
        <label className="label">Load Strategy</label>
        <select className="select" value={page.loadStrategy.type} onChange={(e) => onChange({ loadStrategy: { ...page.loadStrategy, type: e.target.value as LoadStrategy }})}>
          <option value="static">Static</option>
          <option value="pagination">Pagination</option>
          <option value="infinite-scroll">Infinite Scroll</option>
          <option value="click-load">Click Load More</option>
          <option value="tab-switch">Tab Switch</option>
          <option value="ajax-wait">AJAX Wait</option>
        </select>
      </div>

      {(page.loadStrategy.type === 'pagination' || page.loadStrategy.type === 'click-load' || page.loadStrategy.type === 'tab-switch') && (
        <div className="group">
          <label className="label">Button/Tab Selector</label>
          <input className="input" value={page.loadStrategy.selector || ''} onChange={(e) => onChange({ loadStrategy: { ...page.loadStrategy, selector: e.target.value }})} placeholder=".next-button" />
        </div>
      )}

      {page.loadStrategy.type === 'infinite-scroll' && (
        <div className="group">
          <label className="label">Scroll Distance (px)</label>
          <input className="input" type="number" value={page.loadStrategy.scrollDistance || 500} onChange={(e) => onChange({ loadStrategy: { ...page.loadStrategy, scrollDistance: parseInt(e.target.value) }})} />
        </div>
      )}

      <div className="section-title">Fields ({page.fields.length})</div>
      
      {page.fields.map((field) => (
        <DynamicField key={field.id} field={field}
          onChange={(updates) => onChange({ fields: page.fields.map(f => f.id === field.id ? { ...f, ...updates } : f) })}
          onRemove={() => onChange({ fields: page.fields.filter(f => f.id !== field.id) })}
          onPick={async () => {
            onChange({ fields: page.fields.map(f => ({ ...f, isPicking: f.id === field.id })) });
            await eventBus.publish(ParserEventFactory.createElementPickRequest(field.id, field.type));
          }}
        />
      ))}

      <button className="btn btn-add" onClick={handleAddField} type="button">+ Add Field</button>
    </div>
  );
}

function Sidebar({ onClose, initialUrl, initialName }: SidebarProps) {
  const [name, setName] = useState(initialName);
  const [targetUrl] = useState(initialUrl);
  const [currentTab, setCurrentTab] = useState<number>(0);
  const currentFullUrl = window.location.href;
  const [pages, setPages] = useState<PageState[]>([
    {
      id: crypto.randomUUID(),
      name: 'Main Page',
      urlPattern: extractPattern(currentFullUrl),
      loadStrategy: { type: 'static' },
      fields: [
        { id: crypto.randomUUID(), name: 'Title', key: 'title', type: 'string', selector: '', required: true, isPicking: false, validation: null }
      ]
    }
  ]);

  useEffect(() => {
    const unsubPicked = eventBus.subscribe<ElementPickedEvent['data']>('element.picked', (event) => {
      setPages(prev => prev.map(page => ({ ...page, fields: page.fields.map(f => f.id === event.data.fieldId ? { ...f, selector: event.data.selector, isPicking: false, validation: { status: 'valid', count: event.data.elementCount, preview: event.data.previewText, arrayPreview: event.data.arrayPreview }} : f) })));
    });

    const unsubCancelled = eventBus.subscribe<ElementPickCancelledEvent['data']>('element.pick.cancelled', (event) => {
      setPages(prev => prev.map(page => ({ ...page, fields: page.fields.map(f => f.id === event.data.fieldId ? { ...f, isPicking: false } : f) })));
    });

    return () => { unsubPicked(); unsubCancelled(); };
  }, []);

  const handleAddPage = () => {
    setPages([...pages, { id: crypto.randomUUID(), name: 'New Page', urlPattern: extractPattern(currentFullUrl), loadStrategy: { type: 'static' }, fields: [] }]);
    setCurrentTab(pages.length);
  };

  const handleSave = async () => {
    if (!name) { alert('Enter name'); return; }
    if (pages.some(p => !p.name || !p.urlPattern)) { alert('Fill page names and patterns'); return; }

    const config = {
      id: crypto.randomUUID(), name, version: '1.0.0', targetUrl,
      pages: pages.map(({ id, name, urlPattern, loadStrategy, fields, description }) => ({
        id, name, urlPattern, loadStrategy, description,
        fields: fields.map(({ id, name, key, type, selector, required, description }) => ({ id, name, key, type, selector, required, description }))
      })),
      metadata: { created: new Date(), updated: new Date(), author: 'user', tags: [], siteUrl: targetUrl }
    };

    try {
      const response = await browser.runtime.sendMessage({ type: 'CONFIG_CREATED', config }) as { success: boolean };
      if (response?.success) { alert('Saved!'); onClose(); } else { alert('Failed'); }
    } catch (error) {
      alert('Error: ' + (error instanceof Error ? error.message : 'Unknown'));
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="sidebar">
        <div className="header">
          <h2 className="title">Create Config</h2>
          <button className="close" onClick={onClose} type="button">×</button>
        </div>
        <div className="content">
          <div className="info"><strong>Smart Patterns:</strong> Use * for dynamic URL parts. Click suggestions for auto-generated patterns!</div>
          <div className="group">
            <label className="label">Config Name <span style={{ color: '#ef4444' }}>*</span></label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="MangaReader Parser" />
          </div>
          <div className="group">
            <label className="label">Base URL</label>
            <input className="input" value={targetUrl} disabled />
          </div>
          <div className="section">
            <div className="section-title">Pages ({pages.length})</div>
            <div className="tabs">
              {pages.map((page, index) => (
                <button key={page.id} className={`tab ${currentTab === index ? 'active' : ''}`} onClick={() => setCurrentTab(index)} type="button">
                  {page.name || `Page ${index + 1}`}
                </button>
              ))}
              <button className="tab" onClick={handleAddPage} type="button" style={{ color: '#10b981' }}>+ Page</button>
            </div>
            {pages[currentTab] && (
              <PageEditor page={pages[currentTab]} currentUrl={currentFullUrl}
                onChange={(updates) => setPages(prev => prev.map((p, i) => i === currentTab ? { ...p, ...updates } : p))}
                onRemove={() => {
                  if (pages.length === 1) { alert('Cannot remove last page'); return; }
                  setPages(prev => prev.filter((_, i) => i !== currentTab));
                  setCurrentTab(Math.max(0, currentTab - 1));
                }}
              />
            )}
          </div>
        </div>
        <div className="footer">
          <button className="btn btn-footer btn-secondary" onClick={onClose} type="button">Cancel</button>
          <button className="btn btn-footer btn-primary" onClick={handleSave} type="button">Save</button>
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
