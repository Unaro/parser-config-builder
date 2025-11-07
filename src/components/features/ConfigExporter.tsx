/**
 * Config Exporter v4.0
 * @module components/features/ConfigExporter
 */

import { useState } from 'react';
import type { ParserConfig } from '@lib/types/parser.types';

interface ConfigExporterProps {
  config: ParserConfig;
  onClose?: () => void;
  onBack?: () => void;
}

export function ConfigExporter({ config, onClose, onBack }: ConfigExporterProps) {
  const [format, setFormat] = useState<'json' | 'yaml'>('json');

  const handleExport = () => {
    const validated: ParserConfig = {
      ...config,
      pages: config.pages.map(p => ({
        ...p,
        commonFields: p.commonFields || p.fields || [],
        subPages: p.subPages || [],
        fields: []
      }))
    };

    const data = format === 'json' 
      ? JSON.stringify(validated, null, 2)
      : '# YAML not implemented';
    
    const blob = new Blob([data], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.name}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCloseAction = () => {
    if (onClose) onClose();
    if (onBack) onBack();
  };

  return (
    <div style={{ padding: '24px' }}>
      <h2>Export</h2>
      <select value={format} onChange={(e) => setFormat(e.target.value as 'json' | 'yaml')}>
        <option value="json">JSON</option>
        <option value="yaml">YAML</option>
      </select>
      <button onClick={handleExport} type="button">Export</button>
      <button onClick={handleCloseAction} type="button">Back</button>
    </div>
  );
}
