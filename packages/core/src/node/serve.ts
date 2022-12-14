import { $, path } from 'zx';
import { logger, fileExist } from '@vise-ssr/shared';

type ServeOptions = {
  port: string,
  enableCache: 'true' | 'false',
  repeatRender: string,
};

const SERVE_MODE = {
  SINGLE: 'single',
  MULTI: 'multi',
};

const callViseExpress = async (
  targetAppDir: string,
  options: ServeOptions,
  appType: string,
) => {
  let typeCommand = '';
  if (appType === SERVE_MODE.MULTI) {
    typeCommand = '-b';
  }
  const optionsCommand = `-p ${options.port} -c ${options.enableCache} -r ${options.repeatRender}`;
  $.verbose = false;
  return $`vise-express start ${typeCommand} ${optionsCommand} ${targetAppDir}`.pipe(process.stdout);
};

const countHookFiles = async (targetAppDir: string, apps: string[]) => {
  const existHookFileList = await Promise.all(apps
    .map((app) => {
      const hookFilePath = path.join(targetAppDir, `./${app}`, './server/server-hooks.js');
      return fileExist(hookFilePath);
    }));
  return existHookFileList.filter((o) => !!o).length;
};

const serveSingleApp = async (targetAppDir: string, options: ServeOptions) => {
  // 检查是否有 src/server-hooks.ts 文件
  const existHookFile = await fileExist(path.join(targetAppDir, './src/server-hooks.ts'));
  if (!existHookFile) {
    logger.error('不存在 server-hooks 文件，非 vise 项目');
    return undefined;
  }
  // 检查是否有 dist/server/entry-server.js 文件
  const existEntryServe = await fileExist(path.join(targetAppDir, './dist/server/entry-server.js'));
  if (!existEntryServe) {
    logger.error('请先在该项目内运行 vise build');
    return undefined;
  }
  $.verbose = true;
  return callViseExpress(targetAppDir, options, SERVE_MODE.SINGLE);
};

const serveMultiApps = async (targetAppDir: string, options: ServeOptions) => {
  const apps = (await $`ls ${targetAppDir}`).stdout.split('\n').filter((app) => !!app);
  // 判断 appname/server/server-hooks.js 是否全部存在
  const hookFilesNum = await countHookFiles(targetAppDir, apps);
  if (!hookFilesNum) {
    logger.error('非法目录: 不支持 vise serve, 目录格式请见 vise 官网');
    return undefined;
  }
  $.verbose = true;
  return callViseExpress(targetAppDir, options, SERVE_MODE.MULTI);
};

export default async function serveProject(viseAppDir: string, options: ServeOptions) {
  // 判断输入为单应用或多应用
  $.verbose = false;
  const targetAppDir = path.resolve(process.cwd(), viseAppDir || '');
  // 如果目标文件夹存在 package.json 或者 没有输入文件夹名 ，视为单应用处理
  const existPkgFiles = await fileExist(path.join(targetAppDir, './package.json'));
  return !viseAppDir || existPkgFiles
    ? serveSingleApp(targetAppDir, options) : serveMultiApps(targetAppDir, options);
}
