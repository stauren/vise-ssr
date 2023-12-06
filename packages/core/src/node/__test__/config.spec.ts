import path from 'node:path';
import {
  describe, it, expect, vi,
} from 'vitest';
import {
  getViteClientConfig,
} from '../config';

vi.mock('../app-config', () => ({
  default: async () => ({
    htmlClass: 'dark',
    devPort: 3000,
    scaffold: 'react-app',
  }),
}));

vi.mock('../dirname', () => ({
  default: path.resolve(__dirname, '../../../bin'),
}));

vi.mock('zx', () => ({
  $: async () => {},
}));

vi.mock('@vise-ssr/react', () => ({
  getScaffoldPlugins: () => [],
}));

vi.mock('@vise-ssr/vue3', () => ({
  getScaffoldPlugins: () => [],
}));

vi.mock('@vitejs/plugin-legacy', () => ({
  default: () => undefined,
}));
vi.mock('@rollup/plugin-node-resolve', () => ({
  default: () => undefined,
}));

describe('getConfigs', () => {
  it('getDevConfig', async () => {
    const rootDir = '.';
    const config = await getViteClientConfig(rootDir);

    expect(config.root).toBe(rootDir);
    expect(config.mode).toBe('production');
  });
});
