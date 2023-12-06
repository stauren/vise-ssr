import { promises as fs } from 'fs';
import path from 'path';
import jsdom from 'jsdom';
import type {
  ParsedViseConfig,
} from '@vise-ssr/shared';
import {
  replaceContentBetweenMarks,
  replacePlaceholderWithValue,
  getPlaceholderOf,
  injectors,
  getAppRoot,
  getAppVisePath,
  stringifyJSONWithReg,
  logger,
  fileExist,
} from '@vise-ssr/shared';
import DIR_NAME from './dirname';

export const SCAFFOLD_NAME = 'react-app';

export const SCAFFOLD_FILES = {
  index: 'index.html',
  partialFlexible: 'partial-flexible.html',
  main: 'main.tsx',
  env: 'env.ts',
  router: 'router.tsx',
  serverEntry: 'entry-server.ts',
  clientEntry: 'entry-client.ts',
  ssrContext: 'ssr-context.ts',
} as const;

const scaffoldContents: Partial<Record<keyof typeof SCAFFOLD_FILES, string>> = {};

// 获取当前运行的 npm 包中模板 runtime 目录 node_modules/@vise-ssr/react/template/runtime 等
function getTemplateRuntimePath() {
  return path.resolve(DIR_NAME, '../template/runtime');
}

async function getScaffoldContent(name: keyof typeof SCAFFOLD_FILES): Promise<string> {
  if (!(name in scaffoldContents)) {
    const filePath = path.join(
      getTemplateRuntimePath(),
      SCAFFOLD_FILES[name],
    );
    scaffoldContents[name] = await fs.readFile(filePath, 'utf-8');
  }
  return scaffoldContents[name]!;
}

// 模板占位符名称枚举
const HTML_PLACEHOLDERS = {
  title: 'title',
  htmlClass: 'html-class',
  faviconLink: 'favicon-link',
  partialFlexible: 'partial-flexible',
};

/**
 * 加载自定义html模板
 * @param config 配置项
 */
async function loadCustomTemplateContent(
  appRoot: string,
  isProduction: boolean,
  config: ParsedViseConfig,
) {
  let { customTemplate } = config;
  if (customTemplate) {
    // 把相对路径处理成绝对路径
    customTemplate = path.isAbsolute(customTemplate)
      ? customTemplate
      : path.resolve(appRoot, customTemplate);
  }
  // 判断自定义的模板文件是否存在
  const customTemplateExist = await fileExist(customTemplate);

  const content = customTemplateExist
    ? await fs.readFile(customTemplate, 'utf8')
    // 如果自定义模板不存在，使用默认模板进行插桩
    : await getScaffoldContent('index');

  const { JSDOM } = jsdom;
  const dom = new JSDOM(content);
  const { window: { document } } = dom;
  injectors.forEach(({ injector, placeholder }) => {
    injector(document, {
      placeholder,
      isProduction,
    });
  });
  const serializeDocument = dom.serialize();

  // dom属性不允许特殊字符命名，手动替换
  const propertyPlaceholderKeys = ['html-class', 'favicon-link'];

  return propertyPlaceholderKeys.reduce(
    (pre, next) => pre.replace(`ssr-${next}=""`, getPlaceholderOf(next)),
    serializeDocument,
  );
}
async function getIndexHTML(appRoot: string, isProduction: boolean, config: ParsedViseConfig) {
  let template = await loadCustomTemplateContent(appRoot, isProduction, config);

  // 根据用户配置，注入 html class
  let { htmlClass } = config;
  if (typeof htmlClass === 'function') {
    htmlClass = htmlClass();
  }
  template = replacePlaceholderWithValue(
    template,
    HTML_PLACEHOLDERS.htmlClass,
    htmlClass ? ` class="${htmlClass}"` : '',
  );

  // 根据用户配置，注入 flexible 脚本
  template = replacePlaceholderWithValue(
    template,
    HTML_PLACEHOLDERS.partialFlexible,
    config.useFlexible ? await getScaffoldContent('partialFlexible') : '',
  );

  // 根据用户配置，自定义 favicon 图标
  const encodedFaviconLink = config.faviconLink ? encodeURI(config.faviconLink) : '';
  const faviconLinkContent = `href="${encodedFaviconLink}"`;
  template = replacePlaceholderWithValue(
    template,
    HTML_PLACEHOLDERS.faviconLink,
    faviconLinkContent,
  );

  // TODO else

  // 根据用户配置，自定义 title
  const { defaultTitle } = config;
  template = replacePlaceholderWithValue(
    template,
    HTML_PLACEHOLDERS.title,
    `<!--START_TITLE--><title>${defaultTitle}</title><!--END_TITLE-->`,
  );

  return template;
}
async function getMainTsContents(isProduction: boolean, config: ParsedViseConfig) {
  const { routerBase } = config;

  return replaceContentBetweenMarks({
    source: await getScaffoldContent('main'),
    mark: 'ROUTE_BASE',
    replacement: `const ROUTE_BASE = ${typeof routerBase === 'string'} ? '${routerBase}' : ${stringifyJSONWithReg(routerBase as RegExp[])}`,
  });
}

