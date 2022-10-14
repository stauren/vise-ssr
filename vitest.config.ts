import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import Vue from '@vitejs/plugin-vue';

import { defineConfig } from 'vitest/config';

const DIR_NAME = dirname(fileURLToPath(import.meta.url));

const timeout = process.env.CI ? 50000 : 30000;

export default defineConfig({
  plugins: [
    Vue(),
  ],
  resolve: {
    alias: {
      '@': resolve(DIR_NAME, './packages/app-vue3-intro/src'),
    },
  },
  test: {
    include: ['./packages/**/*.spec.[tj]s'],
    exclude: ['./packages/vue3/template', './packages/react/template', './packages/**/node_modules'],
    setupFiles: [],
    globalSetup: [],
    testTimeout: timeout,
    hookTimeout: timeout,
    reporters: 'dot',
    environment: 'jsdom',
  },
  esbuild: {
    target: 'node16',
  },
});
