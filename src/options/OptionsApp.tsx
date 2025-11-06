/**
 * Главный компонент Options приложения
 * @module options/OptionsApp
 * @version 1.0.0
 */

import { useEffect, useState } from 'react';
import { Button } from '@components/ui/Button';
import { ConfigBuilder } from '@components/features/ConfigBuilder';
import { ConfigList } from '@components/features/ConfigList';
import { useParserConfigStore } from '@state/parser-config.store';
import { configRepository } from '@lib/storage/config-repository';

type View = 'list' | 'create' | 'edit';

/**
 * OptionsApp компонент
 */
export function OptionsApp() {
  const { configs, setConfigs, setActiveConfig } = useParserConfigStore();
  const [currentView, setCurrentView] = useState<View>('list');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void loadConfigs();
  }, []);

  /**
   * Загрузить конфигурации из хранилища
   */
  const loadConfigs = async () => {
    try {
      const storedConfigs = await configRepository.findAll();
      setConfigs(storedConfigs);
      
      const activeConfig = await configRepository.getActive();
      if (activeConfig) {
        setActiveConfig(activeConfig.id);
      }
    } catch (error) {
      console.error('Error loading configs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Создать новую конфигурацию
   */
  const handleCreateNew = () => {
    setActiveConfig(null);
    setCurrentView('create');
  };

  /**
   * Вернуться к списку
   */
  const handleBackToList = () => {
    setCurrentView('list');
    void loadConfigs();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading configurations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Parser Config Builder
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Manage parser configurations for manga/comic sites
              </p>
            </div>

            {currentView === 'list' && (
              <Button onClick={handleCreateNew}>
                Create Configuration
              </Button>
            )}

            {(currentView === 'create' || currentView === 'edit') && (
              <Button variant="secondary" onClick={handleBackToList}>
                Back to List
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'list' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                Configurations ({configs.length})
              </h2>
            </div>
            
            <ConfigList />

            {configs.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">���</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No configurations
                </h3>
                <p className="text-gray-600 mb-6">
                  Create your first parser configuration to get started
                </p>
                <Button onClick={handleCreateNew}>
                  Create First Configuration
                </Button>
              </div>
            )}
          </div>
        )}

        {(currentView === 'create' || currentView === 'edit') && (
          <ConfigBuilder />
        )}
      </main>

      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>Parser Config Builder v1.0.0</p>
            <p className="mt-1">
              Visual tool for creating parser configurations
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
