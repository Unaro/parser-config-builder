import { describe, it, expect, beforeEach } from 'vitest';
import { parserService } from '@lib/parser/parser.service';
import type { ParserConfig } from '@lib/types/parser.types';

describe('ParserService', () => {
  let mockConfig: ParserConfig;

  beforeEach(() => {
    mockConfig = {
      id: 'test-id',
      name: 'Test Parser',
      version: '1.0.0',
      targetUrl: 'https://test.com',
      pages: [
        {
          id: 'page-1',
          name: 'Test Page',
          urlPattern: '/manga/*',
          fields: [],
          loadStrategy: { type: 'static' },
          customObjectTypes: []
        }
      ],
      metadata: {
        created: new Date(),
        updated: new Date(),
        author: 'test',
        tags: [],
        siteUrl: 'https://test.com'
      }
    };
  });

  it('should detect page type by URL', () => {
    const result = parserService.detectPageType(mockConfig, 'https://test.com/manga/123');
    expect(result).toBeDefined();
    expect(result?.name).toBe('Test Page');
  });

  it('should return undefined for non-matching URL', () => {
    const result = parserService.detectPageType(mockConfig, 'https://test.com/other/path');
    expect(result).toBeUndefined();
  });
});
