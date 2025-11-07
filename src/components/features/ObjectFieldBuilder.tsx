/**
 * Object Field Builder
 * @module components/features/ObjectFieldBuilder
 */

import { useState } from 'react';
import { Button } from '@components/ui/Button';
import type { ObjectFieldDefinition } from '@lib/types/parser.types';

interface ObjectFieldBuilderProps {
  containerSelector: string;
  fields: ObjectFieldDefinition[];
  onChange: (containerSelector: string, fields: ObjectFieldDefinition[]) => void;
  onClose: () => void;
}

export function ObjectFieldBuilder({ containerSelector, fields, onChange, onClose }: ObjectFieldBuilderProps) {
  const [localContainer, setLocalContainer] = useState(containerSelector);
  const [localFields, setLocalFields] = useState<ObjectFieldDefinition[]>(fields);

  const handleAddField = () => {
    const newField: ObjectFieldDefinition = {
      id: crypto.randomUUID(),
      name: '',
      key: '',
      type: 'string',
      selector: '',
      required: false
    };
    setLocalFields([...localFields, newField]);
  };

  const handleUpdateField = (id: string, updates: Partial<ObjectFieldDefinition>) => {
    setLocalFields(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const handleSave = () => {
    onChange(localContainer, localFields);
    onClose();
  };

  return (
    <div className="bg-purple-50 border-2 border-purple-500 rounded-lg p-4 mt-4">
      <h4 className="font-semibold text-lg mb-4">Object Configuration</h4>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Container Selector</label>
        <input className="w-full px-3 py-2 border rounded" value={localContainer} onChange={(e) => setLocalContainer(e.target.value)} />
      </div>
      <div className="space-y-3">
        {localFields.map((field) => (
          <div key={field.id} className="bg-white border rounded p-3">
            <input className="w-full px-2 py-1 border rounded text-sm mb-2" value={field.name} onChange={(e) => handleUpdateField(field.id, { name: e.target.value, key: e.target.value.toLowerCase().replace(/\s+/g, '_') })} placeholder="Name" />
            <select className="w-full px-2 py-1 border rounded text-sm mb-2" value={field.type} onChange={(e) => handleUpdateField(field.id, { type: e.target.value as ObjectFieldDefinition['type'] })}>
              <option value="string">String</option>
              <option value="array">Array</option>
              <option value="image">Image</option>
              <option value="url">URL</option>
              <option value="number">Number</option>
            </select>
            <input className="w-full px-2 py-1 border rounded text-sm" value={field.selector} onChange={(e) => handleUpdateField(field.id, { selector: e.target.value })} placeholder="Selector" />
          </div>
        ))}
        <Button onClick={handleAddField} variant="secondary" fullWidth>+ Add Field</Button>
      </div>
      <div className="flex gap-2 mt-4">
        <Button variant="secondary" onClick={onClose} fullWidth>Cancel</Button>
        <Button onClick={handleSave} fullWidth>Save</Button>
      </div>
    </div>
  );
}
