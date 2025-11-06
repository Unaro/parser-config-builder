/**
 * ConfigList - компонент списка конфигураций парсера
 * @module components/features/ConfigList
 * @version 1.0.0
 */

import { Card, CardContent } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { useParserConfigStore } from '@state/parser-config.store';
import { eventBus } from '@lib/events/event-bus';
import { ParserEventFactory } from '@lib/events/parser.events';

/**
 * ConfigList компонент
 */
export function ConfigList() {
  const { configs, activeConfigId, setActiveConfig, deleteConfig } = useParserConfigStore();

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить эту конфигурацию?')) return;
    
    deleteConfig(id);
    const event = ParserEventFactory.createConfigDeleted(id);
    await eventBus.publish(event);
  };

  if (configs.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg">Нет созданных конфигураций</p>
        <p className="text-sm mt-2">Создайте первую конфигурацию парсера</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {configs.map((config) => (
        <Card
          key={config.id}
          variant={activeConfigId === config.id ? 'bordered' : 'default'}
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => setActiveConfig(config.id)}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{config.name}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {typeof config.targetUrl === 'string' ? config.targetUrl : 'RegExp'}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Обновлено: {new Date(config.metadata.updated).toLocaleDateString()}
                </p>
              </div>

              <div className="flex gap-2 ml-4">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveConfig(config.id);
                  }}
                >
                  Редактировать
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleDelete(config.id);
                  }}
                >
                  Удалить
                </Button>
              </div>
            </div>

            {activeConfigId === config.id && (
              <div className="mt-3 pt-3 border-t">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Активная конфигурация
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
