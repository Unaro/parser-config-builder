/**
 * Options entry point
 * @module options
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { OptionsApp } from './OptionsApp';
import { cleanInvalidConfigs } from '@lib/utils/config-migration';
import '../index.css';

console.log('[Options] Script started');

const container = document.getElementById('root');

if (!container) {
  console.error('[Options] Root element not found!');
  document.body.innerHTML = '<div style="padding: 20px; color: red; font-family: system-ui;">Error: Root element not found. Please reload the extension.</div>';
  throw new Error('Root element not found');
}

// Очищаем невалидные конфиги перед стартом
cleanInvalidConfigs()
  .then(() => {
    console.log('[Options] Storage cleaned');
    
    try {
      const root = createRoot(container);
      console.log('[Options] React root created');

      root.render(
        <StrictMode>
          <OptionsApp />
        </StrictMode>
      );
      
      console.log('[Options] App rendered');
    } catch (error) {
      console.error('[Options] Render error:', error);
      document.body.innerHTML = `<div style="padding: 20px; color: red; font-family: system-ui;">
        <h2>Render Error</h2>
        <pre>${error instanceof Error ? error.message : String(error)}</pre>
        <p>Please reload the extension or clear storage.</p>
      </div>`;
    }
  })
  .catch((error) => {
    console.error('[Options] Cleanup error:', error);
  });
