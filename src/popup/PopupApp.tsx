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
import { useCurrentTab } from '@lib/hooks/use-current-tab';
import { useStorageSync } from '@lib/hooks/use-storage-sync';
import type { ParserConfig } from '@lib/types/parser.types';

/**
 * PopupApp компонент
 */
export function PopupApp() {
  const { configs } = useParserConfigStore();
  const { url, isLoading: tabLoading } = useCurrentTab();
  const [matchingConfigs, setMatchingConfigs] = useState<ParserConfig[]>([]);
  
  useStorageSync();

  useEffect(() => {
    if (url) {
      void findMatchingConfigs(url);
    }
  }, [url, configs]);

  const findMatchingConfigs = async (currentUrl: string) => {
    const matching = await configRepository.findByUrl(currentUrl);
    setMatchingConfigs(matching);
  };

  const handleOpenOptions = () => {
    void browser.runtime.openOptionsPage();
  };

  const handleActivateConfig = async (configId: string) => {
    await configRepository.setActive(configId);
    alert('Configuration activated!');
  };

  const handleCreateOnPage = async () => {
    const activeTab = await tabs.getActive();
    if (!activeTab?.id) return;

    // Отправляем сообщение в content script для открытия Sidebar
    await tabs.sendMessage(activeTab.id, { type: 'OPEN_SIDEBAR' });
    window.close();
  };

  if (tabLoading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading...</p>
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
                Found {matchingConfigs.length} configuration(s)
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
                      Use
                    </Button>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">
                No configurations for this page
              </p>
              {url && (
                <p className="text-xs text-gray-400 mt-1 truncate" title={url}>
                  {url.substring(0, 50)}...
                </p>
              )}
            </div>
          )}

          <div className="pt-3 border-t space-y-2">
            <Button
              variant="primary"
              fullWidth
              onClick={handleCreateOnPage}
            >
              Create Config on This Page
            </Button>
            
            <Button
              variant="secondary"
              fullWidth
              onClick={handleOpenOptions}
            >
              Manage All Configs
            </Button>
            
            <div className="text-xs text-center text-gray-400">
              Total: {configs.length}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
