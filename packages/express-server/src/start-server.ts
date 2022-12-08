import path from 'path';
import { $ } from 'zx';

import type { SSRServerConfig }  from '@/ssr-server';
import SSRServer from '@/ssr-server';
import { VALID_APP_NAME } from '@/utils/load-bundles';
import { getBaseOfAppInAllBundles, getAppViseBundleDir } from '@/utils/path';
import logger from '@/utils/logger';

export type InitOption = {
  enableCache?: boolean,
  bundleDir?: boolean,
  repeatRender?: number,
  port?: string,
};

async function ensureDir(dirPath: string, needEmptyDir = false): Promise<boolean> {
  if (needEmptyDir) {
    await $`rm -rf ${dirPath}`;
  }
  const mkdirResult = await $`mkdir -p ${dirPath}`;

  return mkdirResult.exitCode === 0;
}

async function getViseAppName(base: string): Promise<string | false> {
  try {
    const readOutput = await $`cat ${base}/package.json`;
    const pkgJson = JSON.parse(readOutput.toString());
    const allDeps = {
      ...pkgJson.dependencies,
      ...pkgJson.devDependencies,
    };
    if (Object.keys(allDeps).some(key => key === 'vise-ssr')) {
      const serverHooks = await import(path.resolve(base, 'dist/server/server-hooks.js'));
      return serverHooks.default.appName;
    }
  } catch (error) {
    logger(String(error));
  }
  return false;
}

async function copyAppBundle(appBase: string, appName: string) {
  // 将构建产物拷贝到 app 的.vise 临时目录下，构建一个支持多 app bundles 的
  // express serve bundles base
  const bundlePath = getBaseOfAppInAllBundles(getAppViseBundleDir(appBase), appName);
  const execResult = await $`
mkdir -p ${bundlePath}
cp -r ${path.resolve(appBase, 'package.json')} ${path.resolve(appBase, 'dist/client')} ${path.resolve(appBase, 'dist/server')} ${bundlePath}
rm -f ${path.join(bundlePath, 'client')}/*.html
`;
  return execResult.exitCode === 0;
}

async function getAppList(base: string) {
  const appNames = await $`ls -1 ${base}`;
  if (appNames.exitCode !== 0) {
    throw appNames.stderr;
  }

  const apps = appNames.stdout.split('\n').filter(app => !!app);

  return apps;
}

async function prepareViseAppForServe(base: string) {
  const viseAppName = await getViseAppName(base);
  if (viseAppName === false) {
    logger('input viseAppDir is not a Vise app or build is not done.');
    return;
  }
  if (!viseAppName.match(VALID_APP_NAME)) {
    logger(`Unsafe App Name: ${viseAppName}`);
    return;
  }
  const appViseBundleDir = getAppViseBundleDir(base);
  if (!await ensureDir(appViseBundleDir, true)) {
    logger(`fail to create dir: ${appViseBundleDir}`);
    return;
  };
  if (!await copyAppBundle(base, viseAppName)) {
    logger('fail to copy bundles');
    return;
  }
  return appViseBundleDir;
}

export default async function startServer(serveBase: string, options: InitOption) {
  const appBase = path.isAbsolute(serveBase)
    ? serveBase : path.resolve(process.cwd(), serveBase);
  const inViseApp = options.bundleDir !== true;

  let bundleBase: string | undefined = serveBase;
  if (inViseApp) {
    bundleBase = await prepareViseAppForServe(appBase);
    if (!bundleBase) return;
  }

  const apps = await getAppList(bundleBase);
  const repeatRenderTimes = options.repeatRender ?? 0;
  const port = options.port && parseInt(options.port, 10);
  const serverConf: SSRServerConfig = {
    apps,
    base: bundleBase,
    repeatRender: repeatRenderTimes >= 0 ? repeatRenderTimes : 0,
  };

  serverConf.useCache = options.enableCache !== false;
  if (port && port > 0) {
    serverConf.port = port;
  }
  const server = new SSRServer(serverConf);
  server.start();
}
