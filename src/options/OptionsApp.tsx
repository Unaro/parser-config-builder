/**
 * Options - управление конфигурациями
 * @module options/OptionsApp
 * @version 2.0.0
 */

import { useState, useEffect } from 'react';
import { useParserConfigStore } from '@state/parser-config.store';
import { useStorageSync } from '@lib/hooks/use-storage-sync';
import { ConfigEditor } from '@components/features/ConfigEditor';
import { ConfigExporter } from '@components/features/ConfigExporter';
import { Button } from '@components/ui/Button';
import { browser } from '@lib/utils/browser-api';
import type { ParserConfig } from '@lib/types/parser.types';

type View = 'list' | 'edit' | 'export';

export function OptionsApp() {
  const { configs, activeConfigId, setActiveConfig, deleteConfig } = useParserConfigStore();
  const [currentView, setCurrentView] = useState<View>('list');
  const [selectedConfig, setSelectedConfig] = useState<ParserConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useStorageSync();

  useEffect(() => {
    setTimeout(() => setIsLoading(false), 500);
  }, []);

  const handleEdit = (config: ParserConfig) => {
    setSelectedConfig(config);
    setCurrentView('edit');
  };

  const handleExport = (config: ParserConfig) => {
    setSelectedConfig(config);
    setCurrentView('export');
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedConfig(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this configuration?')) return;
    
    try {
      await browser.runtime.sendMessage({
        type: 'CONFIG_DELETED',
        configId: id
      });
      
      deleteConfig(id);
    } catch (error) {
      console.error('Error deleting config:', error);
      alert('Failed to delete configuration');
    }
  };

  const handleSetActive = async (id: string) => {
    setActiveConfig(id);
  };

  const validConfigs = configs.filter(c => c.pages && Array.isArray(c.pages) && c.pages.length > 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading configurations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Parser Config Builder</h1>
              <p className="text-sm text-gray-500 mt-1">Manage multi-page parser configurations</p>
            </div>

            <div className="flex gap-3">
              {currentView !== 'list' && (
                <Button variant="secondary" onClick={handleBackToList}>
                  &larr; Back to List
                </Button>
              )}
              {currentView === 'list' && (
                <>
                  <Button variant="secondary" onClick={() => setCurrentView('export')}>
                    Import/Export
                  </Button>
                  <Button onClick={() => alert('Navigate to a website and click the gear button to create a config!')}>
                    How to Create
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'list' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                Configurations ({validConfigs.length})
              </h2>
            </div>

            {validConfigs.length > 0 ? (
              <div className="space-y-4">
                {validConfigs.map(config => {
                  const totalFields = config.pages.reduce((sum, p) => sum + (p.fields?.length || 0), 0);
                  
                  return (
                    <div key={config.id} className={`bg-white rounded-lg shadow-sm border-2 p-6 transition-all ${
                      activeConfigId === config.id ? 'border-blue-500 shadow-md' : 'border-gray-200'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold text-gray-900">{config.name}</h3>
                            {activeConfigId === config.id && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{config.targetUrl}</p>
                          
                          <div className="mt-3 flex flex-wrap gap-2">
                            {config.pages.map(page => (
                              <span key={page.id} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                                {page.name} ({page.fields?.length || 0} fields)
                              </span>
                            ))}
                          </div>

                          <p className="text-xs text-gray-400 mt-3">
                            Total fields: {totalFields} | 
                            Version: {config.version} |
                            Updated: {new Date(config.metadata.updated).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="flex flex-col gap-2 ml-4">
                          <Button
                            size="sm"
                            variant={activeConfigId === config.id ? 'secondary' : 'primary'}
                            onClick={() => void handleSetActive(config.id)}
                          >
                            {activeConfigId === config.id ? 'Active' : 'Activate'}
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => handleEdit(config)}>
                            View Details
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => handleExport(config)}>
                            Export JSON
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => void handleDelete(config.id)}>
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="text-6xl mb-6" role="img" aria-label="rocket">
                  <svg className="w-24 h-24 mx-auto text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/>
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">No configurations yet</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  Navigate to a manga/comic website and click the gear button on the right side to create your first parser configuration!
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-xl mx-auto text-left">
                  <h4 className="font-semibold text-blue-900 mb-3">How it works:</h4>
                  <ol className="space-y-2 text-sm text-blue-800">
                    <li>1. Open any manga/comic website</li>
                    <li>2. Click the gear button (appears on right side)</li>
                    <li>3. Add pages (Catalog, Work, Chapter, etc.)</li>
                    <li>4. Add fields and pick elements visually</li>
                    <li>5. Configure load strategies</li>
                    <li>6. Save and export as JSON!</li>
                  </ol>
                </div>
              </div>
            )}
          </div>
        )}

        {currentView === 'edit' && selectedConfig && (
          <ConfigEditor config={selectedConfig} onBack={handleBackToList} />
        )}

        {currentView === 'export' && (
          <ConfigExporter config={selectedConfig || undefined} onBack={handleBackToList} />
        )}
      </main>

      <footer className="bg-white border-t mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            <p className="font-semibold">Parser Config Builder v2.0.0</p>
            <p className="mt-1">Multi-page visual parser configuration tool</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
