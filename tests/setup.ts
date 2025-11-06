/**
 * Setup для тестов
 */

import { vi } from 'vitest';
import type { Browser } from 'webextension-polyfill';

// Mock webextension-polyfill
(globalThis as typeof globalThis & { browser: Partial<Browser> }).browser = {
  runtime: {
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn()
    } as any,
    getURL: vi.fn((path: string) => `chrome-extension://test/${path}`),
    openOptionsPage: vi.fn()
  } as any,
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn()
    }
  } as any,
  tabs: {
    query: vi.fn(),
    sendMessage: vi.fn(),
    create: vi.fn()
  } as any
};
