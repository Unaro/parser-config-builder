/**
 * Parser Service Tests v4.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ParserService } from '@lib/parser/parser.service';
import type { ParserConfig } from '@lib/types/parser.types';

describe('ParserService', () => {
  let parserService: ParserService;
  let mockConfig: ParserConfig;

  beforeEach(() => {
    parserService = new ParserService();
    mockConfig = {
      id: 'test-config',
      name: 'Test Config',
      version: '4.0.0',
      targetUrl: 'https://test.com',
      pages: [
        {
          id: 'page-1',
          name: 'Test Page',
          urlPattern: 'https://test.com/manga/*',
          commonFields: [],
          fields: [],
          loadStrategy: { type: 'static' },
          customObjectTypes: [],
          subPages: []
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

  it('should detect page and subpage', () => {
    const result = parserService.detectPageAndSubPage(mockConfig, 'https://test.com/manga/123');
    expect(result.page).toBeDefined();
  });

  it('should return undefined for non-matching URL', () => {
    const result = parserService.detectPageAndSubPage(mockConfig, 'https://test.com/other/path');
    expect(result.page).toBeUndefined();
  });
});
