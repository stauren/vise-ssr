import path from 'path';
import { getAppVisePath } from 'vise-ssr';
import DIR_NAME from './env';

export function getAppViseBundleDir(appRoot: string) {
  return path.join(getAppVisePath({ root: appRoot }), 'bundles');
}

export function getBaseOfAppInAllBundles(allBundlesBase: string, appName: string) {
  return path.join(allBundlesBase, appName);
}

export function getAppServerBundlePath(baseOfAllBundles: string, appName: string) {
  return path.join(
    getBaseOfAppInAllBundles(baseOfAllBundles, appName),
    'server',
  );
}

export function getAppClientBundlePath(baseOfAllBundles: string, appName: string) {
  return path.join(
    getBaseOfAppInAllBundles(baseOfAllBundles, appName),
    'client',
  );
}

export function getRenderProcessFilePath() {
  return path.resolve(DIR_NAME, '../dist/renderer-subprocess.js');
}
