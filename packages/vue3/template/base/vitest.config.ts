import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import Vue from '@vitejs/plugin-vue';

import { defineConfig } from 'vitest/config';

const DIR_NAME = dirname(fileURLToPath(import.meta.url));

const timeout = 30000;

export default defineConfig({
  plugins: [
    Vue(),
  ],
  resolve: {
    alias: {
      '@': resolve(DIR_NAME, './src'),
    },
  },
  test: {
    include: ['./src/**/*.spec.[tj]s'],
    exclude: ['node_modules'],
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
