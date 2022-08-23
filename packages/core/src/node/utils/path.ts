import path from 'path';
import { $ } from 'zx';
import { getAppRoot, getAppVisePath } from '@vise-ssr/shared';

export {
  getAppRoot,
  getAppVisePath,
};

export function promisify(asyncCall: Function, context = null): Function {
  return (...args: any): Promise<any> => new Promise((resolve) => {
    asyncCall.apply(context, [...args, resolve]);
  });
}

export function isInDir(subPath: string, rootPath: string = getAppVisePath()) {
  const relativePath = path.relative(rootPath, subPath);
  return !relativePath.startsWith('../');
}

export async function ensureDir(dirPath: string, needEmptyDir = false): Promise<boolean> {
  if (!isInDir(dirPath)) {
    throw 'Can NOT operate files outside root';
  }

  $.verbose = false;
  const createdDir = await $`mkdir -p ${dirPath}`;
  if (needEmptyDir) {
    await $`rm -rf ${dirPath}/*`;
  }

  return createdDir.exitCode === 0;
}
