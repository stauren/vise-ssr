import path from 'path';
import type { ViseHooks } from 'vise-ssr';

import { getAppServerBundlePath } from './path';

export const VALID_APP_NAME = /^[a-z]+[a-z0-9-]*[a-z0-9]+$/;

export async function loadHookConfig(base: string, appName: string): Promise<ViseHooks> {
  if (!appName.match(VALID_APP_NAME)) {
    throw 'unsafe app name';
  }
  const configFile = path.resolve(
    getAppServerBundlePath(base, appName),
    'server-hooks.js',
  );
  // 加载 app 服务端 hooks 文件
  return (await import(configFile)).default;
}

export async function loadRenderBundle(baseOfAllBundles: string, appName: string) {
  if (!appName.match(VALID_APP_NAME)) {
    throw 'unsafe app name';
  }
  const bundle = path.resolve(
    getAppServerBundlePath(baseOfAllBundles, appName),
    'entry-server.js',
  );
  // 加载 app 服务端渲染 bundle 文件
  return import(bundle);
}
