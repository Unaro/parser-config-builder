/**
 * ConfigExporter - экспорт/импорт JSON
 * @module components/features/ConfigExporter
 * @version 2.0.0
 */

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { browser } from '@lib/utils/browser-api';
import { useParserConfigStore } from '@state/parser-config.store';
import { ParserConfigSchema } from '@lib/schemas/parser.schema';
import type { ParserConfig } from '@lib/types/parser.types';

interface ConfigExporterProps {
  config?: ParserConfig;
  onBack: () => void;
}

export function ConfigExporter({ config, onBack }: ConfigExporterProps) {
  const { configs, addConfig } = useParserConfigStore();
  const [importText, setImportText] = useState('');
  const [exportedJson, setExportedJson] = useState('');

  const handleExportSingle = () => {
    if (!config) return;
    const json = JSON.stringify(config, null, 2);
    setExportedJson(json);
  };

  const handleExportAll = () => {
    const json = JSON.stringify(configs, null, 2);
    setExportedJson(json);
  };

  const handleDownload = () => {
    if (!exportedJson) return;

    const blob = new Blob([exportedJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = config 
      ? `${config.name.toLowerCase().replace(/\s+/g, '-')}-config.json`
      : 'parser-configs.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(exportedJson);
      alert('Copied to clipboard!');
    } catch (error) {
      alert('Failed to copy');
    }
  };

  const handleImport = async () => {
    if (!importText.trim()) {
      alert('Please paste JSON data');
      return;
    }

    try {
      const parsed = JSON.parse(importText);
      const configsToImport: ParserConfig[] = Array.isArray(parsed) ? parsed : [parsed];
      
      for (const cfg of configsToImport) {
        const validated = ParserConfigSchema.parse(cfg);
        
        const response = await browser.runtime.sendMessage({
          type: 'CONFIG_CREATED',
          config: validated
        }) as { success: boolean };

        if (response?.success) {
          addConfig(validated);
        }
      }

      alert(`Successfully imported ${configsToImport.length} configuration(s)!`);
      setImportText('');
      onBack();
    } catch (error) {
      console.error('Import error:', error);
      alert('Invalid JSON format or schema: ' + (error instanceof Error ? error.message : 'Unknown'));
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Export Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            {config && (
              <Button onClick={handleExportSingle} fullWidth>
                Export "{config.name}"
              </Button>
            )}
            <Button onClick={handleExportAll} variant="secondary" fullWidth>
              Export All ({configs.length})
            </Button>
          </div>

          {exportedJson && (
            <div className="space-y-3">
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto max-h-96 overflow-y-auto">
                <pre className="text-xs font-mono">{exportedJson}</pre>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleDownload} fullWidth>
                  Download JSON
                </Button>
                <Button onClick={handleCopyToClipboard} variant="secondary" fullWidth>
                  Copy to Clipboard
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Import Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Paste a JSON configuration or array of configurations below:
          </p>

          <textarea
            className="w-full h-64 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
            placeholder='{"id": "...", "name": "...", "pages": [...], ...}'
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
          />

          <div className="flex gap-3">
            <Button onClick={handleImport} fullWidth>
              Import Configuration(s)
            </Button>
            <Button 
              onClick={() => setImportText('')} 
              variant="secondary"
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configuration Schema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 p-4 rounded-lg text-sm">
            <p className="font-semibold mb-2">Required fields:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li><code>id</code> - UUID</li>
              <li><code>name</code> - Configuration name</li>
              <li><code>version</code> - Semver (e.g., "1.0.0")</li>
              <li><code>targetUrl</code> - Base URL</li>
              <li><code>pages[]</code> - Array of page configurations</li>
              <li><code>metadata</code> - Metadata object</li>
            </ul>

            <p className="font-semibold mt-4 mb-2">Page structure:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li><code>name</code> - Page name (e.g., "Catalog", "Work")</li>
              <li><code>urlPattern</code> - URL pattern to match</li>
              <li><code>fields[]</code> - Array of field definitions</li>
              <li><code>loadStrategy</code> - Load strategy config</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
