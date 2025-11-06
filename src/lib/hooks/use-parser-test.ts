/**
 * Хук для тестирования конфигурации парсера
 * @module hooks/use-parser-test
 * @version 1.0.0
 */

import { useState } from 'react';
import { eventBus } from '@lib/events/event-bus';
import { ParserEventFactory } from '@lib/events/parser.events';
import type { ParserConfig, ParsedData } from '@lib/types/parser.types';
import { tabs } from '@lib/utils/browser-api';

interface TestResult {
  success: boolean;
  data?: ParsedData;
  error?: string;
  duration: number;
}

/**
 * Хук для тестирования парсера на текущей странице
 */
export function useParserTest() {
  const [isTesting, setIsTesting] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  const testConfig = async (config: ParserConfig): Promise<void> => {
    setIsTesting(true);
    setResult(null);

    const startTime = performance.now();

    try {
      // Получаем текущую вкладку
      const activeTab = await tabs.getActive();
      if (!activeTab?.id) {
        throw new Error('No active tab found');
      }

      // Отправляем сообщение в content script для выполнения парсинга
      const response = await tabs.sendMessage<
        { type: 'PARSE_PAGE'; config: ParserConfig },
        ParsedData
      >(activeTab.id, {
        type: 'PARSE_PAGE',
        config
      });

      const duration = performance.now() - startTime;

      setResult({
        success: true,
        data: response,
        duration
      });

      // Публикуем событие успешного теста
      const event = ParserEventFactory.createTestExecuted(
        config.id,
        response,
        true,
        duration
      );
      await eventBus.publish(event);
    } catch (error) {
      const duration = performance.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      setResult({
        success: false,
        error: errorMessage,
        duration
      });
    } finally {
      setIsTesting(false);
    }
  };

  return {
    testConfig,
    isTesting,
    result,
    clearResult: () => setResult(null)
  };
}
