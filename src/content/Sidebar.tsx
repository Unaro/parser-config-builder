/**
 * Sidebar v4.4 - Fixed Single Selector Hide
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
import { highlightField, clearFieldPreview, clearAllPreviews, getFieldColor } from '@lib/utils/visual-preview';
import { CustomObjectTypeBuilder } from '@components/features/CustomObjectTypeBuilder';
import { ConfigSelector } from '@components/features/ConfigSelector';
import { PreParseActionsEditor } from '@components/features/PreParseActionsEditor';
import type { CustomField, FieldType, PageConfig, CustomObjectType, ParserConfig, SubPage, FieldLoadStrategy, ArrayItemType } from '@lib/types/parser.types';
import type { ElementPickedEvent, ElementPickCancelledEvent } from '@lib/events/parser.events';

interface SidebarProps {
  onClose: () => void;
  initialUrl: string;
  initialName: string;
}

const styles = `
  .sidebar { font-family: system-ui, sans-serif; position: fixed; top: 0; right: 0; width: 600px; height: 100vh; background: white; box-shadow: -4px 0 12px rgba(0,0,0,0.15); z-index: 2147483647; display: flex; flex-direction: column; transition: opacity 0.2s; }
  .sidebar.hidden { opacity: 0; pointer-events: none; }
  .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; }
  .title { font-size: 18px; font-weight: 600; }
  .close { background: rgba(255,255,255,0.2); border: none; color: white; font-size: 28px; width: 32px; height: 32px; border-radius: 6px; cursor: pointer; }
  .content { flex: 1; overflow-y: auto; padding: 20px; }
  .info { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px; margin-bottom: 20px; font-size: 13px; color: #1e40af; }
  .section { margin-bottom: 20px; }
  .section-title { font-size: 14px; font-weight: 600; color: #111827; margin-bottom: 10px; display: flex; align-items: center; gap: 8px; }
  .badge { background: #e0e7ff; color: #4338ca; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
  .group { margin-bottom: 12px; position: relative; }
  .label { display: block; font-size: 13px; font-weight: 500; color: #374151; margin-bottom: 4px; }
  .input { width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; }
  .input:focus { outline: none; border-color: #667eea; }
  .select { width: 100%; padding: 8px 10px; border: 1px solid #d1d5db; border-radius: 6px; background: white; font-size: 13px; }
  .row { display: flex; gap: 8px; }
  .btn { padding: 10px 16px; border: none; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; white-space: nowrap; transition: all 0.2s; }
  .btn-pick { background: #667eea; color: white; height: 40px; }
  .btn-pick.active { background: #10b981; animation: pulse 1.5s infinite; }
  .btn-preview { color: white; height: 40px; min-width: 70px; }
  .btn-remove { background: #ef4444; color: white; height: 40px; width: 40px; }
  .btn-add { background: #10b981; color: white; width: 100%; padding: 10px; }
  .btn-sm { padding: 6px 12px; height: 32px; font-size: 12px; }
  .btn-add-selector { background: #0ea5e9; color: white; border: none; padding: 6px 10px; border-radius: 4px; font-size: 11px; cursor: pointer; margin-top: 6px; width: 100%; }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
  .validation { margin-top: 6px; padding: 8px; border-radius: 4px; font-size: 12px; }
  .card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; margin-bottom: 12px; border-left-width: 4px; }
  .load-config-box { background: #e0f2fe; border: 1px solid #7dd3fc; border-radius: 6px; padding: 10px; margin-top: 10px; }
  .load-config-title { font-size: 12px; font-weight: 600; color: #0c4a6e; margin-bottom: 8px; cursor: pointer; user-select: none; }
  .array-type-box { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 6px; padding: 10px; margin-top: 8px; }
  .selector-item { background: #f0f9ff; border: 1px solid #bae6fd; padding: 6px 8px; border-radius: 4px; margin-bottom: 4px; display: flex; justify-content: space-between; align-items: center; }
  .selector-text { font-family: monospace; font-size: 11px; color: #0c4a6e; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .selector-count { font-size: 10px; color: #0284c7; background: #e0f2fe; padding: 2px 6px; border-radius: 3px; margin-right: 4px; }
  .btn-remove-selector { background: #ef4444; color: white; border: none; width: 20px; height: 20px; border-radius: 3px; cursor: pointer; font-size: 12px; }
  .multi-selector-box { background: #ecfeff; border: 1px solid #67e8f9; border-radius: 6px; padding: 8px; margin-top: 6px; }
  .page-card { background: #faf5ff; border: 2px solid #e9d5ff; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
  .subpage-card { background: #f0f9ff; border: 2px solid #bae6fd; border-radius: 8px; padding: 14px; margin-bottom: 12px; }
  .tabs { display: flex; gap: 8px; margin-bottom: 16px; border-bottom: 2px solid #e5e7eb; overflow-x: auto; }
  .tab { padding: 8px 16px; border: none; background: none; cursor: pointer; font-size: 14px; color: #6b7280; border-bottom: 2px solid transparent; margin-bottom: -2px; }
  .tab.active { color: #667eea; border-bottom-color: #667eea; }
  .footer { padding: 16px 20px; border-top: 1px solid #e5e7eb; display: flex; gap: 12px; }
  .btn-footer { flex: 1; padding: 12px; }
  .btn-primary { background: #667eea; color: white; }
  .btn-secondary { background: #f3f4f6; color: #374151; }
  .preset-dropdown { position: absolute; background: white; border: 2px solid #667eea; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); max-height: 250px; overflow-y: auto; z-index: 1000; width: 100%; margin-top: 4px; }
  .preset-item { padding: 10px; cursor: pointer; border-bottom: 1px solid #e5e7eb; }
  .preset-item:hover { background: #f0f4ff; }
  .preset-badge { padding: 2px 6px; background: #e0e7ff; color: #3730a3; border-radius: 3px; font-size: 10px; margin-left: 6px; }
  .picking-hint { background: #fef3c7; border: 1px solid #fde68a; border-radius: 6px; padding: 10px; margin-bottom: 16px; font-size: 13px; color: #78350f; text-align: center; font-weight: 500; }
  .preview-toolbar { background: #fef3c7; border: 1px solid #fde68a; border-radius: 6px; padding: 10px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; }
  .color-indicator { width: 14px; height: 14px; border-radius: 3px; display: inline-block; margin-right: 6px; border: 2px solid white; box-shadow: 0 0 0 1px rgba(0,0,0,0.1); vertical-align: middle; }
  .collapsible { cursor: pointer; user-select: none; }
  .object-type-item { background: white; padding: 10px; margin-bottom: 8px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #e5e7eb; }
  .btn-icon { background: #ef4444; color: white; border: none; width: 28px; height: 28px; border-radius: 4px; cursor: pointer; font-size: 16px; }
`;

interface FieldState extends CustomField {
  isPicking: boolean;
  isPickingAddSelector?: boolean;
  isPickingLoadButton?: boolean;
  validation: { status: string; count: number; arrayPreview?: string[]; perSelector?: Array<{ selector: string; count: number }> } | null;
  isHighlighted?: boolean;
}

interface SubPageState extends Omit<SubPage, 'fields'> {
  fields: FieldState[];
}

interface PageState extends Omit<PageConfig, 'fields' | 'commonFields' | 'subPages' | 'customObjectTypes'> {
  commonFields: FieldState[];
  subPages: SubPageState[];
  customObjectTypes: CustomObjectType[];
  fields: FieldState[];
}

function FieldLoadConfigEditor({ field, onChange }: {
  field: FieldState;
  onChange: (u: Partial<FieldState>) => void;
}) {
  const [expanded, setExpanded] = useState(!!field.loadConfig && field.loadConfig.strategy !== 'none');
  const strategy = field.loadConfig?.strategy || 'none';

  const handleStrategyChange = (newStrategy: FieldLoadStrategy) => {
    if (newStrategy === 'none') {
      onChange({ loadConfig: undefined });
    } else {
      onChange({ 
        loadConfig: { 
          strategy: newStrategy,
          maxIterations: 5,
          waitAfterAction: 1000,
          stopWhenNoChange: true
        } 
      });
    }
  };

  const handlePickButton = async () => {
    onChange({ isPickingLoadButton: true });
    await eventBus.publish(ParserEventFactory.createElementPickRequest(`load-button-${field.id}`, 'string'));
  };

  return (
    <div className="load-config-box">
      <div className="load-config-title" onClick={() => setExpanded(!expanded)}>
        {expanded ? '▼' : '▶'} Load: {strategy}
      </div>
      
      {expanded && (
        <>
          <select 
            className="select" 
            value={strategy} 
            onChange={(e) => handleStrategyChange(e.target.value as FieldLoadStrategy)}
            style={{ marginBottom: '8px' }}
          >
            <option value="none">None</option>
            <option value="click-expand">Click Expand</option>
            <option value="infinite-scroll">Infinite Scroll</option>
            <option value="click-load-more">Click Load More</option>
            <option value="hover-expand">Hover</option>
          </select>

          {(strategy === 'click-expand' || strategy === 'click-load-more') && (
            <div className="row" style={{ marginBottom: '8px' }}>
              <input 
                className="input"
                style={{ flex: 1, fontSize: '12px', padding: '6px 8px' }}
                placeholder="Button"
                value={field.loadConfig?.buttonSelector || ''}
                onChange={(e) => onChange({ 
                  loadConfig: { ...field.loadConfig!, buttonSelector: e.target.value } 
                })}
              />
              <button 
                className={`btn btn-pick btn-sm ${field.isPickingLoadButton ? 'active' : ''}`}
                onClick={handlePickButton}
                type="button"
              >
                {field.isPickingLoadButton ? '...' : 'Pick'}
              </button>
            </div>
          )}

          <div className="row" style={{ fontSize: '12px', marginTop: '8px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '10px', color: '#6b7280' }}>Max</label>
              <input 
                type="number"
                className="input"
                style={{ padding: '4px 6px', fontSize: '12px' }}
                value={field.loadConfig?.maxIterations || 5}
                onChange={(e) => onChange({ 
                  loadConfig: { ...field.loadConfig!, maxIterations: parseInt(e.target.value) || 5 } 
                })}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '10px', color: '#6b7280' }}>Wait</label>
              <input 
                type="number"
                className="input"
                style={{ padding: '4px 6px', fontSize: '12px' }}
                value={field.loadConfig?.waitAfterAction || 1000}
                onChange={(e) => onChange({ 
                  loadConfig: { ...field.loadConfig!, waitAfterAction: parseInt(e.target.value) || 1000 } 
                })}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function DynamicField({ field, fieldIndex, page, onChange, onRemove, onPick, scope }: {
  field: FieldState;
  fieldIndex: number;
  page: PageState;
  onChange: (u: Partial<FieldState>) => void;
  onRemove: () => void;
  onPick: () => void;
  scope: 'common' | 'subpage';
}) {
  const [showPresets, setShowPresets] = useState(false);
  const [showMultiSelector, setShowMultiSelector] = useState(false);
  const fieldColor = getFieldColor(fieldIndex);

  const selectors = field.selectors && field.selectors.length > 0 ? field.selectors : [field.selector];
  const hasMultiple = selectors.length > 1 || showMultiSelector;

  const handleTogglePreview = () => {
    const allSelectors = field.selectors && field.selectors.length > 0 ? field.selectors : [field.selector];
    const hasAnySelector = allSelectors.some(s => s);
    
    if (!hasAnySelector) return;
    
    if (field.isHighlighted) {
      // ВСЕГДА очищаем с единым форматом: {fieldId}-sel-{index}
      allSelectors.forEach((sel, idx) => {
        if (sel) {
          clearFieldPreview(`${field.id}-sel-${idx}`);
        }
      });
      onChange({ isHighlighted: false, validation: null });
    } else {
      // ВСЕГДА подсвечиваем с единым форматом: {fieldId}-sel-{index}
      if (hasMultiple) {
        const validation = parserService.validateMultipleSelectors(document, allSelectors.filter(Boolean) as string[], field.type);
        
        allSelectors.forEach((sel, idx) => {
          if (sel) {
            highlightField(`${field.id}-sel-${idx}`, sel, fieldIndex);
          }
        });
        
        onChange({ 
          isHighlighted: true,
          validation: { 
            status: validation.isValid ? 'valid' : 'invalid', 
            count: validation.totalCount,
            perSelector: validation.perSelector,
            arrayPreview: validation.arrayPreview 
          } 
        });
      } else {
        // Единый формат даже для одного селектора!
        const count = highlightField(`${field.id}-sel-0`, field.selector, fieldIndex);
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
    }
  };

  const handleAddSelector = async () => {
    setShowMultiSelector(true);
    onChange({ isPickingAddSelector: true });
    await eventBus.publish(ParserEventFactory.createElementPickRequest(`${field.id}-add-selector`, field.type));
  };

  const handleRemoveSelector = (index: number) => {
    const newSelectors = selectors.filter((_, i) => i !== index);
    
    // Очищаем подсветку этого селектора
    if (field.isHighlighted) {
      clearFieldPreview(`${field.id}-sel-${index}`);
    }
    
    if (newSelectors.length === 1) {
      onChange({ selector: newSelectors[0], selectors: [] });
      setShowMultiSelector(false);
    } else {
      onChange({ selectors: newSelectors });
    }
  };

  return (
    <div className="card" style={{ borderLeftColor: fieldColor }}>
      <div className="group">
        <label className="label">
          <span className="color-indicator" style={{ background: fieldColor }}></span>
          Name
          {scope === 'common' && <span className="badge" style={{ marginLeft: '8px', background: '#dbeafe' }}>COMMON</span>}
        </label>
        <input className="input" value={field.name} onChange={(e) => { onChange({ name: e.target.value, key: e.target.value.toLowerCase().replace(/\s+/g, '_') }); setShowPresets(e.target.value.length > 0); }} onFocus={() => setShowPresets(field.name.length > 0)} onBlur={() => setTimeout(() => setShowPresets(false), 200)} placeholder="Type..." />
        {showPresets && (
          <div className="preset-dropdown">
            {searchPresets(field.name).slice(0, 5).map((p) => (
              <div key={p.key} className="preset-item" onClick={() => { onChange({ name: p.name, key: p.key, type: p.type === 'custom-object' ? 'string' : p.type }); setShowPresets(false); }}>
                <strong>{p.name}</strong><span className="preset-badge">{p.type}</span>
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

      {field.type === 'array' && (
        <div className="array-type-box">
          <label className="label" style={{ fontSize: '12px' }}>Item Type</label>
          <select 
            className="select" 
            value={field.arrayItemType || 'string'} 
            onChange={(e) => onChange({ arrayItemType: e.target.value as ArrayItemType })}
          >
            <option value="string">String</option>
            <option value="number">Number</option>
            <option value="image">Image</option>
            <option value="url">URL</option>
            {page.customObjectTypes.length > 0 && <option value="custom-object">Object</option>}
          </select>
          
          {field.arrayItemType === 'custom-object' && page.customObjectTypes.length > 0 && (
            <select 
              className="select" 
              style={{ marginTop: '6px' }}
              value={field.customObjectTypeId || ''} 
              onChange={(e) => onChange({ customObjectTypeId: e.target.value })}
            >
              <option value="">Select...</option>
              {page.customObjectTypes.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          )}
        </div>
      )}

      {field.type === 'custom-object' && (
        <div className="group">
          <label className="label">Object Type</label>
          {page.customObjectTypes.length > 0 ? (
            <select 
              className="select" 
              value={field.customObjectTypeId || ''} 
              onChange={(e) => onChange({ customObjectTypeId: e.target.value })}
            >
              <option value="">Select...</option>
              {page.customObjectTypes.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          ) : (
            <div style={{ fontSize: '12px', color: '#ef4444', padding: '6px', background: '#fee2e2', borderRadius: '4px' }}>
              Create type first!
            </div>
          )}
        </div>
      )}

      <div className="group">
        <label className="label">
          Selector{hasMultiple && 's'} {hasMultiple && <span className="badge">{selectors.length}</span>}
        </label>
        
        {!hasMultiple ? (
          <div className="row">
            <input className="input" value={field.selector} onChange={(e) => onChange({ selector: e.target.value })} style={{ flex: 1 }} />
            <button className={`btn btn-pick ${field.isPicking ? 'active' : ''}`} onClick={onPick} type="button">
              {field.isPicking ? '...' : 'Pick'}
            </button>
            {field.selector && (
              <button 
                className="btn btn-preview"
                style={{ background: field.isHighlighted ? '#f59e0b' : fieldColor }}
                onClick={handleTogglePreview} 
                type="button"
              >
                {field.isHighlighted ? 'Hide' : 'Show'}
              </button>
            )}
            <button className="btn btn-remove" onClick={onRemove} type="button">×</button>
          </div>
        ) : (
          <>
            <div className="multi-selector-box">
              {selectors.map((sel, idx) => (
                <div key={idx} className="selector-item">
                  <span className="selector-text">{sel}</span>
                  {field.validation?.perSelector && (
                    <span className="selector-count">{field.validation.perSelector[idx]?.count || 0}</span>
                  )}
                  <button className="btn-remove-selector" onClick={() => handleRemoveSelector(idx)} type="button">×</button>
                </div>
              ))}
            </div>
            <div className="row" style={{ marginTop: '6px' }}>
              {selectors.some(s => s) && (
                <button 
                  className="btn btn-preview"
                  style={{ background: field.isHighlighted ? '#f59e0b' : fieldColor, flex: 1 }}
                  onClick={handleTogglePreview} 
                  type="button"
                >
                  {field.isHighlighted ? 'Hide All' : 'Show All'}
                </button>
              )}
              <button className="btn btn-remove" onClick={onRemove} type="button">×</button>
            </div>
          </>
        )}
        
        {field.type === 'array' && (
          <button className="btn-add-selector" onClick={handleAddSelector} type="button">
            {field.isPickingAddSelector ? '⏳ Picking...' : '+ Add Selector'}
          </button>
        )}
        
        {field.validation && (
          <div className="validation" style={{ background: `${fieldColor}15`, border: `1px solid ${fieldColor}` }}>
            Total: {field.validation.count}
            {field.validation.perSelector && field.validation.perSelector.length > 1 && (
              <div style={{ fontSize: '10px', marginTop: '4px' }}>
                {field.validation.perSelector.map((ps, idx) => (
                  <div key={idx}>#{idx + 1}: {ps.count}</div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <FieldLoadConfigEditor field={field} onChange={onChange} />
      
      <PreParseActionsEditor 
        actions={field.preParseActions || []} 
        onChange={(actions) => onChange({ preParseActions: actions })}
        level="field"
      />
    </div>
  );
}

function SubPageEditor({ subPage, totalFieldsBefore, page, onChange, onDelete }: {
  subPage: SubPageState;
  totalFieldsBefore: number;
  page: PageState;
  onChange: (u: Partial<SubPageState>) => void;
  onDelete: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="subpage-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: collapsed ? 0 : '12px' }}>
        <div className="collapsible" onClick={() => setCollapsed(!collapsed)} style={{ flex: 1 }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#0c4a6e' }}>
            {collapsed ? '▶' : '▼'} {subPage.name} <span className="badge" style={{ background: '#bfdbfe' }}>{subPage.fields.length}</span>
          </span>
        </div>
        <button className="btn-icon" onClick={onDelete} type="button">×</button>
      </div>

      {!collapsed && (
        <>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Name</label>
            <input 
              style={{ width: '100%', padding: '6px 8px', border: '1px solid #bae6fd', borderRadius: '6px', fontSize: '13px' }}
              value={subPage.name} 
              onChange={(e) => onChange({ name: e.target.value })} 
            />
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>URL</label>
            <input 
              style={{ width: '100%', padding: '6px 8px', border: '1px solid #bae6fd', borderRadius: '6px', fontSize: '13px' }}
              value={subPage.urlPattern} 
              onChange={(e) => onChange({ urlPattern: e.target.value })} 
              placeholder="/chapters"
            />
          </div>

          <PreParseActionsEditor 
            actions={subPage.preParseActions || []} 
            onChange={(actions) => onChange({ preParseActions: actions })}
            level="subpage"
          />

          <div style={{ fontSize: '12px', fontWeight: 600, marginTop: '12px', marginBottom: '8px', color: '#0c4a6e' }}>
            Fields ({subPage.fields.length})
          </div>

          {subPage.fields.map((field, idx) => (
            <DynamicField 
              key={field.id} 
              field={field}
              fieldIndex={totalFieldsBefore + idx}
              page={page}
              onChange={(u) => onChange({ fields: subPage.fields.map(f => f.id === field.id ? { ...f, ...u } : f) })}
              onRemove={() => {
                if (field.isHighlighted) {
                  const sels = field.selectors && field.selectors.length > 0 ? field.selectors : [field.selector];
                  sels.forEach((s, i) => { if (s) clearFieldPreview(`${field.id}-sel-${i}`); });
                }
                onChange({ fields: subPage.fields.filter(f => f.id !== field.id) });
              }}
              onPick={async () => {
                onChange({ fields: subPage.fields.map(f => ({ ...f, isPicking: f.id === field.id })) });
                await eventBus.publish(ParserEventFactory.createElementPickRequest(field.id, field.type));
              }}
              scope="subpage"
            />
          ))}

          <button 
            className="btn btn-add"
            onClick={() => onChange({ 
              fields: [...subPage.fields, { 
                id: crypto.randomUUID(), 
                name: '', 
                key: '', 
                type: 'string', 
                selector: '', 
                required: false,
                isPicking: false,
                validation: null,
                isHighlighted: false
              }] 
            })}
            type="button"
          >
            + Field
          </button>
        </>
      )}
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

  const highlightedCount = page.commonFields.filter(f => f.isHighlighted).length + 
    page.subPages.reduce((acc, sp) => acc + sp.fields.filter(f => f.isHighlighted).length, 0);

  const totalCommonFields = page.commonFields.length;

  return (
    <div className="page-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <input className="input" value={page.name} onChange={(e) => onChange({ name: e.target.value })} style={{ background: 'transparent', border: 'none', fontSize: '16px', fontWeight: 600, color: '#6b21a8', padding: 0, flex: 1 }} />
        <button style={{ background: '#dc2626', color: 'white', padding: '6px 12px', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }} onClick={onDelete} type="button">×</button>
      </div>

      {highlightedCount > 0 && (
        <div className="preview-toolbar">
          <span style={{ fontSize: '13px', fontWeight: 500 }}>{highlightedCount}</span>
          <button style={{ background: '#f59e0b', color: 'white', padding: '6px 12px', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }} onClick={() => {
            clearAllPreviews();
            onChange({ 
              commonFields: page.commonFields.map(f => ({ ...f, isHighlighted: false })),
              subPages: page.subPages.map(sp => ({ ...sp, fields: sp.fields.map(f => ({ ...f, isHighlighted: false })) }))
            });
          }} type="button">Clear</button>
        </div>
      )}

      <div className="group">
        <label className="label">URL</label>
        <input className="input" value={page.urlPattern} onChange={(e) => onChange({ urlPattern: e.target.value })} style={{ fontSize: '13px' }} />
        <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
          {matchesPattern(currentUrl, page.urlPattern) ? '✅' : '❌'}
        </div>
        {!showSugg && <button className="btn btn-pick" onClick={() => setShowSugg(true)} type="button" style={{ marginTop: '6px', width: '100%', padding: '6px', fontSize: '12px' }}>Suggest</button>}
        {showSugg && (
          <div style={{ background: '#fef3c7', padding: '8px', marginTop: '6px', borderRadius: '6px' }}>
            {suggestPatterns(currentUrl).map((p, i) => <button key={i} onClick={() => { onChange({ urlPattern: p }); setShowSugg(false); }} type="button" style={{ display: 'block', width: '100%', padding: '4px', margin: '3px 0', background: 'white', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', textAlign: 'left' }}><code>{p}</code></button>)}
          </div>
        )}
      </div>

      <div className="group">
        <label className="label">Tab Selector</label>
        <input 
          className="input" 
          placeholder=".tabs-tab" 
          value={page.tabSelector || ''} 
          onChange={(e) => onChange({ tabSelector: e.target.value })}
          style={{ fontSize: '13px' }}
        />
      </div>

      <PreParseActionsEditor 
        actions={page.preParseActions || []} 
        onChange={(actions) => onChange({ preParseActions: actions })}
        level="page"
      />

      <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '6px', padding: '10px', marginBottom: '12px', marginTop: '12px' }}>
        <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>Types ({page.customObjectTypes.length})</div>
        {page.customObjectTypes.map((t) => (
          <div key={t.id} className="object-type-item">
            <div>
              <div style={{ fontWeight: 600, fontSize: '12px' }}>{t.name}</div>
              <div style={{ fontSize: '10px', color: '#6b7280' }}>{t.fields.length} fields</div>
            </div>
            <button className="btn-icon" onClick={() => onChange({ customObjectTypes: page.customObjectTypes.filter(ot => ot.id !== t.id) })} type="button">×</button>
          </div>
        ))}
        <button className="btn btn-add" onClick={() => setEditingObjType(true)} type="button" style={{ fontSize: '12px', padding: '8px' }}>+ Type</button>
      </div>

      <div className="section">
        <div className="section-title">
          Common <span className="badge">{page.commonFields.length}</span>
        </div>
        {page.commonFields.map((f, idx) => (
          <DynamicField 
            key={f.id} 
            field={f}
            fieldIndex={idx}
            page={page}
            onChange={(u) => onChange({ commonFields: page.commonFields.map(field => field.id === f.id ? { ...field, ...u } : field) })} 
            onRemove={() => { 
              if (f.isHighlighted) {
                const sels = f.selectors && f.selectors.length > 0 ? f.selectors : [f.selector];
                sels.forEach((s, i) => { if (s) clearFieldPreview(`${f.id}-sel-${i}`); });
              }
              onChange({ commonFields: page.commonFields.filter(field => field.id !== f.id) }); 
            }} 
            onPick={async () => { 
              onChange({ commonFields: page.commonFields.map(field => ({ ...field, isPicking: field.id === f.id })) }); 
              await eventBus.publish(ParserEventFactory.createElementPickRequest(f.id, f.type)); 
            }}
            scope="common"
          />
        ))}
        <button className="btn btn-add" onClick={() => onChange({ commonFields: [...page.commonFields, { id: crypto.randomUUID(), name: '', key: '', type: 'string', selector: '', required: false, isPicking: false, validation: null, isHighlighted: false }] })} type="button">+ Common</button>
      </div>

      <div className="section">
        <div className="section-title">
          SubPages <span className="badge">{page.subPages.length}</span>
        </div>
        {page.subPages.map((sp, spIdx) => (
          <SubPageEditor
            key={sp.id}
            subPage={sp}
            totalFieldsBefore={totalCommonFields + page.subPages.slice(0, spIdx).reduce((acc, s) => acc + s.fields.length, 0)}
            page={page}
            onChange={(u) => onChange({ subPages: page.subPages.map(s => s.id === sp.id ? { ...s, ...u } : s) })}
            onDelete={() => {
              sp.fields.forEach(f => { 
                if (f.isHighlighted) {
                  const sels = f.selectors && f.selectors.length > 0 ? f.selectors : [f.selector];
                  sels.forEach((s, i) => { if (s) clearFieldPreview(`${f.id}-sel-${i}`); });
                }
              });
              onChange({ subPages: page.subPages.filter(s => s.id !== sp.id) });
            }}
          />
        ))}
        <button className="btn btn-add" onClick={() => onChange({ 
          subPages: [...page.subPages, { 
            id: crypto.randomUUID(), 
            name: 'SubPage', 
            urlPattern: '/new', 
            fields: []
          }] 
        })} type="button">+ SubPage</button>
      </div>

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
        commonFields: (p.commonFields || p.fields || []).map(f => ({ 
          ...f, 
          selectors: f.selectors || [],
          isPicking: false, 
          isPickingAddSelector: false,
          validation: null, 
          isHighlighted: false, 
          isPickingLoadButton: false 
        })),
        subPages: (p.subPages || []).map(sp => ({ 
          ...sp, 
          fields: sp.fields.map(f => ({ 
            ...f, 
            selectors: f.selectors || [],
            isPicking: false,
            isPickingAddSelector: false,
            validation: null, 
            isHighlighted: false, 
            isPickingLoadButton: false 
          })) 
        })),
        fields: [],
        customObjectTypes: [...(p.customObjectTypes || [])]
      })));
    } else {
      setPages([{ 
        id: crypto.randomUUID(), 
        name: 'Main', 
        urlPattern: extractPattern(currentFullUrl), 
        commonFields: [],
        subPages: [],
        fields: [],
        customObjectTypes: []
      }]);
    }
  };

  const handleDeletePage = () => {
    if (pages.length === 1) { alert('Last!'); return; }
    if (!confirm('Delete?')) return;
    clearAllPreviews();
    setPages(prev => prev.filter((_, i) => i !== currentTab));
    setCurrentTab(Math.max(0, currentTab - 1));
  };

  useEffect(() => {
    const up = eventBus.subscribe<ElementPickedEvent['data']>('element.picked', (e) => {
      if (e.data.fieldId.startsWith('load-button-')) {
        const fieldId = e.data.fieldId.replace('load-button-', '');
        setPages(prev => prev.map(p => ({
          ...p,
          commonFields: p.commonFields.map(f => f.id === fieldId ? {
            ...f,
            loadConfig: { ...f.loadConfig!, buttonSelector: e.data.selector },
            isPickingLoadButton: false
          } : f),
          subPages: p.subPages.map(sp => ({
            ...sp,
            fields: sp.fields.map(f => f.id === fieldId ? {
              ...f,
              loadConfig: { ...f.loadConfig!, buttonSelector: e.data.selector },
              isPickingLoadButton: false
            } : f)
          }))
        })));
      } else if (e.data.fieldId.endsWith('-add-selector')) {
        const fieldId = e.data.fieldId.replace('-add-selector', '');
        setPages(prev => prev.map(p => ({
          ...p,
          commonFields: p.commonFields.map(f => f.id === fieldId ? {
            ...f,
            selectors: [...(f.selectors || [f.selector]).filter(Boolean), e.data.selector],
            isPickingAddSelector: false,
            isPicking: false
          } : f),
          subPages: p.subPages.map(sp => ({
            ...sp,
            fields: sp.fields.map(f => f.id === fieldId ? {
              ...f,
              selectors: [...(f.selectors || [f.selector]).filter(Boolean), e.data.selector],
              isPickingAddSelector: false,
              isPicking: false
            } : f)
          }))
        })));
      } else {
        setPages(prev => prev.map(p => ({
          ...p,
          commonFields: p.commonFields.map(f => f.id === e.data.fieldId ? { 
            ...f, 
            selector: e.data.selector, 
            isPicking: false, 
            validation: { status: 'valid', count: e.data.elementCount, arrayPreview: e.data.arrayPreview }
          } : f),
          subPages: p.subPages.map(sp => ({
            ...sp,
            fields: sp.fields.map(f => f.id === e.data.fieldId ? {
              ...f,
              selector: e.data.selector,
              isPicking: false,
              validation: { status: 'valid', count: e.data.elementCount, arrayPreview: e.data.arrayPreview }
            } : f)
          }))
        })));
      }
      setIsVisible(true); 
    });
    
    const uc = eventBus.subscribe<ElementPickCancelledEvent['data']>('element.pick.cancelled', (e) => {
      if (e.data.fieldId.startsWith('load-button-')) {
        const fieldId = e.data.fieldId.replace('load-button-', '');
        setPages(prev => prev.map(p => ({
          ...p,
          commonFields: p.commonFields.map(f => f.id === fieldId ? { ...f, isPickingLoadButton: false } : f),
          subPages: p.subPages.map(sp => ({
            ...sp,
            fields: sp.fields.map(f => f.id === fieldId ? { ...f, isPickingLoadButton: false } : f)
          }))
        })));
      } else if (e.data.fieldId.endsWith('-add-selector')) {
        const fieldId = e.data.fieldId.replace('-add-selector', '');
        setPages(prev => prev.map(p => ({
          ...p,
          commonFields: p.commonFields.map(f => f.id === fieldId ? { ...f, isPickingAddSelector: false, isPicking: false } : f),
          subPages: p.subPages.map(sp => ({
            ...sp,
            fields: sp.fields.map(f => f.id === fieldId ? { ...f, isPickingAddSelector: false, isPicking: false } : f)
          }))
        })));
      } else {
        setPages(prev => prev.map(p => ({ 
          ...p,
          commonFields: p.commonFields.map(f => f.id === e.data.fieldId ? { ...f, isPicking: false } : f),
          subPages: p.subPages.map(sp => ({
            ...sp,
            fields: sp.fields.map(f => f.id === e.data.fieldId ? { ...f, isPicking: false } : f)
          }))
        })));
      }
      setIsVisible(true); 
    });
    
    return () => { up(); uc(); };
  }, [currentTab]);

  useEffect(() => {
    const anyPicking = pages.some(p => 
      p.commonFields.some(f => f.isPicking || f.isPickingLoadButton || f.isPickingAddSelector) ||
      p.subPages.some(sp => sp.fields.some(f => f.isPicking || f.isPickingLoadButton || f.isPickingAddSelector))
    );
    if (anyPicking) setIsVisible(false);
  }, [pages]);

  const handleSave = async () => {
    if (!name) { alert('Name!'); return; }
    clearAllPreviews();
    
    const config = { 
      id: existingConfig?.id || crypto.randomUUID(), 
      name, 
      version: '4.4.0', 
      targetUrl, 
      pages: pages.map(({ id, name, urlPattern, tabSelector, preParseActions, commonFields, subPages, customObjectTypes }) => ({ 
        id, 
        name, 
        urlPattern,
        tabSelector,
        preParseActions,
        commonFields: commonFields.map(({ id, name, key, type, selector, selectors, required, arrayItemType, customObjectTypeId, loadConfig, preParseActions }) => 
          ({ id, name, key, type, selector, selectors, required, arrayItemType, customObjectTypeId, loadConfig, preParseActions })
        ),
        subPages: subPages.map(({ id, name, urlPattern, fields, preParseActions }) => ({
          id,
          name,
          urlPattern,
          preParseActions,
          fields: fields.map(({ id, name, key, type, selector, selectors, required, arrayItemType, customObjectTypeId, loadConfig, preParseActions }) => 
            ({ id, name, key, type, selector, selectors, required, arrayItemType, customObjectTypeId, loadConfig, preParseActions })
          )
        })),
        customObjectTypes,
        fields: []
      })), 
      metadata: { created: new Date(), updated: new Date(), author: 'user', tags: [], siteUrl: targetUrl }
    };
    
    try {
      const r = await browser.runtime.sendMessage({ type: existingConfig ? 'CONFIG_UPDATED' : 'CONFIG_CREATED', config }) as { success: boolean };
      if (r?.success) { alert('Saved!'); onClose(); }
    } catch { alert('Error'); }
  };

  const handleClose = () => {
    clearAllPreviews();
    onClose();
  };

  if (showSelector) return <ConfigSelector currentUrl={currentFullUrl} onSelect={handleConfigSelected} onCancel={handleClose} />;

  return (
    <>
      <style>{styles}</style>
      <div className={`sidebar ${!isVisible ? 'hidden' : ''}`}>
        <div className="header">
          <h2 className="title">{existingConfig ? 'Edit' : 'New'}</h2>
          <button className="close" onClick={handleClose} type="button">×</button>
        </div>
        
        <div className="content">
          {pages.some(p => p.commonFields.some(f => f.isPicking || f.isPickingLoadButton || f.isPickingAddSelector) || p.subPages.some(sp => sp.fields.some(f => f.isPicking || f.isPickingLoadButton || f.isPickingAddSelector))) && (
            <div className="picking-hint">Click (ESC = cancel)</div>
          )}
          <div className="info"><strong>v4.4:</strong> Multiple Selectors!</div>
          <div className="group"><label className="label">Name</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div style={{ marginTop: '16px' }}>
            <div className="tabs">
              {pages.map((p, i) => <button key={p.id} className={`tab ${currentTab === i ? 'active' : ''}`} onClick={() => setCurrentTab(i)} type="button">{p.name}</button>)}
              <button className="tab" onClick={() => { 
                setPages([...pages, { 
                  id: crypto.randomUUID(), 
                  name: 'Page', 
                  urlPattern: extractPattern(currentFullUrl), 
                  commonFields: [],
                  subPages: [],
                  fields: [],
                  customObjectTypes: []
                }]); 
                setCurrentTab(pages.length); 
              }} type="button" style={{ color: '#10b981' }}>+</button>
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
  root.render(<Sidebar onClose={() => { root.unmount(); c.remove(); clearAllPreviews(); }} initialUrl={url} initialName={`${name} Parser`} />);
}

export function isSidebarOpen(): boolean {
  return !!document.getElementById('parser-config-builder-sidebar-root');
}
