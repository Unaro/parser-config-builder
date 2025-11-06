/**
 * ConfigList для multi-page конфигураций
 * @module components/features/ConfigList
 * @version 2.0.0
 */

import { Card, CardContent } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { useParserConfigStore } from '@state/parser-config.store';
import { browser } from '@lib/utils/browser-api';
import type { CustomField } from '@lib/types/parser.types';

export function ConfigList() {
  const { configs, activeConfigId, setActiveConfig, deleteConfig } = useParserConfigStore();

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

  if (configs.length === 0) {
    return null;
  }

  // Подсчет всех полей во всех страницах
  const getTotalFields = (pages: readonly { fields: readonly CustomField[] }[]) => {
    return pages.reduce((total, page) => total + page.fields.length, 0);
  };

  // Получение всех полей для превью
  const getAllFields = (pages: readonly { fields: readonly CustomField[] }[]): readonly CustomField[] => {
    return pages.flatMap(page => page.fields);
  };

  return (
    <div className="space-y-3">
      {configs.map((config) => {
        const totalFields = getTotalFields(config.pages);
        const allFields = getAllFields(config.pages);

        return (
          <Card
            key={config.id}
            variant={activeConfigId === config.id ? 'bordered' : 'default'}
            className="hover:shadow-md transition-shadow"
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{config.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{config.targetUrl}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    Pages: {config.pages.length} | Fields: {totalFields} | Updated: {new Date(config.metadata.updated).toLocaleDateString()}
                  </p>
                  
                  {/* Показываем страницы */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {config.pages.map(page => (
                      <span
                        key={page.id}
                        className="inline-flex items-center px-2 py-1 rounded text-xs bg-purple-100 text-purple-700 font-medium"
                      >
                        {page.name} ({page.fields.length})
                      </span>
                    ))}
                  </div>

                  {/* Показываем первые 5 полей */}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {allFields.slice(0, 5).map(field => (
                      <span
                        key={field.id}
                        className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700"
                      >
                        {field.name}
                      </span>
                    ))}
                    {totalFields > 5 && (
                      <span className="text-xs text-gray-500">+{totalFields - 5} more</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleSetActive(config.id)}
                  >
                    {activeConfigId === config.id ? 'Active' : 'Activate'}
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => void handleDelete(config.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
