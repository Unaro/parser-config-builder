/**
 * Глобальные типы для расширения
 */

declare global {
  interface Window {
    parserConfigContentScript?: unknown;
  }
  
  // eslint-disable-next-line no-var
  var parserConfigBackground: unknown | undefined;
}

export {};
