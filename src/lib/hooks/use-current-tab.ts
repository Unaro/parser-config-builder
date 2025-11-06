/**
 * Хук для работы с текущей вкладкой браузера
 * @module hooks/use-current-tab
 * @version 1.0.0
 */

import { useState, useEffect } from 'react';
import { tabs } from '@lib/utils/browser-api';
import type Browser from 'webextension-polyfill';

/**
 * Хук для получения информации о текущей вкладке
 */
export function useCurrentTab() {
  const [tab, setTab] = useState<Browser.Tabs.Tab | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTab = async () => {
      try {
        const activeTab = await tabs.getActive();
        setTab(activeTab || null);
      } catch (error) {
        console.error('Error loading current tab:', error);
      } finally {
        setIsLoading(false);
      }
    };

    void loadTab();
  }, []);

  return { tab, isLoading, url: tab?.url, title: tab?.title };
}
