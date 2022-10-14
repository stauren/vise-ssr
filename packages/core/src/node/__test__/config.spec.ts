import { describe, it, expect, vi } from 'vitest';
import path from 'path';
import {
  getViteDevConfig,
} from '../config';

vi.mock('../app-config', () => ({
  default: async () => ({
    htmlClass: 'dark',
    devPort: 3000,
    scaffold: 'react-app',
  }),
}));

vi.mock('../dirname', () => ({
  DIR_NAME: path.resolve(__dirname, '../../../bin'),
}));

vi.mock('zx', () => ({
  $: async () => {},
}));

function getAppRoot() {
  return process.env.PWD!;
}

function getAppVisePath({
  root = getAppRoot(),
  isUrlPath = false,
} = {}) {
  const rootDirName = '.vise';
  return isUrlPath
    ? path.join('/node_modules', rootDirName)
    : path.join(root, 'node_modules', rootDirName);
}

vi.mock('@vise-ssr/shared', () => ({
  getAppRoot,
  getAppVisePath,
  ScaffoldToPackage: {
    'vue3-app': '@vise-ssr/vue3',
    'react-app': '@vise-ssr/react',
  },
}));

vi.mock('@vise-ssr/vue3', () => ({
  getScaffoldPlugins: () => [],
}));

vi.mock('@vise-ssr/react', () => ({
  getScaffoldPlugins: () => [],
}));

describe('getConfigs', () => {
  it('getDevConfig', async () => {
    const rootDir = '.';
    const config = await getViteDevConfig(rootDir);

    expect(config.root).toBe(rootDir);
    expect(config.mode).toBe('development');
    expect(config.build!.rollupOptions!.input)
      .toBe(path.resolve(rootDir, 'index.html'));
  });
});
