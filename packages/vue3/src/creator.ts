import { promises as fsPromise } from 'fs';
import { $, path } from 'zx';
import ora from 'ora';
import enquirer from 'enquirer';
import chalk from 'chalk';
import {
  fileExist,
  logger,
  copyJsonWithChange,
  copyFileWithChange,
} from '@vise-ssr/shared';
import DIR_NAME from './dirname';

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
  'vitest.config.ts',
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

const createTemplateFiles = (
  newAppPath: string,
  viseVersion: string,
  appName: string,
  config: UserDefinedViseConfig,
) => {
  const appTemplatePath = getTemplateBasePath();
  // 复制文件至新项目
  const {
    author, desc, devPort, defaultTitle,
  } = config;
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
          {
            author,
            description: desc,
            name: `@vise-ssr/app-${appName}`,
            dependencies: {
              'vise-ssr': viseVersion,
            },
          },
        );
        break;
      case 'vise.config.ts': {
        mainJobDone = copyFileWithChange(
          path.join(appTemplatePath, item),
          path.join(newAppPath, item),
          {
            devPort: JSON.stringify(parseInt(devPort, 10)),
            defaultTitle: defaultTitle.replace(/'/g, '\\\''),
          },
        );
        break;
      }
      case 'src/server-hooks.ts':
        mainJobDone = Promise.resolve();
        break;
      case '_gitignore':
        mainJobDone = $`cp -r ${path.join(appTemplatePath, item)} ${path.join(newAppPath, '.gitignore')}`;
        break;
      default:
        mainJobDone = $`cp -r ${path.join(appTemplatePath, item)} ${path.join(newAppPath, item)}`;
        break;
    }
    mainJobDone.then(() => {
      if (item !== 'src/server-hooks.ts') {
        mySpinner.succeed(`📄  Created ${item === '_gitignore'
          ? '.gitignore'
          : item}`);
      }
    });
    return mainJobDone;
  })).then(() => {
    const filePath = path.join(newAppPath, 'src/server-hooks.ts');
    return copyFileWithChange(
      filePath,
      filePath,
      {
        serverHooksAppName: appName,
      },
    ).then(() => {
      mySpinner.succeed('📄  Created src/server-hooks.ts');
    });
  });
};

const vue3AppAns = async () => {
  // shell 获取默认用户名
  $.verbose = false;
  const defaultUser = (await $`echo $USER`).stdout.replace(/[\r\n]/g, '');

  const answers: IVue3AppAns = await enquirer.prompt([
    {
      type: 'input',
      name: 'appName',
      message: 'Please input app name',
      validate(value: string) {
        const pattern = /^[a-z]+([0-9a-z-]*[0-9a-z]+)?$/;
        if (!pattern.test(value)) {
          return 'App name must start with lower case letter and only contain lower case letter, number and - symbol';
        }
        return true;
      },
    },
    {
      type: 'form',
      name: 'config',
      message: 'Please input app information (Use arrow to move up and down)',
      choices: [
        { name: 'author', message: 'Author', initial: defaultUser },
        { name: 'desc', message: 'Description', initial: 'a Vise SSR project' },
        { name: 'devPort', message: 'DevPort', initial: '3000' },
        { name: 'defaultTitle', message: 'Default Title', initial: 'Vise App' },
      ],
    },
  ]);
  return answers;
};

export default async function newVue3App() {
  const confirmCreation: IConfirm = await enquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      initial: true,
      message: `Create app in ${process.cwd()}`,
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
    logger.error(`app-${appName} exists, please choose another name`);
    return;
  }

  $.verbose = false;
  await $`mkdir ${newAppPath}`;

  await createTemplateFiles(newAppPath, viseVersion, appName, config);
  logger.success(`🎉  app-${appName} Created.\n`);
  logger.info(`👉  Use following commands to start develop:

  ${chalk.cyan(`$ cd app-${appName}`)}
  ${chalk.cyan('$ npm install')}
  ${chalk.cyan('$ vise dev')}
  `);
}
