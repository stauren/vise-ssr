import path from 'path';
import { promises as fs } from 'fs';
import {
  UserConfig, SSROptions, type PluginOption,
} from 'vite';
import legacyPlugin from '@vitejs/plugin-legacy';
import nodeResolve from '@rollup/plugin-node-resolve';
import { visualizer } from 'rollup-plugin-visualizer';
import { type ParsedViseConfig, mergeConfig } from '@vise-ssr/shared';
import { getScaffoldPlugins as reactScaffoldPlugin } from '@vise-ssr/react';
import { getScaffoldPlugins as vueScaffoldPlugin } from '@vise-ssr/vue3';
import viseHtmlPost from './plugin/vise-html-post';
import serverHooksHmr from './plugin/server-hooks-hmr';
import getAppViseConfig from './app-config';
import DIR_NAME from './dirname';
import { getAppVisePath } from './utils/path';

// vite 的 ssr 配置项还在 alpha，所以类型里面没有
export interface UserConfigVite extends UserConfig {
  ssr?: SSROptions
}

async function getUserScaffoldPlugin(
  appRoot: string,
  isProduction: boolean,
  userConfig: ParsedViseConfig,
) {
  const getScaffoldPlugins = userConfig.scaffold === 'vue3-app'
    ? vueScaffoldPlugin
    : reactScaffoldPlugin;
  return getScaffoldPlugins(appRoot, isProduction, userConfig);
}

/**
 * merge 将所有模式一致的 baseConfig, 具体模式下的 modeConfig 和 用户传入的 customConfig
 * 顺序是 baseConfig < modeConfig < customConfig
 * @return {*}  {Promise<UserConfigVite>}
 */
async function mergeWithBaseAndCustomConfig(
  appRoot: string,
  modeConfig: UserConfigVite,
): Promise<UserConfigVite> {
  const userConfig = await getAppViseConfig();
  const {
    base = '/',
    viteConfig = {},
    legacy,
  } = userConfig;

  const isProduction = modeConfig.mode === 'production';
  const modeDefaultConfig = mergeConfig<UserConfigVite>({
    root: appRoot,
    build: {
      emptyOutDir: true,
    },
    optimizeDeps: {
      include: userConfig.scaffold === 'react-app'
        ? ['react-dom/client', 'react-redux', 'react', 'react-router-dom']
        : ['vue'],
      entries: userConfig.scaffold === 'react-app'
        ? './src/app.tsx'
        : './src/app.vue',
    },
    resolve: {
      extensions: ['.ts', '.js', '.tsx', '.jsx'],
      alias: [
        { find: '~', replacement: path.resolve(appRoot, './') },
        { find: '@/', replacement: `${path.resolve(appRoot, 'src')}/` },
      ],
    },
    plugins: [
      nodeResolve({
        preferBuiltins: true,
      }),
      viseHtmlPost({
        isProduction,
        htmlFixedPositionFragments: userConfig.htmlFixedPositionFragments || [],
        minifyOption: userConfig.htmlMinify,
      }),
    ],
  }, modeConfig);

  const scaffoldPlugin = await getUserScaffoldPlugin(appRoot, isProduction, userConfig);

  let result = mergeConfig(modeDefaultConfig, {
    base,
    plugins: scaffoldPlugin,
  });

  if (isProduction && legacy) {
    result = mergeConfig(result, {
      plugins: [legacyPlugin()],
    });
  }

  return mergeConfig(result, viteConfig) as UserConfigVite;
}

async function getDepsOfCore() {
  const pkgJson = JSON.parse(await fs.readFile(
    path.resolve(DIR_NAME, '../package.json'),
    'utf8',
  ));
  return Object.keys(pkgJson.dependencies);
}

/**
 * 获取 vite 开发环境配置
 *
 * @export
 * @param {string} appRoot
 * @return {*}  {Promise<UserConfigVite>}
 */
export async function getViteDevConfig(appRoot: string): Promise<UserConfigVite> {
  return mergeWithBaseAndCustomConfig(appRoot, {
    mode: 'development',
    appType: 'custom',
    server: {
      middlewareMode: true,
      watch: {
        // During tests we edit the files too fast and sometimes chokidar
        // misses change events, so enforce polling for consistency
        usePolling: true,
        interval: 100,
      },
    },
    ssr: {
      external: [
        'vise-ssr',
        ...(await getDepsOfCore()),
      ],
      noExternal: [],
    },
    plugins: [serverHooksHmr()],
    build: {
      rollupOptions: {
        input: path.resolve(appRoot, 'index.html'),
      },
    },
  });
}

/**
 * 获取 vite 于客户端的生产构建配置
 *
 * @export
 * @param {string} appRoot
 * @return {*}  {Promise<UserConfigVite>}
 */
export async function getViteClientConfig(appRoot: string): Promise<UserConfigVite> {
  return mergeWithBaseAndCustomConfig(appRoot, {
    mode: 'production',
    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
    },
    build: {
      sourcemap: true,
      manifest: true,
      ssrManifest: true,
      minify: 'terser',
      outDir: './dist/client',
    },
    plugins: [
      visualizer({
        filename: 'client-stats.html',
        sourcemap: true,
        gzipSize: true,
        brotliSize: true,
      }) as PluginOption,
    ],
  });
}

/**
 * 获取 vite 于服务端的生产构建配置
 *
 * @export
 * @param {string} appRoot
 * @return {*}  {Promise<UserConfigVite>}
 */
export async function getViteServerConfig(appRoot: string): Promise<UserConfigVite> {
  const config = await mergeWithBaseAndCustomConfig(appRoot, {
    mode: 'production',
    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
    },
    build: {
      rollupOptions: {
        input: [
          path.join(
            getAppVisePath({ root: appRoot }),
            'entry-server.ts',
          ),
          path.resolve(appRoot, 'src/server-hooks.ts'),
        ],
        output: {
          format: 'esm',
        },
      },
      sourcemap: true,
      ssr: true,
      minify: 'terser',
      outDir: './dist/server',
    },
    ssr: {
      external: [
        'vise-ssr',
        ...(await getDepsOfCore()),
      ],
      noExternal: ['@reduxjs/toolkit', 'redux-thunk'],
    },
    plugins: [
      visualizer({
        filename: 'server-stats.html',
        sourcemap: true,
        gzipSize: true,
        brotliSize: true,
      }) as PluginOption,
    ],
  });

  // 服务端打包不能应用 manualChunks，因为 vite 里面专门给有 ssr 配置项的流程设置了 inlineDynamicImports
  const output = config?.build?.rollupOptions?.output;
  if (output) {
    if (Array.isArray(output)) {
      config.build!.rollupOptions!.output = output.map((item) => ({
        ...item,
        manualChunks: undefined,
      }));
    } else {
      output.manualChunks = undefined;
    }
  }
  return config;
}
