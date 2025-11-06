/**
 * Хук для синхронизации Zustand store с browser.storage
 * @module hooks/use-storage-sync
 * @version 1.0.0
 */

import { useEffect } from 'react';
import { useParserConfigStore } from '@state/parser-config.store';
import { configRepository } from '@lib/storage/config-repository';

/**
 * Хук для синхронизации store с storage при монтировании
 */
export function useStorageSync() {
  const { setConfigs, setActiveConfig } = useParserConfigStore();

  useEffect(() => {
    const loadFromStorage = async () => {
      try {
        const configs = await configRepository.findAll();
        setConfigs(configs);

        const activeConfig = await configRepository.getActive();
        if (activeConfig) {
          setActiveConfig(activeConfig.id);
        }
      } catch (error) {
        console.error('Error loading from storage:', error);
      }
    };

    void loadFromStorage();
  }, [setConfigs, setActiveConfig]);
}
