/**
 * Popup приложение для расширения
 * @module popup
 * @version 1.0.0
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PopupApp } from './PopupApp';
import './styles.css';

const container = document.getElementById('root');
if (!container) throw new Error('Root element not found');

const root = createRoot(container);

root.render(
  <StrictMode>
    <PopupApp />
  </StrictMode>
);
