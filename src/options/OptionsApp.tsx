/**
 * Options - просмотр и управление конфигурациями
 * @module options/OptionsApp
 * @version 1.0.0
 */

import { useParserConfigStore } from '@state/parser-config.store';
import { useStorageSync } from '@lib/hooks/use-storage-sync';
import { ConfigList } from '@components/features/ConfigList';
import { Button } from '@components/ui/Button';

export function OptionsApp() {
  const { configs } = useParserConfigStore();
  useStorageSync();

  const handleCreateNew = () => {
    alert('Please navigate to the target website and click the ⚙️ button on the right side to create a configuration!');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Parser Config Builder</h1>
              <p className="text-sm text-gray-500 mt-1">Manage parser configurations</p>
            </div>
            <Button onClick={handleCreateNew}>
              How to Create Config
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Configurations ({configs.length})</h2>
          
          <ConfigList />

          {configs.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">���</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No configurations yet</h3>
              <p className="text-gray-600 mb-6">
                Navigate to a manga/comic website and click the ⚙️ button to create your first configuration
              </p>
            </div>
          )}
        </div>
      </main>

      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>Parser Config Builder v1.0.0</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
