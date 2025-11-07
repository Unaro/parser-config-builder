/**
 * Sidebar v3.4 - Show/Hide Toggle
 * @module content/Sidebar
 */

import { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { eventBus } from '@lib/events/event-bus';
import { ParserEventFactory } from '@lib/events/parser.events';
import { browser } from '@lib/utils/browser-api';
import { parserService } from '@lib/parser/parser.service';
import { extractPattern, suggestPatterns, matchesPattern } from '@lib/utils/url-pattern-matcher';
import { searchPresets } from '@lib/constants/field-presets';
import { highlightElements, clearPreview } from '@lib/utils/visual-preview';
import { CustomObjectTypeBuilder } from '@components/features/CustomObjectTypeBuilder';
import { ConfigSelector } from '@components/features/ConfigSelector';
import type { CustomField, FieldType, PageConfig, CustomObjectType, ParserConfig, LoadStrategy } from '@lib/types/parser.types';
import type { ElementPickedEvent, ElementPickCancelledEvent } from '@lib/events/parser.events';

interface SidebarProps {
  onClose: () => void;
  initialUrl: string;
  initialName: string;
}

const styles = `
  .sidebar { font-family: system-ui, sans-serif; position: fixed; top: 0; right: 0; width: 560px; height: 100vh; background: white; box-shadow: -4px 0 12px rgba(0,0,0,0.15); z-index: 2147483647; display: flex; flex-direction: column; transition: opacity 0.2s; }
  .sidebar.hidden { opacity: 0; pointer-events: none; }
  .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; }
  .title { font-size: 18px; font-weight: 600; }
  .close { background: rgba(255,255,255,0.2); border: none; color: white; font-size: 28px; width: 32px; height: 32px; border-radius: 6px; cursor: pointer; }
  .content { flex: 1; overflow-y: auto; padding: 20px; }
  .info { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px; margin-bottom: 20px; font-size: 13px; color: #1e40af; }
  .group { margin-bottom: 16px; position: relative; }
  .label { display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 6px; }
  .input { width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; }
  .input:focus { outline: none; border-color: #667eea; }
  .select { width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; background: white; font-size: 14px; }
  .row { display: flex; gap: 8px; }
  .btn { padding: 10px 16px; border: none; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; white-space: nowrap; transition: all 0.2s; }
  .btn-pick { background: #667eea; color: white; height: 40px; }
  .btn-pick:hover { background: #5568d3; }
  .btn-pick.active { background: #10b981; animation: pulse 1.5s infinite; }
  .btn-preview { background: #06b6d4; color: white; height: 40px; min-width: 70px; }
  .btn-preview:hover { background: #0891b2; }
  .btn-preview.active { background: #f59e0b; }
  .btn-preview.active:hover { background: #d97706; }
  .btn-remove { background: #ef4444; color: white; height: 40px; width: 40px; }
  .btn-add { background: #10b981; color: white; width: 100%; margin-top: 12px; padding: 12px; }
  .btn-delete-page { background: #dc2626; color: white; padding: 8px 12px; border-radius: 6px; border: none; cursor: pointer; font-size: 13px; }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
  .validation { margin-top: 6px; padding: 8px; border-radius: 4px; font-size: 12px; background: #d1fae5; color: #065f46; }
  .card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; margin-bottom: 12px; }
  .page-card { background: #faf5ff; border: 2px solid #e9d5ff; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
  .tabs { display: flex; gap: 8px; margin-bottom: 16px; border-bottom: 2px solid #e5e7eb; overflow-x: auto; }
  .tab { padding: 8px 16px; border: none; background: none; cursor: pointer; font-size: 14px; color: #6b7280; border-bottom: 2px solid transparent; margin-bottom: -2px; }
  .tab.active { color: #667eea; border-bottom-color: #667eea; }
  .footer { padding: 16px 20px; border-top: 1px solid #e5e7eb; display: flex; gap: 12px; }
  .btn-footer { flex: 1; padding: 12px; border: none; border-radius: 6px; font-weight: 500; cursor: pointer; }
  .btn-primary { background: #667eea; color: white; }
  .btn-secondary { background: #f3f4f6; color: #374151; }
  .preset-dropdown { position: absolute; background: white; border: 2px solid #667eea; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); max-height: 250px; overflow-y: auto; z-index: 1000; width: 100%; margin-top: 4px; }
  .preset-item { padding: 10px; cursor: pointer; border-bottom: 1px solid #e5e7eb; }
  .preset-item:hover { background: #f0f4ff; }
  .preset-badge { padding: 2px 6px; background: #e0e7ff; color: #3730a3; border-radius: 3px; font-size: 10px; margin-left: 6px; }
  .picking-hint { background: #fef3c7; border: 1px solid #fde68a; border-radius: 6px; padding: 10px; margin-bottom: 16px; font-size: 13px; color: #78350f; text-align: center; font-weight: 500; }
  .object-type-item { background: white; padding: 10px; margin-bottom: 8px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #e5e7eb; }
  .object-type-name { font-weight: 600; font-size: 13px; }
  .object-type-meta { font-size: 11px; color: #6b7280; }
  .btn-icon { background: #ef4444; color: white; border: none; width: 28px; height: 28px; border-radius: 4px; cursor: pointer; font-size: 16px; }
  .strategy-box { background: #f0fdf4; border: 1px solid #86efac; border-radius: 6px; padding: 12px; margin-bottom: 16px; }
`;

interface FieldState extends CustomField {
  isPicking: boolean;
  validation: { status: string; count: number; arrayPreview?: string[] } | null;
  isHighlighted?: boolean;
}

interface PageState extends Omit<PageConfig, 'fields' | 'customObjectTypes'> {
  fields: FieldState[];
  customObjectTypes: CustomObjectType[];
  isPickingLoadStrategy?: boolean;
}

function DynamicField({ field, page, onChange, onRemove, onPick }: {
  field: FieldState;
  page: PageState;
  onChange: (u: Partial<FieldState>) => void;
  onRemove: () => void;
  onPick: () => void;
}) {
  const [showPresets, setShowPresets] = useState(false);

  const handleTogglePreview = () => {
    if (!field.selector) return;
    
    if (field.isHighlighted) {
      // Скрываем
      clearPreview();
      onChange({ isHighlighted: false, validation: null });
    } else {
      // Показываем
      clearPreview(); // Очищаем все предыдущие
      const count = highlightElements(field.selector, '#06b6d4');
      const validation = parserService.validateSelector(document, field.selector, field.type);
      onChange({ 
        isHighlighted: true,
        validation: { 
          status: validation.isValid ? 'valid' : 'invalid', 
          count, 
          arrayPreview: validation.arrayPreview 
        } 
      });
    }
  };

  return (
    <div className="card">
      <div className="group">
        <label className="label">Name</label>
        <input className="input" value={field.name} onChange={(e) => { onChange({ name: e.target.value, key: e.target.value.toLowerCase().replace(/\s+/g, '_') }); setShowPresets(e.target.value.length > 0); }} onFocus={() => setShowPresets(field.name.length > 0)} onBlur={() => setTimeout(() => setShowPresets(false), 200)} placeholder="Type to search..." />
        {showPresets && (
          <div className="preset-dropdown">
            {searchPresets(field.name).slice(0, 5).map((p) => (
              <div key={p.key} className="preset-item" onClick={() => { onChange({ name: p.name, key: p.key, type: p.type === 'custom-object' && page.customObjectTypes.length === 0 ? 'string' : p.type }); setShowPresets(false); }}>
                <strong>{p.name}</strong><span className="preset-badge">{p.type}</span>
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{p.description}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="group">
        <label className="label">Type</label>
        <select className="select" value={field.type} onChange={(e) => onChange({ type: e.target.value as FieldType })}>
          <option value="string">String</option>
          <option value="array">Array</option>
          <option value="image">Image</option>
          <option value="url">URL</option>
          <option value="number">Number</option>
          <option value="custom-object">Custom Object</option>
        </select>
      </div>
      {field.type === 'custom-object' && page.customObjectTypes.length > 0 && (
        <div className="group">
          <select className="select" value={field.customObjectTypeId || ''} onChange={(e) => onChange({ customObjectTypeId: e.target.value })}>
            <option value="">Select type...</option>
            {page.customObjectTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      )}
      <div className="group">
        <label className="label">Selector</label>
        <div className="row">
          <input className="input" value={field.selector} onChange={(e) => onChange({ selector: e.target.value })} style={{ flex: 1 }} />
          <button className={`btn btn-pick ${field.isPicking ? 'active' : ''}`} onClick={onPick} type="button">
            {field.isPicking ? 'Picking...' : 'Pick'}
          </button>
          {field.selector && (
            <button 
              className={`btn btn-preview ${field.isHighlighted ? 'active' : ''}`} 
              onClick={handleTogglePreview} 
              type="button"
            >
              {field.isHighlighted ? 'Hide' : 'Show'}
            </button>
          )}
          <button className="btn btn-remove" onClick={onRemove} type="button">×</button>
        </div>
        {field.validation && (
          <div className="validation">
            {field.isHighlighted ? 'Highlighted' : 'Found'}: {field.validation.count} element(s)
          </div>
        )}
      </div>
    </div>
  );
}

function PageEditor({ page, onChange, onDelete, currentUrl }: { 
  page: PageState; 
  onChange: (u: Partial<PageState>) => void; 
  onDelete: () => void;
  currentUrl: string; 
}) {
  const [showSugg, setShowSugg] = useState(false);
  const [editingObjType, setEditingObjType] = useState(false);

  const handleDeleteObjectType = (typeId: string) => {
    if (!confirm('Delete this object type?')) return;
    onChange({ 
      customObjectTypes: page.customObjectTypes.filter(t => t.id !== typeId),
      fields: page.fields.map(f => f.customObjectTypeId === typeId ? { ...f, customObjectTypeId: undefined } : f)
    });
  };

  const handlePickLoadStrategy = async () => {
    onChange({ isPickingLoadStrategy: true });
    await eventBus.publish(ParserEventFactory.createElementPickRequest('load-strategy-picker', 'string'));
  };

  return (
    <div className="page-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <input className="input" value={page.name} onChange={(e) => onChange({ name: e.target.value })} style={{ background: 'transparent', border: 'none', fontSize: '16px', fontWeight: 600, color: '#6b21a8', padding: 0, flex: 1 }} />
        <button className="btn-delete-page" onClick={onDelete} type="button">Delete</button>
      </div>

      <div className="group">
        <label className="label">URL Pattern</label>
        <input className="input" value={page.urlPattern} onChange={(e) => onChange({ urlPattern: e.target.value })} />
        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Matches: {matchesPattern(currentUrl, page.urlPattern) ? '✅ YES' : '❌ NO'}</div>
        {!showSugg && <button className="btn btn-pick" onClick={() => setShowSugg(true)} type="button" style={{ marginTop: '8px', width: '100%', height: 'auto', padding: '8px' }}>Suggestions</button>}
        {showSugg && (
          <div style={{ background: '#fef3c7', padding: '10px', marginTop: '8px', borderRadius: '6px' }}>
            {suggestPatterns(currentUrl).map((p, i) => <button key={i} onClick={() => { onChange({ urlPattern: p }); setShowSugg(false); }} type="button" style={{ display: 'block', width: '100%', padding: '6px', margin: '4px 0', background: 'white', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', textAlign: 'left' }}><code>{p}</code></button>)}
          </div>
        )}
      </div>

      <div className="strategy-box">
        <label className="label">Load Strategy</label>
        <select className="select" value={page.loadStrategy.type} onChange={(e) => onChange({ loadStrategy: { ...page.loadStrategy, type: e.target.value as LoadStrategy }})}>
          <option value="static">Static</option>
          <option value="pagination">Pagination</option>
          <option value="infinite-scroll">Infinite Scroll</option>
          <option value="click-load">Click to Load</option>
          <option value="tab-switch">Tab Switch</option>
          <option value="ajax-wait">AJAX Wait</option>
        </select>
        {page.loadStrategy.type !== 'static' && (
          <div style={{ marginTop: '8px' }}>
            <div className="row">
              <input 
                className="input" 
                placeholder="Button/trigger selector" 
                value={page.loadStrategy.selector || ''} 
                onChange={(e) => onChange({ loadStrategy: { ...page.loadStrategy, selector: e.target.value }})}
                style={{ flex: 1, fontSize: '13px' }}
              />
              <button 
                className={`btn btn-pick ${page.isPickingLoadStrategy ? 'active' : ''}`}
                onClick={handlePickLoadStrategy}
                type="button"
              >
                {page.isPickingLoadStrategy ? 'Picking...' : 'Pick'}
              </button>
            </div>
            <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
              {page.loadStrategy.type === 'pagination' && 'Select "Next" button'}
              {page.loadStrategy.type === 'click-load' && 'Select "Load More" button'}
              {page.loadStrategy.type === 'tab-switch' && 'Select tab elements'}
            </div>
          </div>
        )}
      </div>

      <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '6px', padding: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600 }}>Object Types ({page.customObjectTypes.length})</div>
        </div>
        {page.customObjectTypes.map((t) => (
          <div key={t.id} className="object-type-item">
            <div>
              <div className="object-type-name">{t.name}</div>
              <div className="object-type-meta">{t.fields.length} fields - {t.containerSelector}</div>
            </div>
            <button className="btn-icon" onClick={() => handleDeleteObjectType(t.id)} type="button">×</button>
          </div>
        ))}
        <button className="btn btn-add" onClick={() => setEditingObjType(true)} type="button">+ Create Type</button>
      </div>

      <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>Fields ({page.fields.length})</div>
      {page.fields.map((f) => <DynamicField key={f.id} field={f} page={page} onChange={(u) => onChange({ fields: page.fields.map(field => field.id === f.id ? { ...field, ...u } : field) })} onRemove={() => { if (f.isHighlighted) clearPreview(); onChange({ fields: page.fields.filter(field => field.id !== f.id) }); }} onPick={async () => { onChange({ fields: page.fields.map(field => ({ ...field, isPicking: field.id === f.id })) }); await eventBus.publish(ParserEventFactory.createElementPickRequest(f.id, f.type)); }} />)}
      <button className="btn btn-add" onClick={() => onChange({ fields: [...page.fields, { id: crypto.randomUUID(), name: '', key: '', type: 'string', selector: '', required: false, isPicking: false, validation: null, isHighlighted: false }] })} type="button">+ Add Field</button>
      
      {editingObjType && <CustomObjectTypeBuilder onSave={(t) => { onChange({ customObjectTypes: [...page.customObjectTypes, t] }); setEditingObjType(false); }} onCancel={() => setEditingObjType(false)} />}
    </div>
  );
}

function Sidebar({ onClose, initialUrl, initialName }: SidebarProps) {
  const [showSelector, setShowSelector] = useState(true);
  const [existingConfig, setExistingConfig] = useState<ParserConfig | null>(null);
  const [name, setName] = useState(initialName);
  const [targetUrl] = useState(initialUrl);
  const [currentTab, setCurrentTab] = useState(0);
  const currentFullUrl = window.location.href;
  const [pages, setPages] = useState<PageState[]>([]);
  const [isVisible, setIsVisible] = useState(true);

  const handleConfigSelected = (config: ParserConfig | null) => {
    setShowSelector(false);
    if (config) {
      setExistingConfig(config);
      setName(config.name);
      setPages(config.pages.map(p => ({ 
        ...p, 
        fields: p.fields.map(f => ({ ...f, isPicking: false, validation: null, isHighlighted: false })), 
        customObjectTypes: [...(p.customObjectTypes || [])],
        isPickingLoadStrategy: false
      })));
    } else {
      setPages([{ 
        id: crypto.randomUUID(), 
        name: 'Main Page', 
        urlPattern: extractPattern(currentFullUrl), 
        loadStrategy: { type: 'static' }, 
        fields: [], 
        customObjectTypes: [],
        isPickingLoadStrategy: false
      }]);
    }
  };

  const handleDeletePage = () => {
    if (pages.length === 1) { alert('Cannot delete last page'); return; }
    if (!confirm(`Delete page "${pages[currentTab]?.name}"?`)) return;
    clearPreview();
    setPages(prev => prev.filter((_, i) => i !== currentTab));
    setCurrentTab(Math.max(0, currentTab - 1));
  };

  useEffect(() => {
    const up = eventBus.subscribe<ElementPickedEvent['data']>('element.picked', (e) => {
      if (e.data.fieldId === 'load-strategy-picker') {
        setPages(prev => prev.map((p, i) => i === currentTab ? { 
          ...p, 
          loadStrategy: { ...p.loadStrategy, selector: e.data.selector },
          isPickingLoadStrategy: false
        } : p));
      } else {
        setPages(prev => prev.map(p => ({ 
          ...p, 
          fields: p.fields.map(f => f.id === e.data.fieldId ? { 
            ...f, 
            selector: e.data.selector, 
            isPicking: false, 
            validation: { status: 'valid', count: e.data.elementCount, arrayPreview: e.data.arrayPreview },
            isHighlighted: false
          } : f) 
        })));
      }
      setIsVisible(true); 
    });
    
    const uc = eventBus.subscribe<ElementPickCancelledEvent['data']>('element.pick.cancelled', (e) => {
      if (e.data.fieldId === 'load-strategy-picker') {
        setPages(prev => prev.map((p, i) => i === currentTab ? { ...p, isPickingLoadStrategy: false } : p));
      } else {
        setPages(prev => prev.map(p => ({ 
          ...p, 
          fields: p.fields.map(f => f.id === e.data.fieldId ? { ...f, isPicking: false } : f) 
        })));
      }
      setIsVisible(true); 
    });
    
    return () => { up(); uc(); };
  }, [currentTab]);

  useEffect(() => {
    const anyPicking = pages.some(p => p.fields.some(f => f.isPicking) || p.isPickingLoadStrategy);
    if (anyPicking) setIsVisible(false);
  }, [pages]);

  const handleSave = async () => {
    if (!name) { alert('Enter name'); return; }
    
    clearPreview();
    
    const config = { 
      id: existingConfig?.id || crypto.randomUUID(), 
      name, 
      version: '1.0.0', 
      targetUrl, 
      pages: pages.map(({ id, name, urlPattern, loadStrategy, fields, customObjectTypes }) => ({ 
        id, 
        name, 
        urlPattern, 
        loadStrategy, 
        customObjectTypes, 
        fields: fields.map(({ id, name, key, type, selector, required, customObjectTypeId }) => 
          ({ id, name, key, type, selector, required, customObjectTypeId })
        ) 
      })), 
      metadata: { created: new Date(), updated: new Date(), author: 'user', tags: [], siteUrl: targetUrl }
    };
    try {
      const r = await browser.runtime.sendMessage({ type: existingConfig ? 'CONFIG_UPDATED' : 'CONFIG_CREATED', config }) as { success: boolean };
      if (r?.success) { alert('Saved!'); onClose(); }
    } catch { alert('Error'); }
  };

  const handleClose = () => {
    clearPreview();
    onClose();
  };

  if (showSelector) return <ConfigSelector currentUrl={currentFullUrl} onSelect={handleConfigSelected} onCancel={handleClose} />;

  return (
    <>
      <style>{styles}</style>
      <div className={`sidebar ${!isVisible ? 'hidden' : ''}`}>
        <div className="header">
          <h2 className="title">{existingConfig ? 'Edit' : 'Create'} Config</h2>
          <button className="close" onClick={handleClose} type="button">×</button>
        </div>
        
        <div className="content">
          {pages.some(p => p.fields.some(f => f.isPicking) || p.isPickingLoadStrategy) && (
            <div className="picking-hint">Click element on page (ESC to cancel)</div>
          )}
          <div className="info"><strong>v3.4:</strong> Show/Hide toggle for visual preview!</div>
          <div className="group"><label className="label">Config Name</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div style={{ marginTop: '20px' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Pages ({pages.length})</div>
            <div className="tabs">
              {pages.map((p, i) => <button key={p.id} className={`tab ${currentTab === i ? 'active' : ''}`} onClick={() => setCurrentTab(i)} type="button">{p.name}</button>)}
              <button className="tab" onClick={() => { setPages([...pages, { id: crypto.randomUUID(), name: 'New Page', urlPattern: extractPattern(currentFullUrl), loadStrategy: { type: 'static' }, fields: [], customObjectTypes: [], isPickingLoadStrategy: false }]); setCurrentTab(pages.length); }} type="button" style={{ color: '#10b981' }}>+ Page</button>
            </div>
            {pages[currentTab] && <PageEditor page={pages[currentTab]} currentUrl={currentFullUrl} onChange={(u) => setPages(prev => prev.map((p, i) => i === currentTab ? { ...p, ...u } : p))} onDelete={handleDeletePage} />}
          </div>
        </div>
        <div className="footer">
          <button className="btn btn-footer btn-secondary" onClick={handleClose} type="button">Cancel</button>
          <button className="btn btn-footer btn-primary" onClick={handleSave} type="button">Save</button>
        </div>
      </div>
    </>
  );
}

export function mountSidebar() {
  const r = document.getElementById('parser-config-builder-sidebar-root');
  if (r) return;
  const c = document.createElement('div');
  c.id = 'parser-config-builder-sidebar-root';
  c.style.cssText = 'all: initial; position: fixed; top: 0; right: 0; z-index: 2147483647;';
  const s = c.attachShadow({ mode: 'open' });
  const i = document.createElement('div');
  s.appendChild(i);
  document.body.appendChild(c);
  const url = window.location.origin;
  const name = document.title.split('-')[0]?.trim() || new URL(url).hostname;
  const root = createRoot(i);
  root.render(<Sidebar onClose={() => { root.unmount(); c.remove(); clearPreview(); }} initialUrl={url} initialName={`${name} Parser`} />);
}

export function isSidebarOpen(): boolean {
  return !!document.getElementById('parser-config-builder-sidebar-root');
}
