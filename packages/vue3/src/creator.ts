import { promises as fsPromise } from 'fs';
import { $, path } from 'zx';
import ora from 'ora';
import enquirer from 'enquirer';
import chalk from 'chalk';
import {
  fileExist,
  logger,
  replacePlaceholderWithValue,
  copyJsonWithChange,
} from '@vise-ssr/shared';
import { DIR_NAME } from './dirname';

export interface IVue3AppAns {
  templateType: string;
  appName: string;
  config: UserDefinedViseConfig,
}

interface IConfirm {
  confirm: boolean,
}

type UserDefinedViseConfig = {
  author: string,
  desc: string,
  devPort: string,
  defaultTitle: string
};

const TEMPLATE_FILE_NAMES = [
  '_gitignore',
  '.eslintrc.cjs',
  'jest.config.ts',
  'tsconfig.json',
  'vise.config.ts',
  'package.json',
  'public',
  'src',
  'src/server-hooks.ts',
] as const;

// 获取当前运行的 npm 包中模板 runtime 目录 node_modules/@vise-ssr/vue3/template/base
function getTemplateBasePath() {
  return path.resolve(DIR_NAME, '../template/base');
}

async function getViseVersion() {
  const PKG = await fsPromise.readFile(path.resolve(DIR_NAME, '../package.json'), 'utf8');
  return JSON.parse(PKG).version;
}

export default async function newVue3App() {
  const confirmCreation: IConfirm = await enquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      initial: true,
      message: `是否在 ${process.cwd()} 下创建项目`,
    },
  ]);

  if (!confirmCreation.confirm) {
    return;
  }

  const answers = await vue3AppAns();
  const { appName, config } = answers;

  const viseVersion = await getViseVersion();
  const newAppPath = path.resolve(process.cwd(), `./app-${appName}`);

  if (await fileExist(newAppPath)) {
    logger.error(`已存在 app-${appName}，请勿重复创建`);
    return;
  }

  $.verbose = false;
  await $`mkdir ${newAppPath}`;

  const allDone = await createTemplateFiles(newAppPath, viseVersion, appName, config);
  logger.success(`🎉  app-${appName} 创建成功\n`);
  logger.info(`👉  使用以下指令开始快速开发:

  ${chalk.cyan(`$ cd app-${appName}`)}
  ${chalk.cyan('$ npm install')}
  ${chalk.cyan('$ vise dev')}
  `);
  return allDone;
}

const vue3AppAns = async () => {
  // shell 获取默认用户名
  $.verbose = false;
  const defaultUser = (await $`echo $USER`).stdout.replace(/[\r\n]/g, '');

  const answers: IVue3AppAns = await enquirer.prompt([
    {
      type: 'input',
      name: 'appName',
      message: '项目名称',
      validate(value: string) {
        // 项目名称必须是以小写字母开头仅包含小写字母、数字和连接号 (-)
        const pattern = /^[a-z]+([0-9a-z-]*[0-9a-z]+)?$/;
        if (!pattern.test(value)) {
          return '项目名称必须是以小写字母开头仅包含小写字母、数字和连接号 (-)';
        }
        return true;
      },
    },
    {
      type: 'form',
      name: 'config',
      message: '请输入项目信息（上下箭头切换）',
      choices: [
        { name: 'author', message: 'Author', initial: defaultUser },
        { name: 'desc', message: 'Description', initial: 'a Vise SSR project' },
        { name: 'devPort', message: 'DevPort(开发时使用的 http 端口)', initial: '3000' },
        { name: 'defaultTitle', message: '默认标题', initial: 'Vise App' },
      ],
    },
  ]);
  return answers;
};

const createTemplateFiles = (
  newAppPath: string,
  viseVersion: string,
  appName: string,
  config: UserDefinedViseConfig,
) => {
  const appTemplatePath = getTemplateBasePath();
  // 复制文件至新项目
  const { author, desc, devPort, defaultTitle } = config;
  const mySpinner = ora().start();
  mySpinner.color = 'green';
  // 这里并不关心最后这个数组的值，所以用 any 直接概括了
  return Promise.all<Promise<any>>(TEMPLATE_FILE_NAMES.map((item) => {
    let mainJobDone;
    switch (item) {
      case 'package.json':
        mainJobDone = copyJsonWithChange(
          path.join(appTemplatePath, item),
          path.join(newAppPath, item),
          { author, description: desc, name: `@vise-ssr/app-${appName}`, dependencies: {
            'vise-ssr': viseVersion,
          } },
        );
        break;
      case 'vise.config.ts': {
        const viseConfigTemplate = setViseConfigTemplate(devPort, defaultTitle);
        mainJobDone = $`echo ${viseConfigTemplate} > ${path.join(newAppPath, item)}`;
        break;
      }
      case 'src/server-hooks.ts':
        mainJobDone = createServerHooksTemplate(
          path.join(appTemplatePath, item),
          path.join(newAppPath, item),
          appName,
        );
        break;
      case '_gitignore':
        mainJobDone = $`cp -r ${path.join(appTemplatePath, item)} ${path.join(newAppPath, '.gitignore')}`;
        break;
      default:
        mainJobDone = $`cp -r ${path.join(appTemplatePath, item)} ${path.join(newAppPath, item)}`;
        break;
    }
    mainJobDone.then(() => {
      mySpinner.succeed(`📄  Created ${item === '_gitignore' ? '.gitignore' : item}`);
    });
    return mainJobDone;
  }));
};

const setViseConfigTemplate = (devPort: string, defaultTitle: string) => {
  const configTemplate = `import type { ViseConfig } from 'vise-ssr';

const config: ViseConfig = {
  devPort: ${parseInt(devPort, 10)},
  hmrPort: 3008,
  htmlClass: '',
  defaultTitle: '${defaultTitle}',
  faviconLink: '',
  useFlexible: false,
  base: '/',
  routerBase: '/',
  strictInitState: false,
};

export default config;`;

  return configTemplate;
};

const createServerHooksTemplate = async (srcFile: string, targetFile: string, appName: string) => {
  const oldServerHooks = (await $`cat ${srcFile}`).stdout;
  const newServerHooks = replacePlaceholderWithValue(
    oldServerHooks,
    'serverHooksAppName',
    appName,
  );
  return $`echo ${newServerHooks} > ${targetFile}`;
};
