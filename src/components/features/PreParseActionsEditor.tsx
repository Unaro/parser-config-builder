/**
 * Pre-Parse Actions Editor v2
 * @module components/features/PreParseActionsEditor
 */

import { useState, useEffect } from 'react';
import { eventBus } from '@lib/events/event-bus';
import { ParserEventFactory } from '@lib/events/parser.events';
import type { PreParseAction, PreParseActionType } from '@lib/types/parser.types';

interface PreParseActionsEditorProps {
  actions: PreParseAction[];
  onChange: (actions: PreParseAction[]) => void;
  level: 'page' | 'subpage' | 'field';
}

const styles = `
  .preparse-box { background: #fef3c7; border: 1px solid #fde68a; border-radius: 6px; padding: 10px; margin-top: 10px; }
  .preparse-title { font-size: 12px; font-weight: 600; color: #78350f; margin-bottom: 8px; cursor: pointer; user-select: none; }
  .action-card { background: white; border: 1px solid #fde68a; border-radius: 6px; padding: 8px; margin-bottom: 8px; }
  .action-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
  .action-type { font-size: 12px; font-weight: 600; color: #78350f; }
  .btn-remove-action { background: #ef4444; color: white; border: none; width: 24px; height: 24px; border-radius: 4px; cursor: pointer; font-size: 14px; }
  .action-select { width: 100%; padding: 6px 8px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px; background: white; margin-bottom: 6px; }
  .action-input { width: 100%; padding: 6px 8px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px; }
  .btn-add-action { background: #f59e0b; color: white; border: none; padding: 8px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; width: 100%; margin-top: 8px; }
  .btn-pick-action { background: #667eea; color: white; border: none; padding: 4px 10px; border-radius: 4px; font-size: 11px; cursor: pointer; }
  .btn-pick-action.active { background: #10b981; }
  .action-row { display: flex; gap: 6px; margin-bottom: 6px; }
  .hint { font-size: 10px; color: #78350f; background: #fef3c7; padding: 4px 6px; border-radius: 3px; margin-top: 4px; }
`;

export function PreParseActionsEditor({ actions, onChange }: PreParseActionsEditorProps) {
  const [expanded, setExpanded] = useState(actions.length > 0);
  const [pickingActionIndex, setPickingActionIndex] = useState<number | null>(null);

  useEffect(() => {
    const unsubPicked = eventBus.subscribe('element.picked', (e: any) => {
      if (pickingActionIndex !== null && e.data.fieldId.startsWith('preparse-action-')) {
        const index = parseInt(e.data.fieldId.split('-').pop() || '-1');
        if (index === pickingActionIndex) {
          handleUpdateAction(index, { selector: e.data.selector });
          setPickingActionIndex(null);
        }
      }
    });

    const unsubCancelled = eventBus.subscribe('element.pick.cancelled', (e: any) => {
      if (pickingActionIndex !== null && e.data.fieldId.startsWith('preparse-action-')) {
        setPickingActionIndex(null);
      }
    });

    return () => {
      unsubPicked();
      unsubCancelled();
    };
  }, [pickingActionIndex]);

  const handleAddAction = () => {
    const newAction: PreParseAction = {
      type: 'disable-interactions',
      executeOnce: true
    };
    onChange([...actions, newAction]);
    setExpanded(true);
  };

  const handleRemoveAction = (index: number) => {
    onChange(actions.filter((_, i) => i !== index));
  };

  const handleUpdateAction = (index: number, updates: Partial<PreParseAction>) => {
    onChange(actions.map((action, i) => i === index ? { ...action, ...updates } : action));
  };

  const handlePickSelector = async (index: number) => {
    setPickingActionIndex(index);
    await eventBus.publish(ParserEventFactory.createElementPickRequest(`preparse-action-${index}`, 'string'));
  };

  const getActionDescription = (type: PreParseActionType): string => {
    switch (type) {
      case 'disable-interactions': return '��� Disable interactions';
      case 'remove-overlays': return '���️ Remove overlays';
      case 'expand-all': return '��� Expand all';
      case 'trigger-hover': return '��� Trigger hover';
      case 'wait-for-element': return '⏳ Wait for';
      case 'remove-elements': return '❌ Remove';
      case 'force-visible': return '���️ Force visible';
      default: return '';
    }
  };

  const needsSelector = (type: PreParseActionType): boolean => {
    return ['expand-all', 'trigger-hover', 'wait-for-element', 'remove-elements', 'force-visible'].includes(type);
  };

  return (
    <>
      <style>{styles}</style>
      <div className="preparse-box">
        <div className="preparse-title" onClick={() => setExpanded(!expanded)}>
          {expanded ? '▼' : '▶'} Pre-Parse ({actions.length})
        </div>

        {expanded && (
          <>
            {actions.map((action, index) => (
              <div key={index} className="action-card">
                <div className="action-header">
                  <span className="action-type">{getActionDescription(action.type)}</span>
                  <button className="btn-remove-action" onClick={() => handleRemoveAction(index)} type="button">×</button>
                </div>

                <select 
                  className="action-select"
                  value={action.type}
                  onChange={(e) => handleUpdateAction(index, { type: e.target.value as PreParseActionType })}
                >
                  <option value="disable-interactions">Disable Interactions</option>
                  <option value="remove-overlays">Remove Overlays</option>
                  <option value="expand-all">Expand All</option>
                  <option value="trigger-hover">Trigger Hover</option>
                  <option value="wait-for-element">Wait For</option>
                  <option value="remove-elements">Remove</option>
                  <option value="force-visible">Force Visible</option>
                </select>

                {needsSelector(action.type) && (
                  <div className="action-row">
                    <input 
                      className="action-input"
                      style={{ flex: 1 }}
                      placeholder="Selector"
                      value={action.selector || ''}
                      onChange={(e) => handleUpdateAction(index, { selector: e.target.value })}
                    />
                    <button 
                      className={`btn-pick-action ${pickingActionIndex === index ? 'active' : ''}`}
                      onClick={() => handlePickSelector(index)}
                      type="button"
                    >
                      {pickingActionIndex === index ? '...' : 'Pick'}
                    </button>
                  </div>
                )}

                {action.type === 'wait-for-element' && (
                  <input 
                    type="number"
                    className="action-input"
                    placeholder="Timeout (ms)"
                    value={action.timeout || 5000}
                    onChange={(e) => handleUpdateAction(index, { timeout: parseInt(e.target.value) || 5000 })}
                  />
                )}

                <div className="hint">
                  {action.type === 'trigger-hover' && 'Hover state frozen'}
                  {action.type === 'disable-interactions' && 'Prevents modal opens'}
                  {action.type === 'remove-overlays' && 'Clears .modal, .popup'}
                  {action.type === 'expand-all' && 'Clicks expand buttons'}
                  {action.type === 'force-visible' && 'display:block !important'}
                  {action.type === 'remove-elements' && 'Deletes elements'}
                  {action.type === 'wait-for-element' && 'Waits for AJAX'}
                </div>
              </div>
            ))}

            <button className="btn-add-action" onClick={handleAddAction} type="button">
              + Add Action
            </button>
          </>
        )}
      </div>
    </>
  );
}
