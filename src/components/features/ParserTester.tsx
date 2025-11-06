/**
 * ParserTester - компонент для тестирования конфигурации парсера
 * @module components/features/ParserTester
 * @version 1.0.0
 */

import { Button } from '@components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@components/ui/Card';
import { useParserTest } from '@lib/hooks/use-parser-test';
import type { ParserConfig } from '@lib/types/parser.types';

export interface ParserTesterProps {
  config: ParserConfig;
}

/**
 * ParserTester компонент
 */
export function ParserTester({ config }: ParserTesterProps) {
  const { testConfig, isTesting, result, clearResult } = useParserTest();

  const handleTest = () => {
    void testConfig(config);
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-lg">Test Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">
          Test this configuration on the current page to verify selectors work correctly.
        </p>

        <Button
          onClick={handleTest}
          isLoading={isTesting}
          disabled={isTesting}
          fullWidth
        >
          {isTesting ? 'Testing...' : 'Test on Current Page'}
        </Button>

        {result && (
          <div className={`p-4 rounded-lg ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            {result.success && result.data ? (
              <div className="space-y-2">
                <p className="font-semibold text-green-800">Test Successful!</p>
                <p className="text-sm text-gray-700">Duration: {result.duration.toFixed(0)}ms</p>
                
                <div className="mt-3 space-y-1 text-sm">
                  <p><strong>Title:</strong> {result.data.title || 'Not found'}</p>
                  {result.data.author && <p><strong>Author:</strong> {result.data.author}</p>}
                  <p><strong>Chapters:</strong> {result.data.chapters.length} found</p>
                  {result.data.tags && result.data.tags.length > 0 && (
                    <p><strong>Tags:</strong> {result.data.tags.join(', ')}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="font-semibold text-red-800">Test Failed</p>
                <p className="text-sm text-red-700">{result.error}</p>
                <p className="text-sm text-gray-600">Duration: {result.duration.toFixed(0)}ms</p>
              </div>
            )}

            <Button
              size="sm"
              variant="ghost"
              onClick={clearResult}
              className="mt-3"
            >
              Clear Results
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
