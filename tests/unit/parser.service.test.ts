/**
 * Unit тесты для ParserService
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { parserService } from '@lib/parser/parser.service';

describe('ParserService', () => {
  let mockDocument: Document;

  beforeEach(() => {
    mockDocument = document.implementation.createHTMLDocument('Test');
  });

  describe('validateSelector', () => {
    it('should validate string selector', () => {
      mockDocument.body.innerHTML = '<div class="title">Test</div>';
      const result = parserService.validateSelector(mockDocument, '.title', 'string');
      expect(result.isValid).toBe(true);
      expect(result.elementCount).toBe(1);
    });

    it('should validate array selector', () => {
      mockDocument.body.innerHTML = '<div class="tag">Action</div><div class="tag">Comedy</div>';
      const result = parserService.validateSelector(mockDocument, '.tag', 'array');
      expect(result.isValid).toBe(true);
      expect(result.elementCount).toBe(2);
      expect(result.arrayPreview).toEqual(['Action', 'Comedy']);
    });
  });

  describe('generateSelector', () => {
    it('should generate simple selector', () => {
      const element = mockDocument.createElement('div');
      element.id = 'unique';
      mockDocument.body.appendChild(element);
      expect(parserService.generateSelector(element)).toBe('#unique');
    });

    it('should generate array selector', () => {
      const container = mockDocument.createElement('div');
      container.className = 'tags';
      const tag1 = mockDocument.createElement('span');
      tag1.className = 'tag';
      const tag2 = mockDocument.createElement('span');
      tag2.className = 'tag';
      container.appendChild(tag1);
      container.appendChild(tag2);
      mockDocument.body.appendChild(container);
      
      const selector = parserService.generateSelector(tag1, true);
      expect(selector).toContain('tag');
    });
  });
});
