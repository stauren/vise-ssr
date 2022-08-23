import type { ParsedViseConfig, HtmlFixedPositionFragment } from '@vise-ssr/shared';
import { EHtmlFixedPositions } from '@vise-ssr/shared';
import { getAppRoot } from './utils/path';
import dynamicImportTs from './utils/dynamic-import-ts';
import type { HttpHeaders } from '../';

export type SsrCacheKeyGenerator = (url: string, headers: HttpHeaders) => string;

export {
  EHtmlFixedPositions,
  HtmlFixedPositionFragment,
};

export type ViseConfig = Partial<ParsedViseConfig>;

// 默认的 vise 项目配置
export const DEFAULT_VISE_CONFIG: ParsedViseConfig = {
  devPort: 3000,
  htmlClass: '',
  htmlFixedPositionFragments: [],
  defaultTitle: 'Vise Powered App',
  faviconLink: 'https://cdn.rawgit.com/stauren/vise-ssr/main/packages/app-vue3-intro/public/logo.svg',
  hmrPort: 3008,
  useFlexible: false,
  directiveTransforms: {},
  ssr: {},
  base: '/',
  routerSyncPages: [],
  resolve: {},
  build: {},
  plugins: [],
  // generateCacheKey: () => '',
  customTemplate: '',
  strictInitState: true,
  scaffold: 'vue3-app',
  htmlMinify: true,
  routerBase: '/',
};

// TODO 增加失效时间
let cachedUserConfig: ParsedViseConfig | undefined;
/**
 * 获取 vise 配置
 *
 * @export
 * @return {*}  {Promise<ViseConfig>}
 */

export default async function getAppViseConfig(): Promise<ParsedViseConfig> {
  if (cachedUserConfig) return cachedUserConfig;
  let result;
  const viseConfigPath = `${getAppRoot()}/vise.config.ts`;
  const userConfig = await dynamicImportTs<Partial<ViseConfig>>(viseConfigPath);
  if (userConfig !== undefined) {
    result = Object.assign({}, DEFAULT_VISE_CONFIG, userConfig);
  } else {
    console.error('[getAppViseConfig error]');
    return Object.assign({}, DEFAULT_VISE_CONFIG);
  }

  if (!result.base!.match(/^(\/|https?:\/\/)/)) {
    throw '[vise.config.js]: base must start with a slash or http';
  }
  cachedUserConfig = result;
  return result;
}
