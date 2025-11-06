/**
 * ConfigBuilder - компонент для визуального построения конфигурации парсера
 * @module components/features/ConfigBuilder
 * @version 1.0.0
 */

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@components/ui/Card';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';
import { SelectorInput } from './SelectorInput';
import { ParserTester } from './ParserTester';
import { useParserConfigStore } from '@state/parser-config.store';
import { eventBus } from '@lib/events/event-bus';
import { ParserEventFactory } from '@lib/events/parser.events';
import type { ParserConfig, SelectorConfig } from '@lib/types/parser.types';

/**
 * ConfigBuilder компонент
 */
export function ConfigBuilder() {
  const { activeConfigId, configs, addConfig, updateConfig } = useParserConfigStore();
  const activeConfig = configs.find(c => c.id === activeConfigId);

  const [name, setName] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [selectors, setSelectors] = useState<Partial<SelectorConfig>>({
    title: '',
    chapters: '',
    images: ''
  });
  const [savedConfig, setSavedConfig] = useState<ParserConfig | null>(null);

  useEffect(() => {
    if (activeConfig) {
      setName(activeConfig.name);
      setTargetUrl(typeof activeConfig.targetUrl === 'string' ? activeConfig.targetUrl : '');
      setSelectors(activeConfig.selectors);
      setSavedConfig(activeConfig);
    }
  }, [activeConfig]);

  /**
   * Сохранить конфигурацию
   */
  const handleSave = async () => {
    if (!name || !targetUrl || !selectors.title || !selectors.chapters || !selectors.images) {
      alert('Please fill all required fields');
      return;
    }

    const config: ParserConfig = {
      id: activeConfig?.id || crypto.randomUUID(),
      name,
      version: '1.0.0',
      targetUrl,
      selectors: selectors as SelectorConfig,
      metadata: {
        created: activeConfig?.metadata.created || new Date(),
        updated: new Date(),
        author: 'user',
        tags: [],
        siteUrl: targetUrl
      }
    };

    if (activeConfig) {
      updateConfig(config.id, config);
      const event = ParserEventFactory.createConfigUpdated(config);
      await eventBus.publish(event);
    } else {
      addConfig(config);
      const event = ParserEventFactory.createConfigCreated(config);
      await eventBus.publish(event);
    }

    setSavedConfig(config);
    alert('Configuration saved!');
  };

  return (
    <div className="space-y-6">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>
            {activeConfig ? 'Edit Configuration' : 'Create Parser Configuration'}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <Input
            label="Configuration Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., MangaReader.to Parser"
            required
            fullWidth
          />

          <Input
            label="Site URL"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            placeholder="https://mangareader.to"
            type="url"
            required
            fullWidth
          />

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">CSS Selectors</h3>
            
            <div className="space-y-4">
              <SelectorInput
                label="Title *"
                value={selectors.title || ''}
                selectorType="title"
                onChange={(value) => setSelectors({ ...selectors, title: value })}
                required
              />

              <SelectorInput
                label="Chapters List *"
                value={selectors.chapters || ''}
                selectorType="chapters"
                onChange={(value) => setSelectors({ ...selectors, chapters: value })}
                required
              />

              <SelectorInput
                label="Page Images *"
                value={selectors.images || ''}
                selectorType="images"
                onChange={(value) => setSelectors({ ...selectors, images: value })}
                required
              />

              <SelectorInput
                label="Author"
                value={selectors.author || ''}
                selectorType="author"
                onChange={(value) => setSelectors({ ...selectors, author: value })}
              />

              <SelectorInput
                label="Description"
                value={selectors.description || ''}
                selectorType="description"
                onChange={(value) => setSelectors({ ...selectors, description: value })}
              />

              <SelectorInput
                label="Cover Image"
                value={selectors.cover || ''}
                selectorType="cover"
                onChange={(value) => setSelectors({ ...selectors, cover: value })}
              />
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => window.history.back()}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Configuration
          </Button>
        </CardFooter>
      </Card>

      {savedConfig && (
        <div className="w-full max-w-4xl mx-auto">
          <ParserTester config={savedConfig} />
        </div>
      )}
    </div>
  );
}
