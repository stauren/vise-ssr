import { promises as fs } from 'fs';
import path from 'path';
import jsdom from 'jsdom';
import type {
  ParsedViseConfig,
} from '@vise-ssr/shared';
import {
  injectors,
  logger,
  stringifyJSONWithReg,
  replacePlaceholderWithValue,
  replaceContentBetweenMarks,
  getPlaceholderOf,
  getAppRoot,
  getAppVisePath,
  fileExist,
} from '@vise-ssr/shared';
import DIR_NAME from './dirname';

// 获取当前运行的 npm 包中模板 runtime 目录 node_modules/@vise-ssr/vue3/template/runtime 等
function getTemplateRuntimePath() {
  return path.resolve(DIR_NAME, '../template/runtime');
}

export const SCAFFOLD_FILES = {
  index: 'index.html',
  partialFlexible: 'partial-flexible.html',
  main: 'main.ts',
  env: 'env.ts',
  router: 'router.ts',
  serverEntry: 'entry-server.ts',
  clientEntry: 'entry-client.ts',
} as const;

const scaffoldContents: Partial<Record<keyof typeof SCAFFOLD_FILES, string>> = {};
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

/**
 * 加载自定义html模板
 * @param config 配置项
 */
async function loadCustomTemplateContent(isProduction: boolean, config: ParsedViseConfig) {
  let { customTemplate } = config;
  if (customTemplate) {
    // 把相对路径处理成绝对路径
    customTemplate = path.isAbsolute(customTemplate)
      ? customTemplate
      : path.resolve(getAppRoot(), customTemplate);
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
export async function getIndexHTML(isProduction: boolean, config: ParsedViseConfig) {
  let template = await loadCustomTemplateContent(isProduction, config);

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

// 主要是将用户配置的同步、异步加载页面配置入 env.ts
async function getEnvTsContent(config: ParsedViseConfig) {
  const { routerSyncPages } = config;
  const isRouterSyncPagesNotEmpty = routerSyncPages?.length > 0;
  const isRouterSyncPagesMulti = routerSyncPages?.length > 1;
  const syncPagesStr = isRouterSyncPagesNotEmpty
    ? `${(routerSyncPages || []).join('|')}`
    : '';
  const syncPagesPattern = isRouterSyncPagesMulti
    ? `(${syncPagesStr})`
    : syncPagesStr;
  const excludeSyncPagesPattern = isRouterSyncPagesNotEmpty
    ? `!(${syncPagesStr})`
    : '*';

  const pagesPath = path.relative(
    getAppVisePath({ root: '/' }),
    '/src/pages',
  );
  const replacedContent = replaceContentBetweenMarks({
    source: await getScaffoldContent('env'),
    mark: 'APP_PAGES',
    replacement: `import.meta.glob('${path.join(pagesPath, excludeSyncPagesPattern)}.vue');`,
  });
  return replaceContentBetweenMarks({
    source: replacedContent,
    mark: 'SYNC_APP_PAGES',
    replacement: syncPagesPattern
      ? `import.meta.globEager('${path.join(pagesPath, syncPagesPattern)}.vue');`
      : '{};',
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
    return replaceContentBetweenMarks({
      source: content,
      mark: 'TPL_REPLACE',
      replacement: `import manifest from '${path.join(clientPath, 'ssr-manifest.json')}';
  import template from '${path.join(clientPath, 'index.html?raw')}';`,
    });
  }
  return replaceContentBetweenMarks({
    source: content,
    mark: 'SERVER_HOOKS',
    replacement: 'import \'@/server-hooks\'',
  });
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
        return getIndexHTML(isProduction, userConfig);
      },
    },
    [path.resolve(appRoot, 'src/server-hooks.ts')]: {
      async content() {
        return getHooksContents(userConfig);
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
        return getEnvTsContent(userConfig);
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
  };
}
