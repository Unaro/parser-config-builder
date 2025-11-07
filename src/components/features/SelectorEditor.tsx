/**
 * Selector Editor с полными стилями
 * @module components/features/SelectorEditor
 */

import { useState, useEffect } from 'react';

interface SelectorEditorProps {
  initialSelector: string;
  onSelectorChange: (selector: string) => void;
  onClose: () => void;
}

const styles = `
  .editor-container { background: white; border: 2px solid #9333ea; border-radius: 12px; padding: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.15); margin-top: 16px; }
  .editor-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
  .editor-title { font-size: 16px; font-weight: 600; color: #111827; }
  .editor-close { background: #f3f4f6; border: none; color: #6b7280; font-size: 24px; width: 28px; height: 28px; border-radius: 6px; cursor: pointer; line-height: 1; }
  .editor-close:hover { background: #e5e7eb; color: #374151; }
  .editor-info { font-size: 13px; color: #6b7280; margin-bottom: 12px; }
  .editor-preview { background: #f9fafb; padding: 10px; border-radius: 6px; font-family: monospace; font-size: 12px; overflow-x: auto; margin-bottom: 16px; border: 1px solid #e5e7eb; }
  .level-list { max-height: 400px; overflow-y: auto; }
  .level-item { background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 8px; padding: 12px; margin-bottom: 10px; }
  .level-header { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 10px; }
  .level-number { font-size: 13px; font-weight: 600; color: #6b7280; padding-top: 6px; }
  .level-code { flex: 1; background: white; padding: 8px 12px; border-radius: 6px; font-family: monospace; font-size: 13px; cursor: pointer; border: 1px solid #d1d5db; transition: all 0.2s; }
  .level-code:hover { background: #eff6ff; border-color: #bfdbfe; }
  .level-input { flex: 1; padding: 8px 12px; border: 1px solid #9333ea; border-radius: 6px; font-family: monospace; font-size: 13px; box-shadow: 0 0 0 3px rgba(147,51,234,0.1); }
  .level-actions { display: flex; gap: 6px; flex-wrap: wrap; }
  .btn { padding: 6px 12px; border: none; border-radius: 6px; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.2s; }
  .btn-secondary { background: #f3f4f6; color: #374151; }
  .btn-secondary:hover { background: #e5e7eb; }
  .btn-secondary:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn-danger { background: #ef4444; color: white; }
  .btn-danger:hover { background: #dc2626; }
`;

function parseSelector(selector: string): string[] {
  return selector.split('>').map(s => s.trim()).filter(s => s.length > 0);
}

function buildSelector(levels: string[]): string {
  return levels.join(' > ');
}

export function SelectorEditor({ initialSelector, onSelectorChange, onClose }: SelectorEditorProps) {
  const [levels, setLevels] = useState<string[]>(() => parseSelector(initialSelector));
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  useEffect(() => {
    const newSelector = buildSelector(levels);
    onSelectorChange(newSelector);
  }, [levels, onSelectorChange]);

  const handleRemoveLevel = (index: number) => {
    setLevels(prev => prev.filter((_, i) => i !== index));
  };

  const handleEditLevel = (index: number, value: string) => {
    setLevels(prev => prev.map((level, i) => i === index ? value : level));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setLevels(prev => {
      const newLevels = [...prev];
      const current = newLevels[index];
      const previous = newLevels[index - 1];
      if (current !== undefined && previous !== undefined) {
        newLevels[index - 1] = current;
        newLevels[index] = previous;
      }
      return newLevels;
    });
  };

  const handleMoveDown = (index: number) => {
    if (index === levels.length - 1) return;
    setLevels(prev => {
      const newLevels = [...prev];
      const current = newLevels[index];
      const next = newLevels[index + 1];
      if (current !== undefined && next !== undefined) {
        newLevels[index] = next;
        newLevels[index + 1] = current;
      }
      return newLevels;
    });
  };

  const handleSimplify = (index: number) => {
    const level = levels[index];
    if (!level) return;
    const simplified = level.replace(/:nth-of-type\(\d+\)/g, '').replace(/:nth-child\(\d+\)/g, '');
    handleEditLevel(index, simplified);
  };

  return (
    <>
      <style>{styles}</style>
      <div className="editor-container">
        <div className="editor-header">
          <h3 className="editor-title">Selector Editor</h3>
          <button className="editor-close" onClick={onClose} type="button">×</button>
        </div>

        <p className="editor-info">
          Edit selector levels. Remove levels to go up in DOM tree.
        </p>

        <div className="editor-preview">{buildSelector(levels)}</div>

        <div className="level-list">
          {levels.map((level, index) => (
            <div key={index} className="level-item">
              <div className="level-header">
                <span className="level-number">Level {index + 1}:</span>
                {editingIndex === index ? (
                  <input
                    className="level-input"
                    value={level}
                    onChange={(e) => handleEditLevel(index, e.target.value)}
                    onBlur={() => setEditingIndex(null)}
                    autoFocus
                  />
                ) : (
                  <code className="level-code" onClick={() => setEditingIndex(index)}>
                    {level}
                  </code>
                )}
              </div>

              <div className="level-actions">
                <button className="btn btn-secondary" onClick={() => setEditingIndex(index)} type="button">
                  Edit
                </button>
                <button className="btn btn-secondary" onClick={() => handleSimplify(index)} type="button">
                  Simplify
                </button>
                <button className="btn btn-secondary" onClick={() => handleMoveUp(index)} disabled={index === 0} type="button">
                  ↑
                </button>
                <button className="btn btn-secondary" onClick={() => handleMoveDown(index)} disabled={index === levels.length - 1} type="button">
                  ↓
                </button>
                <button className="btn btn-danger" onClick={() => handleRemoveLevel(index)} type="button">
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
