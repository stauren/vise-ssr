import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  projects: [
    '<rootDir>packages/core/jest.config.ts',
    '<rootDir>packages/app-vue3-intro/jest.config.ts',
  ],
};

export default config;
