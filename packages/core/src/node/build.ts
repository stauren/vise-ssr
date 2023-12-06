/*
 * @Description:
 * @usage:
 * @FilePath: /vise/packages/core/src/node/build.ts
 */
import { build } from 'vite';
import path from 'path';
import glob from 'glob';
import { rename, copyFile } from 'fs/promises';
import { getAppRoot, getAppVisePath } from './utils/path';
import prepareViseDir from './init-app';
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
  await build(viteClientConfig);
  await build(viteServerConfig);
  await rename(
    `${appRoot}/dist/client/.vite/ssr-manifest.json`,
    `${appRoot}/dist/server/ssr-manifest.json`,
  );

  if (userConfig.generateCsrHtml) {
    // generate CSR fallback html entry from pages/*.(vue|tsx)
    const fileExtension = userConfig.scaffold === 'react-app' ? 'tsx' : 'vue';
    const filenames = glob.sync(`*.${fileExtension}`, {
      cwd: appRootPagesPath,
    }).filter((filename) => filename !== `index.${fileExtension}`);

    const createEntriesForCSR = filenames.map((filename) => {
      const basename = path.basename(filename, `.${fileExtension}`);
      return copyFile(`${appRoot}/dist/client/index.html`, `${appRoot}/dist/client/${basename}.html`);
    });
    await Promise.all(createEntriesForCSR);
  }
}
