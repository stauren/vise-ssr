import path from 'path';
import { promises as fs } from 'fs';
import { mergeConfig, UserConfig, SSROptions } from 'vite';
import legacy from '@vitejs/plugin-legacy';
import nodeResolve from '@rollup/plugin-node-resolve';
import { visualizer } from 'rollup-plugin-visualizer';
import type { ParsedViseConfig } from '@vise-ssr/shared';
import { ScaffoldToPackage } from '@vise-ssr/shared';
import { viseHtmlPost } from './plugin/vise-html-post';
import getAppViseConfig from './app-config';
import { DIR_NAME } from './dirname';
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
  const { getScaffoldPlugins } = await import(ScaffoldToPackage[userConfig.scaffold]);
  return getScaffoldPlugins(appRoot, isProduction, userConfig);
}

/**
 * merge 将所有模式一致的 baseConfig, 具体模式下的 modeConfig 和 用户传入的 customConfig
 * 顺序是 baseConfig < modeConfig < customConfig
 * @return {*}  {Promise<UserConfigVite>}
 */
async function mergeWithBaseAndCustomConfig(appRoot: string, modeConfig: UserConfigVite): Promise<UserConfigVite> {
  const userConfig = await getAppViseConfig();
  const {
    hmrPort,
    ssr,
    base = '/',
    resolve = {},
    build = {},
    plugins = [],
  } = userConfig;

  const isProduction = modeConfig.mode === 'production';
  const modeDefaultConfig = mergeConfig({
    root: appRoot,
    build: {
      emptyOutDir: true,
    },
    optimizeDeps: {
      include: userConfig.scaffold === 'react-app' ? ['react-dom/client'] : [],
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

  return mergeConfig(modeDefaultConfig, {
    base,
    server: {
      hmr: {
        ...(hmrPort ? { port: hmrPort } : {}),
      },
    },
    ...(ssr ? { ssr } : {}),
    ...(resolve ? { resolve } : {}),
    ...(build ? { build } : {}),
    plugins: [
      ...plugins,
      ...scaffoldPlugin,
    ],

    // 存储一份原始配置，方便其它 plugin 使用
    // originalViseConfig: userConfig,
  }) as UserConfigVite;
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
    server: {
      middlewareMode: 'ssr',
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
        'cookie',
        'redux',
        'react-redux',
        'react-router-dom/*',
        'url',
        ...(await getDepsOfCore()),
      ],
      noExternal: ['@reduxjs/toolkit'],
    },
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
    build: {
      sourcemap: true,
      manifest: true,
      ssrManifest: true,
      minify: 'terser',
      outDir: './dist/client',
    },
    plugins: [
      legacy(),
      visualizer({
        filename: 'client-stats.html',
        sourcemap: true,
        gzipSize: true,
        brotliSize: true,
      }),
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
        'cookie',
        'redux',
        'react-redux',
        'react-router-dom/*',
        'url',
      ],
      noExternal: ['@reduxjs/toolkit'],
    },
    plugins: [
      visualizer({
        filename: 'server-stats.html',
        sourcemap: true,
        gzipSize: true,
        brotliSize: true,
      }),
    ],
  });

  // 服务端打包不能应用 manualChunks，因为 vite 里面专门给有 ssr 配置项的流程设置了 inlineDynamicImports
  const output = config?.build?.rollupOptions?.output;
  if (output) {
    if (Array.isArray(output)) {
      config.build!.rollupOptions!.output = output.map(item => ({
        ...item,
        manualChunks: undefined,
      }));
    } else {
      output.manualChunks = undefined;
    }
  }
  return config;
}

async function getDepsOfCore() {
  const pkgJson = JSON.parse(await fs.readFile(
    path.resolve(DIR_NAME, '../package.json'),
    'utf8',
  ));
  return Object.keys(pkgJson.dependencies);
}
