import path from 'path';
import {
  getViteDevConfig,
} from '../config';

jest.mock('../app-config', () => async () => ({
  htmlClass: 'dark',
  devPort: 3000,
  scaffold: 'react-app',
}));

jest.mock('../dirname', () => ({
  DIR_NAME: path.resolve(__dirname, '../../../bin'),
}));

jest.mock('zx', () => ({
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

jest.mock('@vise-ssr/shared', () => ({
  getAppRoot,
  getAppVisePath,
  ScaffoldToPackage: {
    'vue3-app': '@vise-ssr/vue3',
    'react-app': '@vise-ssr/react',
  },
}));

jest.mock('@vise-ssr/vue3', () => ({
  getScaffoldPlugins: () => [],
}));

jest.mock('@vise-ssr/react', () => ({
  getScaffoldPlugins: () => [],
}));

describe('getConfigs', () => {
  /*
    @start_h5_test
    {
      "FT": "Vise Core",
      "模块": "vise/packages/core/src/node/config.ts",
      "功能": "网络请求",
      "管理者": "staurenliu",
      "测试分类": "功能",
      "测试阶段": "全用例",
      "用例等级": "P0",
      "用例类型": 5,
      "被测函数": "getViteDevConfig",
      "用例描述": "能否正确获取测试配置",
      "上线": true
    }
    @end_h5_test
  */
  it('getDevConfig', async () => {
    const rootDir = '.';
    const config = await getViteDevConfig(rootDir);

    expect(config.root).toBe(rootDir);
    expect(config.mode).toBe('development');
    expect(config.build!.rollupOptions!.input)
      .toBe(path.resolve(rootDir, 'index.html'));
  });
});
