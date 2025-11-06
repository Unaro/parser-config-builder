/**
 * Vite конфигурация для Web Extension
 * @version 1.0.0
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import webExtension from 'vite-plugin-web-extension';
import path from 'path';

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    webExtension({
      manifest: mode === 'firefox' 
        ? './public/manifest.firefox.json'
        : './public/manifest.json',
      watchFilePaths: ['src/**/*'],
      additionalInputs: [
        'src/popup/index.html',
        'src/options/index.html'
      ]
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@components': path.resolve(__dirname, './src/components'),
      '@state': path.resolve(__dirname, './src/state')
    }
  },
  build: {
    outDir: mode === 'firefox' ? 'dist-firefox' : 'dist-chrome',
    rollupOptions: {
      input: {
        popup: 'src/popup/index.html',
        options: 'src/options/index.html',
        background: 'src/background/index.ts',
        content: 'src/content/index.ts'
      }
    }
  }
}));
