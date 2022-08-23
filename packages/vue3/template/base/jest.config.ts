import type { Config } from '@jest/types';

const baseConfig: Config.InitialOptions = {
  modulePaths: [
    '<rootDir>',
  ],
  verbose: true,
  moduleFileExtensions: [
    'js',
    'ts',
    'json',
    'vue',
  ],
  transform: {
    '^.+\\.vue$': 'vue-jest',
    '^.+\\.tsx?$': 'ts-jest',
    '.+\\.(css|styl|less|sass|scss|svg|png|jpg|ttf|woff|woff2)$': 'jest-transform-stub',
  },
  transformIgnorePatterns: [
    '/node_modules/',
  ],
  moduleNameMapper: {
    '\\.(s?css|less)$': 'identity-obj-proxy',
  },
  snapshotSerializers: [
    'jest-serializer-vue',
  ],
  testMatch: [
    '**/__test__/**/*.spec.(js|ts)',
  ],
  testPathIgnorePatterns: [
    '<rootDir>/.*(.mock.ts)$',
  ],
  testURL: 'http://localhost/',
  collectCoverage: true,
  collectCoverageFrom: [
    '<rootDir>/**/src/**/*.{ts,js,vue}',
    '!<rootDir>/**/src/data/env.ts',
    '!<rootDir>/**/src/server-hooks.ts',
    '!<rootDir>/**/src/**/*.mock.ts',
  ],
  coverageDirectory: '<rootDir>/coverage/',
  coverageReporters: ['html', 'lcov', 'json', 'text-summary', 'clover'],
  reporters: ['default', 'jest-html-reporters'],
  testEnvironment: 'jsdom',
};

const config: Config.InitialOptions = Object.assign({}, baseConfig, {
  rootDir: '.',
  moduleNameMapper: {
    '^@/(.*)': '<rootDir>/src/$1',
  },
  globals: {
    'vue-jest': {
      tsconfig: '<rootDir>/tsconfig.json',
    },
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.json',
      useESM: true,
    },
  },
});

export default config;
