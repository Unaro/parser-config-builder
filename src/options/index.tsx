/**
 * Options приложение для расширения
 * @module options
 * @version 1.0.0
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { OptionsApp } from './OptionsApp';
import './styles.css';

const container = document.getElementById('root');
if (!container) throw new Error('Root element not found');

const root = createRoot(container);

root.render(
  <StrictMode>
    <OptionsApp />
  </StrictMode>
);
