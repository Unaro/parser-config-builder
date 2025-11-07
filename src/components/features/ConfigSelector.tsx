/**
 * Config Selector с полными стилями
 * @module components/features/ConfigSelector
 */

import { useState, useEffect } from 'react';
import { browser } from '@lib/utils/browser-api';
import type { ParserConfig } from '@lib/types/parser.types';

interface ConfigSelectorProps {
  currentUrl: string;
  onSelect: (config: ParserConfig | null) => void;
  onCancel: () => void;
}

const styles = `
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 2147483648; }
  .modal-content { background: white; border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); max-width: 48rem; width: 100%; max-height: 80vh; overflow: hidden; display: flex; flex-direction: column; }
  .modal-header { background: linear-gradient(to right, #9333ea, #4f46e5); color: white; padding: 24px; }
  .modal-title { font-size: 24px; font-weight: 700; margin-bottom: 4px; }
  .modal-subtitle { font-size: 14px; color: rgba(255,255,255,0.9); }
  .modal-body { flex: 1; overflow-y: auto; padding: 24px; }
  .info-box { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin-bottom: 20px; font-size: 14px; }
  .info-box strong { color: #1e40af; }
  .config-card { border: 2px solid #e5e7eb; border-radius: 12px; padding: 20px; margin-bottom: 16px; cursor: pointer; transition: all 0.2s; }
  .config-card:hover { border-color: #9333ea; background: #faf5ff; }
  .config-title { font-size: 18px; font-weight: 600; color: #111827; margin-bottom: 8px; }
  .config-meta { font-size: 14px; color: #6b7280; margin-bottom: 12px; }
  .config-tags { display: flex; gap: 8px; flex-wrap: wrap; }
  .config-tag { padding: 4px 12px; background: #ede9fe; color: #6b21a8; border-radius: 12px; font-size: 12px; font-weight: 500; }
  .empty-state { text-align: center; padding: 48px 24px; }
  .empty-icon { font-size: 64px; margin-bottom: 16px; }
  .empty-title { font-size: 20px; font-weight: 600; color: #111827; margin-bottom: 8px; }
  .empty-text { color: #6b7280; }
  .modal-footer { border-top: 1px solid #e5e7eb; padding: 16px 24px; display: flex; gap: 12px; }
  .btn { padding: 12px 24px; border: none; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s; flex: 1; }
  .btn-primary { background: #9333ea; color: white; }
  .btn-primary:hover { background: #7e22ce; }
  .btn-secondary { background: #f3f4f6; color: #374151; }
  .btn-secondary:hover { background: #e5e7eb; }
  .spinner { border: 3px solid #f3f4f6; border-top: 3px solid #9333ea; border-radius: 50%; width: 48px; height: 48px; animation: spin 1s linear infinite; margin: 0 auto; }
  @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
`;

export function ConfigSelector({ currentUrl, onSelect, onCancel }: ConfigSelectorProps) {
  const [configs, setConfigs] = useState<ParserConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      const result = await browser.storage.local.get('parser_configs');
      const allConfigs = (result.parser_configs || []) as ParserConfig[];
      
      const origin = new URL(currentUrl).origin;
      const matchingConfigs = allConfigs.filter((c) => c.targetUrl === origin);
      
      setConfigs(matchingConfigs);
    } catch (error) {
      console.error('Error loading configs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <style>{styles}</style>
        <div className="modal-overlay">
          <div style={{ background: 'white', borderRadius: '12px', padding: '32px', textAlign: 'center' }}>
            <div className="spinner"></div>
            <p style={{ marginTop: '16px', color: '#6b7280' }}>Loading configurations...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h2 className="modal-title">Select or Create Configuration</h2>
            <p className="modal-subtitle">{new URL(currentUrl).hostname}</p>
          </div>

          <div className="modal-body">
            {configs.length > 0 ? (
              <>
                <div className="info-box">
                  <strong>Found {configs.length} configuration(s) for this site.</strong><br/>
                  Select to add a new page, or create new config.
                </div>

                {configs.map((config) => (
                  <div key={config.id} className="config-card" onClick={() => onSelect(config)}>
                    <h3 className="config-title">{config.name}</h3>
                    <p className="config-meta">
                      {config.pages.length} page(s) | Version {config.version}
                    </p>
                    <div className="config-tags">
                      {config.pages.map((page) => (
                        <span key={page.id} className="config-tag">{page.name}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">���</div>
                <h3 className="empty-title">No configurations for this site</h3>
                <p className="empty-text">Create your first configuration!</p>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onCancel} type="button">
              Cancel
            </button>
            <button className="btn btn-primary" onClick={() => onSelect(null)} type="button">
              Create New Config
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