/*
 * react 目前不支持 routerSyncPages 参数，默认所以页面为 Sync
 * async 页面由于 renderToString 不支持 Suspense
 * 需要在支持 renderToPipeableStream 后支持
 */
async function getEnvTsContent() {
  const pagesPath = path.relative(
    getAppVisePath({ root: '/' }),
    '/src/pages',
  );

  return replaceContentBetweenMarks({
    source: await getScaffoldContent('env'),
    mark: 'APP_PAGES',
    replacement: `import.meta.glob('${path.join(pagesPath, '*')}.tsx', { eager: true });`,
  });
}

async function getServerEntryContent(isProduction: boolean, strictInitState: boolean) {
  let content = await getScaffoldContent('serverEntry');
  if (!strictInitState) {
    content = replaceContentBetweenMarks({
      source: content,
      mark: 'CONF_REPLACE',
      replacement: 'const strictInitState = false;',
    });
  }
  if (isProduction) {
    const clientPath = path.relative(
      getAppVisePath({ root: '/' }),
      '/dist/client',
    );
    const serverPath = path.relative(
      getAppVisePath({ root: '/' }),
      '/dist/server',
    );
    return replaceContentBetweenMarks({
      source: content,
      mark: 'TPL_REPLACE',
      replacement: `import manifest from '${path.join(serverPath, 'ssr-manifest.json')}';
  import template from '${path.join(clientPath, 'index.html?raw')}';`,
    });
  }

  return replaceContentBetweenMarks({
    source: content,
    mark: 'SERVER_HOOKS',
    replacement: 'import \'@/server-hooks\'',
  });
}
async function getHooksContents(config: ParsedViseConfig): Promise<string> {
  const { routerBase } = config;
  const hooksConfig = await fs.readFile(path.resolve(getAppRoot(), 'src/server-hooks.ts'), 'utf8');
  const regRule = /export[\s]+default[\s]+([\w]+)/;
  const regRes = hooksConfig.match(regRule);
  if (!regRes || !regRes[0] || !regRes[1]) {
    logger.error('failed dynamic write server-hooks');
    return hooksConfig;
  }
  const [exportStateMent, variableName] = regRes;

  const contentToInsert = `
${variableName}.routerBaseConfig = ${typeof routerBase === 'string' ? `'${routerBase}'` : stringifyJSONWithReg(routerBase)};
${variableName}.base = '${config.base}';
export default ${variableName};
  `;

  return hooksConfig.replace(exportStateMent, contentToInsert);
}

export function getScaffoldModules(
  appRoot: string,
  isProduction: boolean,
  userConfig: ParsedViseConfig,
) {
  const appVisePath = getAppVisePath({ root: appRoot });
  return {
    [path.resolve(appRoot, SCAFFOLD_FILES.index)]: {
      async content() {
        return getIndexHTML(appRoot, isProduction, userConfig);
      },
    },
    [path.resolve(appVisePath, SCAFFOLD_FILES.clientEntry)]: {
      async content() {
        return getScaffoldContent('clientEntry');
      },
    },
    [path.resolve(appVisePath, SCAFFOLD_FILES.router)]: {
      async content() {
        return getScaffoldContent('router');
      },
    },
    [path.resolve(appVisePath, SCAFFOLD_FILES.main)]: {
      async content() {
        return getMainTsContents(isProduction, userConfig);
      },
    },
    [path.resolve(appVisePath, SCAFFOLD_FILES.env)]: {
      async content() {
        return getEnvTsContent();
      },
    },
    [path.resolve(appVisePath, SCAFFOLD_FILES.serverEntry)]: {
      async content() {
        return getServerEntryContent(
          isProduction,
          userConfig.strictInitState,
        );
      },
    },
    [path.resolve(appRoot, 'src/server-hooks.ts')]: {
      async content() {
        return getHooksContents(userConfig);
      },
    },
    [path.resolve(appVisePath, SCAFFOLD_FILES.ssrContext)]: {
      async content() {
        return getScaffoldContent('ssrContext');
      },
    },
  };
}
