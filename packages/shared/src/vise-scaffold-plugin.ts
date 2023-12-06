import path from 'node:path';
import type { Plugin } from 'vite';
import { getAppVisePath } from './path';

type ScaffoldModule = string | {
  content: string | (() => Promise<string>),
  virtual?: boolean,
};

type ScaffoldConfig = {
  // root: string,
  modules: Record<string, ScaffoldModule>,
};

const VIRTUAL_PREFIX = '\0virtual:';
const APP_VISE_PATH = getAppVisePath({ isUrlPath: true });
const getResolvedWithVirtualConfig = (id: string, mod: ScaffoldModule) => {
  if (typeof mod === 'string') return id;
  return mod.virtual ? `${VIRTUAL_PREFIX}${id}` : id;
};

const isTsFile = (filePath: string) => path.extname(filePath) === '.ts';
const hasNoFileExtension = (filePath: string) => path.extname(filePath) === '';

export default function viseScaffold({ modules }: ScaffoldConfig): Plugin {
  const resolvedIds = new Map();
  let indexModule: ScaffoldModule | undefined;

  Object.keys(modules).forEach((id) => {
    const mod = modules[id];
    if (id.endsWith('index.html')) {
      indexModule = mod;
    }
    resolvedIds.set(path.resolve(id), mod);
  });

  return {
    name: 'vise:scaffold',
    enforce: 'pre',

    resolveId(source, importer) {
      let sourceID = source;
      if (source.startsWith(APP_VISE_PATH)) { // when import from browser in dev use absolute path
        sourceID = `.${source}`;
      }
      const mod = modules[sourceID];

      if (mod) {
        return getResolvedWithVirtualConfig(sourceID, mod);
      }

      if (importer) {
        const importerRealPath = importer.startsWith(VIRTUAL_PREFIX)
          ? importer.slice(VIRTUAL_PREFIX.length)
          : importer;
        let resolved = path.resolve(path.dirname(importerRealPath), sourceID);

        // import ts file from anther ts file without file extension
        if (hasNoFileExtension(resolved) && isTsFile(importerRealPath)) {
          resolved = `${resolved}.ts`;
        }

        if (resolvedIds.has(resolved)) {
          return getResolvedWithVirtualConfig(
            resolved,
            resolvedIds.get(resolved),
          );
        }
      }
      return undefined;
    },

    // 如果命中配置中的模块，使用配置中的字符串或者方法返回文件内容
    async load(id: string) {
      const realId = id.startsWith(VIRTUAL_PREFIX) ? id.slice(VIRTUAL_PREFIX.length) : id;
      const mod = realId in modules ? modules[realId] : resolvedIds.get(realId);

      if (mod) {
        const content = typeof mod === 'string' ? mod : mod.content;
        return typeof content === 'string' ? content : content();
      }
      return undefined;
    },

    transformIndexHtml: {
      order: 'pre',
      handler: async function transformIndexHtml(html: string) {
        if (html !== '') return html;
        const content = typeof indexModule === 'string' ? indexModule : indexModule!.content;
        return typeof content === 'string' ? content : content();
      },
    },
  };
}
