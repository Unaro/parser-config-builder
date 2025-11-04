import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@/components': resolve(__dirname, 'src/components'),
      '@/utils': resolve(__dirname, 'src/utils'),
      '@/types': resolve(__dirname, 'src/types'),
    },
  },
  
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/popup.html'),
        sidebar: resolve(__dirname, 'src/sidebar/sidebar.html'),
        'content-script': resolve(__dirname, 'src/content/content-script.ts'),
        background: resolve(__dirname, 'src/background/background.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: (assetInfo) => {
          const extType = assetInfo.name?.split('.').pop();
          if (extType === 'css') {
            return '[name].css';
          }
          return '[name].[ext]';
        },
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: mode === 'development',
  },

  define: {
    'process.env.NODE_ENV': JSON.stringify(mode),
  },

  server: {
    port: 3000,
    hmr: {
      port: 3001,
    },
  },
}));
