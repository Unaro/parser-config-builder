/**
 * Главный компонент Popup приложения
 * @module popup/PopupApp
 * @version 1.0.0
 */

import { useEffect, useState } from 'react';
import { Button } from '@components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@components/ui/Card';
import { useParserConfigStore } from '@state/parser-config.store';
import { configRepository } from '@lib/storage/config-repository';
import { browser, tabs } from '@lib/utils/browser-api';
import type { ParserConfig } from '@lib/types/parser.types';

/**
 * PopupApp компонент
 */
export function PopupApp() {
  const { configs, setConfigs, setActiveConfig } = useParserConfigStore();
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [matchingConfigs, setMatchingConfigs] = useState<ParserConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void loadData();
  }, []);

  /**
   * Загрузить данные при открытии popup
   */
  const loadData = async () => {
    try {
      // Получить текущую вкладку
      const activeTab = await tabs.getActive();
      if (activeTab?.url) {
        setCurrentUrl(activeTab.url);
      }

      // Загрузить конфигурации из хранилища
      const storedConfigs = await configRepository.findAll();
      setConfigs(storedConfigs);

      // Найти подходящие конфигурации для текущего URL
      if (activeTab?.url) {
        const matching = await configRepository.findByUrl(activeTab.url);
        setMatchingConfigs(matching);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Открыть страницу настроек
   */
  const handleOpenOptions = () => {
    void browser.runtime.openOptionsPage();
  };

  /**
   * Активировать конфигурацию
   */
  const handleActivateConfig = async (configId: string) => {
    setActiveConfig(configId);
    await configRepository.setActive(configId);
    alert('Конфигурация активирована!');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Parser Config Builder</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {matchingConfigs.length > 0 ? (
            <>
              <p className="text-sm text-gray-600">
                Найдено конфигураций для этой страницы: {matchingConfigs.length}
              </p>
              
              <div className="space-y-2">
                {matchingConfigs.map((config) => (
                  <div
                    key={config.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{config.name}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {typeof config.targetUrl === 'string' ? config.targetUrl : 'RegExp'}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => void handleActivateConfig(config.id)}
                    >
                      Использовать
                    </Button>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">
                Нет конфигураций для этой страницы
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {currentUrl && `URL: ${currentUrl.substring(0, 40)}...`}
              </p>
            </div>
          )}

          <div className="pt-3 border-t space-y-2">
            <Button
              variant="secondary"
              fullWidth
              onClick={handleOpenOptions}
            >
              Управление конфигурациями
            </Button>
            
            <div className="text-xs text-center text-gray-400">
              Всего конфигураций: {configs.length}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
