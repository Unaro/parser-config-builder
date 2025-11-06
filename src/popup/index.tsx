/**
 * Popup entry point
 * @module popup
 * @version 2.0.0
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PopupApp } from './PopupApp';
import '../index.css';

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root element not found');
}

const root = createRoot(container);

root.render(
  <StrictMode>
    <PopupApp />
  </StrictMode>
);

console.log('[Popup] Parser Config Builder popup loaded');
