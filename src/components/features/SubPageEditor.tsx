/**
 * SubPage Editor - только имя и URL
 * @module components/features/SubPageEditor
 */

import type { SubPage } from '@lib/types/parser.types';

interface SubPageEditorProps {
  subPage: SubPage;
  onChange: (updates: Partial<SubPage>) => void;
  onDelete: () => void;
}

export function SubPageEditor({ subPage, onChange, onDelete }: SubPageEditorProps) {
  return (
    <div style={{ background: '#f0f9ff', border: '2px solid #bae6fd', borderRadius: '8px', padding: '14px', marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ fontSize: '14px', fontWeight: 600, color: '#0c4a6e' }}>{subPage.name}</span>
        <button 
          style={{ background: '#dc2626', color: 'white', padding: '6px 12px', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
          onClick={onDelete} 
          type="button"
        >
          Delete
        </button>
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>SubPage Name</label>
        <input 
          style={{ width: '100%', padding: '6px 8px', border: '1px solid #bae6fd', borderRadius: '6px', fontSize: '13px' }}
          value={subPage.name} 
          onChange={(e) => onChange({ name: e.target.value })} 
          placeholder="Chapters, Comments"
        />
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>URL Pattern</label>
        <input 
          style={{ width: '100%', padding: '6px 8px', border: '1px solid #bae6fd', borderRadius: '6px', fontSize: '13px' }}
          value={subPage.urlPattern} 
          onChange={(e) => onChange({ urlPattern: e.target.value })} 
          placeholder="/chapters"
        />
        <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '4px' }}>
          Fields will have their own load strategies
        </div>
      </div>
    </div>
  );
}
