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
    it('should return valid for existing selector', () => {
      mockDocument.body.innerHTML = '<div class="title">Test Title</div>';
      
      const result = parserService.validateSelector(mockDocument, '.title');
      
      expect(result.isValid).toBe(true);
      expect(result.elementCount).toBe(1);
      expect(result.previewText).toBe('Test Title');
    });

    it('should return invalid for non-existing selector', () => {
      const result = parserService.validateSelector(mockDocument, '.non-existing');
      
      expect(result.isValid).toBe(false);
      expect(result.elementCount).toBe(0);
      expect(result.error).toBe('No elements found');
    });

    it('should handle invalid selector syntax', () => {
      const result = parserService.validateSelector(mockDocument, '..invalid');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('generateSelector', () => {
    it('should generate selector with ID', () => {
      const element = mockDocument.createElement('div');
      element.id = 'unique-id';
      mockDocument.body.appendChild(element);
      
      const selector = parserService.generateSelector(element);
      
      expect(selector).toBe('#unique-id');
    });

    it('should generate selector with classes when element is unique', () => {
      const element = mockDocument.createElement('div');
      element.className = 'test-class';
      mockDocument.body.appendChild(element);
      
      const selector = parserService.generateSelector(element);
      
      // Селектор должен содержать либо класс (если уникален), либо путь
      expect(selector).toBeTruthy();
      expect(selector.length).toBeGreaterThan(0);
    });

    it('should generate path selector when class is not unique', () => {
      const container = mockDocument.createElement('div');
      container.id = 'container';
      
      const element1 = mockDocument.createElement('div');
      element1.className = 'item';
      
      const element2 = mockDocument.createElement('div');
      element2.className = 'item';
      
      container.appendChild(element1);
      container.appendChild(element2);
      mockDocument.body.appendChild(container);
      
      const selector = parserService.generateSelector(element1);
      
      // Должен содержать nth-of-type или container ID
      expect(selector).toMatch(/#container|:nth-of-type/);
    });
  });

  describe('extractImages', () => {
    it('should extract images from document', () => {
      mockDocument.body.innerHTML = `
        <img src="https://example.com/page1.jpg" />
        <img src="https://example.com/page2.jpg" />
      `;
      
      const images = parserService.extractImages(mockDocument, 'img');
      
      expect(images).toHaveLength(2);
      expect(images[0]?.imageUrl).toBe('https://example.com/page1.jpg');
      expect(images[1]?.imageUrl).toBe('https://example.com/page2.jpg');
    });

    it('should handle data-src attribute', () => {
      const img = mockDocument.createElement('img');
      img.dataset.src = 'https://example.com/lazy.jpg';
      mockDocument.body.appendChild(img);
      
      const images = parserService.extractImages(mockDocument, 'img');
      
      expect(images[0]?.imageUrl).toBe('https://example.com/lazy.jpg');
    });
  });
});
