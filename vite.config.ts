import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  base: '/car-race/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'ES2022',
  },
});
