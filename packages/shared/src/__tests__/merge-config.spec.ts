import type { Plugin } from 'vite';
import { describe, expect, test } from 'vitest';
import type { RenderContext, ViseConfig } from './test-types';
import mergeConfig from '../merge-config';

describe('mergeConfig', () => {
  test('handles configs with different ports', () => {
    const baseConfig: Partial<ViseConfig> = {
      devPort: 3000,
    };

    const newConfig = {
      devPort: 4000,
    };

    const mergedConfig = {
      devPort: 4000,
    };

    expect(mergeConfig(baseConfig, newConfig)).toEqual(mergedConfig);
  });

  test('merge configs merge array', () => {
    const plugin1: Plugin = {
      name: 'my-plugin-1',
      enforce: 'pre',
      config: conf => conf,
    };
    const plugin2: Plugin = {
      name: 'my-plugin-2',
      enforce: 'pre',
      config: conf => conf,
    };
    const baseConfig: Partial<ViseConfig> = {
      plugin: plugin1,
      ssr: {
        external: ['react'],
      },
    };

    const newConfig: Partial<ViseConfig> = {
      ssr: {
        external: ['react-redux'],
      },
      plugin: [plugin2],
    };

    const mergedConfig: Partial<ViseConfig> = {
      ssr: {
        external: ['react', 'react-redux'],
      },
      plugin: [plugin1, plugin2],
    };
    expect(mergeConfig(baseConfig, newConfig)).toEqual(mergedConfig);
  });

  test('handles configs merge empty value', () => {
    const baseConfig: Partial<ViseConfig> = {
    };

    const newConfig = {
      base: './',
      // base: 100,
    };

    const mergedConfig = {
      base: './',
    };

    expect(mergeConfig(baseConfig, newConfig)).toEqual(mergedConfig);
  });

  test('handles configs merge nested object', () => {
    const baseConfig: Partial<ViseConfig> = {
      ssr: {
        target: 'node',
      },
    };

    const newConfig: Partial<ViseConfig> = {
      ssr: {
        format: 'esm',
      },
    };

    const mergedConfig = {
      ssr: {
        format: 'esm',
        target: 'node',
      },
    };

    expect(mergeConfig(baseConfig, newConfig)).toEqual(mergedConfig);
  });
});

describe('mergeContext', () => {
  test('handles RenderContext', () => {
    const inputContext: RenderContext = {
      request: {
        url: 'http://127.0.0.1/',
        headers: {},
      },
      response: {
        code: 200,
        headers: {},
        body: 'hello world',
      },
      extra: {
        title: 'page title',
        data: {
          count: 5,
        },
      },
    };

    const myModification = {
      extra: {
        title: '5000',
        // title: 5000,
        myData: 5000,
        data: {
          count: 6,
        },
      },
    };

    const outputContext = {
      request: {
        url: 'http://127.0.0.1/',
        headers: {},
      },
      response: {
        code: 200,
        headers: {},
        body: 'hello world',
      },
      extra: {
        title: '5000',
        myData: 5000,
        data: {
          count: 6,
        },
      },
    };

    expect(mergeConfig(inputContext, myModification)).toEqual(outputContext);
  });
});
