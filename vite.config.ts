/// <reference types="vitest" />
import {defineConfig} from 'vite';
import vue from '@vitejs/plugin-vue';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['pouchdb'],
  },
  build: {
    chunkSizeWarningLimit: 1024,
  },
});
