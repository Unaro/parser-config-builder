/**
 * Options App v4.0
 * @module options/OptionsApp
 */

import { useState, useEffect } from 'react';
import { configRepository } from '@lib/storage/config-repository';
import { ConfigExporter } from '@components/features/ConfigExporter';
import type { ParserConfig } from '@lib/types/parser.types';

export function OptionsApp() {
  const [configs, setConfigs] = useState<ParserConfig[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<ParserConfig | null>(null);
  const [view, setView] = useState<'list' | 'export'>('list');

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    const data = await configRepository.getAll();
    setConfigs(data);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete config?')) return;
    await configRepository.delete(id);
    await loadConfigs();
  };

  const handleExport = (config: ParserConfig) => {
    setSelectedConfig(config);
    setView('export');
  };

  const handleBackToList = () => {
    setSelectedConfig(null);
    setView('list');
  };

  if (view === 'export' && selectedConfig) {
    return <ConfigExporter config={selectedConfig} onBack={handleBackToList} />;
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>Parser Configurations</h1>
      
      {configs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>
          No configurations yet. Create one using the extension!
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {configs.map(config => (
            <div key={config.id} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>{config.name}</h3>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '12px' }}>
                {config.pages.length} pages • v{config.version}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => handleExport(config)} style={{ padding: '8px 16px', background: '#667eea', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }} type="button">Export</button>
                <button onClick={() => handleDelete(config.id)} style={{ padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }} type="button">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
