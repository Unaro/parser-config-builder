/**
 * ConfigEditor - просмотр конфигурации
 * @module components/features/ConfigEditor
 * @version 2.0.0
 */

import { Card, CardHeader, CardTitle, CardContent } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import type { ParserConfig } from '@lib/types/parser.types';

interface ConfigEditorProps {
  config: ParserConfig;
  onBack: () => void;
}

export function ConfigEditor({ config, onBack }: ConfigEditorProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Configuration Details: {config.name}</CardTitle>
            <Button variant="secondary" onClick={onBack}>
              &larr; Back
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Base URL</label>
            <div className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded">
              {config.targetUrl}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Version</label>
            <div className="text-sm text-gray-900">{config.version}</div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Pages ({config.pages.length})</h3>
            
            {config.pages.map((page) => (
              <div key={page.id} className="bg-purple-50 border-2 border-purple-200 rounded-lg p-6 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-purple-900">{page.name}</h4>
                  <span className="px-3 py-1 bg-purple-200 text-purple-800 rounded-full text-xs font-medium">
                    {page.loadStrategy.type}
                  </span>
                </div>

                <div className="mb-4">
                  <span className="text-sm text-gray-700">URL Pattern:</span>
                  <code className="ml-2 text-sm bg-white px-2 py-1 rounded">{page.urlPattern}</code>
                </div>

                {page.loadStrategy.selector && (
                  <div className="mb-4">
                    <span className="text-sm text-gray-700">Load Strategy Selector:</span>
                    <code className="ml-2 text-sm bg-white px-2 py-1 rounded">{page.loadStrategy.selector}</code>
                  </div>
                )}

                <div>
                  <h5 className="font-medium mb-3">Fields ({page.fields.length})</h5>
                  <div className="space-y-2">
                    {page.fields.map((field) => (
                      <div key={field.id} className="bg-white rounded-lg p-4 border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">{field.name}</span>
                          <div className="flex gap-2">
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                              {field.type}
                            </span>
                            {field.required && (
                              <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded">
                                Required
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-gray-600 mb-2">
                          <strong>Key:</strong> <code className="bg-gray-100 px-1 py-0.5 rounded">{field.key}</code>
                        </div>
                        <div className="text-xs text-gray-700">
                          <strong>Selector:</strong>
                        </div>
                        <code className="block text-xs text-gray-700 bg-gray-50 px-2 py-1 rounded mt-1 overflow-x-auto">
                          {field.selector}
                        </code>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Tip:</strong> To edit this configuration, visit the target website and use the gear sidebar to modify pages and fields.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onBack}>
          Close
        </Button>
      </div>
    </div>
  );
}
