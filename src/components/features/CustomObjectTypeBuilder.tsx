/**
 * Custom Object Type Builder v3.3
 * @module components/features/CustomObjectTypeBuilder
 */

import { useState, useEffect } from 'react';
import { eventBus } from '@lib/events/event-bus';
import { ParserEventFactory } from '@lib/events/parser.events';
import { searchPresets } from '@lib/constants/field-presets';
import type { CustomObjectType, ObjectFieldDefinition } from '@lib/types/parser.types';
import type { ElementPickedEvent, ElementPickCancelledEvent } from '@lib/events/parser.events';

interface CustomObjectTypeBuilderProps {
  objectType?: CustomObjectType;
  onSave: (objectType: CustomObjectType) => void;
  onCancel: () => void;
}

const styles = `
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 2147483648; transition: opacity 0.2s; }
  .modal-overlay.hidden { opacity: 0; pointer-events: none; }
  .modal-content { background: white; border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); max-width: 48rem; width: 100%; max-height: 90vh; overflow: hidden; display: flex; flex-direction: column; }
  .modal-header { background: linear-gradient(to right, #9333ea, #4f46e5); color: white; padding: 24px; }
  .modal-title { font-size: 24px; font-weight: 700; margin-bottom: 4px; }
  .modal-subtitle { font-size: 14px; color: rgba(255,255,255,0.9); }
  .modal-body { flex: 1; overflow-y: auto; padding: 24px; }
  .info-box { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin-bottom: 24px; font-size: 14px; line-height: 1.6; }
  .info-box code { background: white; padding: 2px 6px; border-radius: 4px; font-size: 12px; }
  .form-group { margin-bottom: 24px; position: relative; }
  .form-label { display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px; }
  .form-input { width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; transition: all 0.2s; }
  .form-input:focus { outline: none; border-color: #9333ea; box-shadow: 0 0 0 3px rgba(147,51,234,0.1); }
  .form-hint { font-size: 12px; color: #6b7280; margin-top: 6px; }
  .field-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 12px; }
  .field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
  .field-label { display: block; font-size: 12px; color: #6b7280; margin-bottom: 4px; }
  .field-input { width: 100%; padding: 8px 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px; }
  .field-select { width: 100%; padding: 8px 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px; background: white; }
  .field-row { display: flex; gap: 8px; margin-bottom: 12px; }
  .field-actions { display: flex; gap: 8px; align-items: center; }
  .btn { padding: 10px 20px; border: none; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
  .btn-primary { background: #9333ea; color: white; }
  .btn-primary:hover { background: #7e22ce; }
  .btn-secondary { background: #f3f4f6; color: #374151; }
  .btn-secondary:hover { background: #e5e7eb; }
  .btn-danger { background: #ef4444; color: white; }
  .btn-danger:hover { background: #dc2626; }
  .btn-pick { background: #667eea; color: white; height: 36px; padding: 0 16px; }
  .btn-pick:hover { background: #5568d3; }
  .btn-pick.active { background: #10b981; animation: pulse 1.5s infinite; }
  .btn-sm { padding: 6px 12px; font-size: 12px; }
  .btn-full { width: 100%; }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
  .preview-box { background: #d1fae5; border: 2px solid #6ee7b7; border-radius: 8px; padding: 16px; margin-top: 24px; }
  .preview-title { font-weight: 600; color: #065f46; margin-bottom: 12px; font-size: 16px; }
  .preview-item { background: white; border: 1px solid #6ee7b7; border-radius: 6px; padding: 12px; margin-bottom: 12px; }
  .preview-label { font-size: 11px; font-weight: 600; color: #6b7280; margin-bottom: 8px; }
  .preview-code { background: #f9fafb; padding: 8px; border-radius: 4px; font-family: monospace; font-size: 11px; overflow-x: auto; white-space: pre-wrap; }
  .modal-footer { border-top: 1px solid #e5e7eb; padding: 16px 24px; display: flex; gap: 12px; }
  .checkbox { margin-right: 8px; }
  .checkbox-label { display: flex; align-items: center; font-size: 14px; color: #374151; }
  .picking-hint { background: #fef3c7; border: 1px solid #fde68a; border-radius: 6px; padding: 12px; margin-bottom: 16px; font-size: 13px; color: #78350f; text-align: center; font-weight: 500; }
  .preset-dropdown { position: absolute; background: white; border: 2px solid #667eea; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); max-height: 250px; overflow-y: auto; z-index: 1000; width: 100%; margin-top: 4px; }
  .preset-item { padding: 10px; cursor: pointer; border-bottom: 1px solid #e5e7eb; }
  .preset-item:hover { background: #f0f4ff; }
  .preset-badge { padding: 2px 6px; background: #e0e7ff; color: #3730a3; border-radius: 3px; font-size: 10px; margin-left: 6px; }
`;

