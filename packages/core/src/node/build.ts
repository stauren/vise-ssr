/*
 * @Description:
 * @usage:
 * @FilePath: /vise/packages/core/src/node/build.ts
 */
import vite from 'vite';
import path from 'path';
import glob from 'glob';
import { rename, copyFile } from 'fs/promises';
import { getAppRoot, getAppVisePath } from './utils/path';
import { prepareViseDir } from './init-app';
import getAppViseConfig from './app-config';
import {
  getViteClientConfig,
  getViteServerConfig,
} from './config';

export default async function buildProject() {
  const appVisePath = getAppVisePath();
  const appRoot = getAppRoot();
  const userConfig = await getAppViseConfig();
  const appRootPagesPath = path.resolve(appRoot, 'src/pages');
  const viteClientConfig = await getViteClientConfig(appRoot);
  const viteServerConfig = await getViteServerConfig(appRoot);

  await prepareViseDir(appVisePath);
  await vite.build(viteClientConfig);
  await vite.build(viteServerConfig);
  await rename(
    `${appRoot}/dist/client/ssr-manifest.json`,
    `${appRoot}/dist/server/ssr-manifest.json`,
  );

  // 根据 pages/*.vue 或 *.tsx 复制对应名称的 html 文件，index 本来就有，不需要复制
  const fileExtension = userConfig.scaffold === 'react-app' ? 'tsx' : 'vue';
  const filenames = glob.sync(`*.${fileExtension}`, {
    cwd: appRootPagesPath,
  }).filter(filename => filename !== `index.${fileExtension}`);

  const createEntriesForCSR = filenames.map((filename) => {
    const basename = path.basename(filename, `.${fileExtension}`);
    return copyFile(`${appRoot}/dist/client/index.html`, `${appRoot}/dist/client/${basename}.html`);
  });
  await Promise.all(createEntriesForCSR);
}
