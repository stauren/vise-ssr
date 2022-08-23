import type { Config } from '@jest/types';
import baseConfig from '../../jest.base';

const config: Config.InitialOptions = Object.assign({}, baseConfig, {
  rootDir: '.',
  moduleNameMapper: {
    '^@/(.*)': '<rootDir>/src/$1',
  },
  modulePathIgnorePatterns: ['<rootDir>/template/*'],
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.json',
      useESM: true,
      astTransformers: {
        // before: ['<rootDir>/dist/transformer.cjs', '<rootDir>/dist/transformer2.cjs'],
      },
    },
  },
});

export default config;