export function CustomObjectTypeBuilder({ objectType, onSave, onCancel }: CustomObjectTypeBuilderProps) {
  const [name, setName] = useState(objectType?.name || '');
  const [containerSelector, setContainerSelector] = useState(objectType?.containerSelector || '');
  const [isPickingContainer, setIsPickingContainer] = useState(false);
  const [fields, setFields] = useState<ObjectFieldDefinition[]>(objectType?.fields ? [...objectType.fields] : []);
  const [pickingFieldId, setPickingFieldId] = useState<string | null>(null);
  const [preview, setPreview] = useState<Array<Record<string, string>>>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [showPresets, setShowPresets] = useState<{ [fieldId: string]: boolean }>({});

  const isPicking = isPickingContainer || pickingFieldId !== null;

  useEffect(() => {
    const unsubPicked = eventBus.subscribe<ElementPickedEvent['data']>('element.picked', (event) => {
      if (event.data.fieldId === 'container-picker') {
        setContainerSelector(event.data.selector);
        setIsPickingContainer(false);
        setIsVisible(true);
      } else {
        setFields(prev => prev.map(f => f.id === event.data.fieldId ? { ...f, selector: event.data.selector } : f));
        setPickingFieldId(null);
        setIsVisible(true);
      }
    });

    const unsubCancelled = eventBus.subscribe<ElementPickCancelledEvent['data']>('element.pick.cancelled', (event) => {
      if (event.data.fieldId === 'container-picker') {
        setIsPickingContainer(false);
      } else {
        setPickingFieldId(null);
      }
      setIsVisible(true);
    });

    return () => { unsubPicked(); unsubCancelled(); };
  }, []);

  useEffect(() => {
    if (isPicking) setIsVisible(false);
  }, [isPicking]);

  const handlePickContainer = async () => {
    setIsPickingContainer(true);
    await eventBus.publish(ParserEventFactory.createElementPickRequest('container-picker', 'array'));
  };

  const handleAddField = () => {
    setFields([...fields, { id: crypto.randomUUID(), name: '', key: '', type: 'string', selector: '', required: false }]);
  };

  const handleUpdateField = (id: string, updates: Partial<ObjectFieldDefinition>) => {
    setFields(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const handlePickField = async (fieldId: string) => {
    setPickingFieldId(fieldId);
    await eventBus.publish(ParserEventFactory.createElementPickRequest(fieldId, 'string'));
  };

  const handlePreview = () => {
    if (!containerSelector) { alert('Set container selector first'); return; }
    try {
      const containers = document.querySelectorAll(containerSelector);
      const previewData: Array<Record<string, string>> = [];

      Array.from(containers).slice(0, 3).forEach((container) => {
        const obj: Record<string, string> = {};
        fields.forEach((field) => {
          if (!field.selector) return;
          const element = container.querySelector(field.selector);
          if (!element) { obj[field.key || field.name] = '(not found)'; return; }
          
          let value = '';
          if (field.type === 'image') value = element.getAttribute('src') || '';
          else if (field.type === 'url') value = element.getAttribute('href') || '';
          else if (field.type === 'array') value = Array.from(container.querySelectorAll(field.selector)).map(el => el.textContent?.trim() || '').join(', ');
          else value = element.textContent?.trim() || '';
          
          obj[field.key || field.name] = value;
        });
        previewData.push(obj);
      });
      setPreview(previewData);
    } catch (error) {
      alert('Preview failed: ' + (error instanceof Error ? error.message : 'Unknown'));
    }
  };

  const handleSave = () => {
    if (!name || !containerSelector || fields.length === 0) { alert('Fill all required fields'); return; }
    onSave({ id: objectType?.id || crypto.randomUUID(), name, containerSelector, fields });
  };

  return (
    <>
      <style>{styles}</style>
      <div className={`modal-overlay ${!isVisible ? 'hidden' : ''}`}>
        <div className="modal-content">
          <div className="modal-header">
            <h2 className="modal-title">Create Custom Object Type</h2>
            <p className="modal-subtitle">With presets and smart selectors</p>
          </div>

          <div className="modal-body">
            {isPicking && <div className="picking-hint">Click element on page (ESC to cancel)</div>}

            <div className="info-box">
              <strong>Tip:</strong> Type field name to see presets! Selectors avoid auto-generated classes.
            </div>

            <div className="form-group">
              <label className="form-label">Object Type Name</label>
              <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Work, Chapter, Author" />
            </div>

            <div className="form-group">
              <label className="form-label">Container Selector</label>
              <div className="field-row">
                <input className="form-input" style={{ flex: 1 }} value={containerSelector} onChange={(e) => setContainerSelector(e.target.value)} placeholder=".work-card" />
                <button className={`btn btn-pick ${isPickingContainer ? 'active' : ''}`} onClick={handlePickContainer} type="button">
                  {isPickingContainer ? 'Picking...' : 'Pick'}
                </button>
              </div>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>Fields ({fields.length})</label>
                <button className="btn btn-secondary btn-sm" onClick={handlePreview} type="button">Preview</button>
              </div>

              {fields.map((field) => (
                <div key={field.id} className="field-card">
                  <div className="field-grid">
                    <div style={{ position: 'relative' }}>
                      <label className="field-label">Name</label>
                      <input
                        className="field-input"
                        value={field.name}
                        onChange={(e) => {
                          handleUpdateField(field.id, { name: e.target.value, key: e.target.value.toLowerCase().replace(/\s+/g, '_') });
                          setShowPresets({ ...showPresets, [field.id]: e.target.value.length > 0 });
                        }}
                        onFocus={() => setShowPresets({ ...showPresets, [field.id]: true })}
                        onBlur={() => setTimeout(() => setShowPresets({ ...showPresets, [field.id]: false }), 200)}
                        placeholder="Search presets..."
                      />
                      {showPresets[field.id] && (
                        <div className="preset-dropdown">
                          {searchPresets(field.name).slice(0, 5).map((p) => (
                            <div key={p.key} className="preset-item" onClick={() => {
                              handleUpdateField(field.id, { name: p.name, key: p.key, type: p.type === 'custom-object' ? 'string' : p.type });
                              setShowPresets({ ...showPresets, [field.id]: false });
                            }}>
                              <strong>{p.name}</strong><span className="preset-badge">{p.type}</span>
                              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{p.description}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="field-label">Type</label>
                      <select className="field-select" value={field.type} onChange={(e) => handleUpdateField(field.id, { type: e.target.value as ObjectFieldDefinition['type'] })}>
                        <option value="string">String</option>
                        <option value="array">Array</option>
                        <option value="image">Image</option>
                        <option value="url">URL</option>
                        <option value="number">Number</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <label className="field-label">Selector (relative)</label>
                    <div className="field-row">
                      <input className="field-input" style={{ flex: 1 }} value={field.selector} onChange={(e) => handleUpdateField(field.id, { selector: e.target.value })} placeholder="h3, .rating" />
                      <button className={`btn btn-pick ${pickingFieldId === field.id ? 'active' : ''}`} onClick={() => handlePickField(field.id)} type="button">
                        {pickingFieldId === field.id ? 'Picking...' : 'Pick'}
                      </button>
                    </div>
                  </div>

                  <div className="field-actions">
                    <label className="checkbox-label">
                      <input type="checkbox" className="checkbox" checked={field.required} onChange={(e) => handleUpdateField(field.id, { required: e.target.checked })} />
                      Required
                    </label>
                    <button className="btn btn-danger btn-sm" style={{ marginLeft: 'auto' }} onClick={() => setFields(prev => prev.filter(f => f.id !== field.id))} type="button">Remove</button>
                  </div>
                </div>
              ))}

              <button className="btn btn-secondary btn-full" onClick={handleAddField} type="button">+ Add Field</button>
            </div>

            {preview.length > 0 && (
              <div className="preview-box">
                <h4 className="preview-title">Preview (first {preview.length}):</h4>
                {preview.map((obj, i) => (
                  <div key={i} className="preview-item">
                    <div className="preview-label">Object {i + 1}:</div>
                    <div className="preview-code">{JSON.stringify(obj, null, 2)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button className="btn btn-secondary btn-full" onClick={onCancel} type="button">Cancel</button>
            <button className="btn btn-primary btn-full" onClick={handleSave} type="button">Save</button>
          </div>
        </div>
      </div>
    </>
  );
}
