import { resolve } from 'path';
import React from '@vitejs/plugin-react-swc';

import { defineConfig } from 'vitest/config';

const timeout = 30000;

export default defineConfig({
  plugins: [
    React(),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  test: {
    include: ['./src/**/*.spec.{js,ts,jsx,tsx}'],
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
