import type { AxiosRequestConfig } from 'axios';
import type {
  PlainObject,
  JSONValue,
  JSONArray,
  JSONObject,
  ParsedViseConfig,
  HttpHeaders,
} from '@vise-ssr/shared';

import type { RenderContext, RenderError } from './hooks';

// describe an HTTP request in RenderContext
type HTTPRequest = {
  // url passed between hooks will remove routerBase prefix
  // eg, https://example.com/path/to/app-name/page-a/ will be /page-a/
  readonly url: string,
  readonly headers: HttpHeaders,
  readonly body?: string,
};

// used by HTTP server to send real response
type HTTPResponse = {
  code: number,
  headers: HttpHeaders,
  body?: string,
};

/**
 * data used by vise during SSR
 * HTTP server can send initState, routerBase to render bundle
 * render bundle can send back title, cache, updated initState
 */
type RenderContextMeta = Partial<{
  title: string, // page title
  cache: boolean, // should SSR result be cached
  initState: JSONObject, // initState used for store

  // url in HTTP request passed around hooks do not have
  // routerBase prefix
  routerBase: string,
  app: string, // UI library app rendered as string
  template: string, // HTML template
  preloadLinks: string, // preload link as string for the rendered page
}>;

// server entry 打包生成的 server-render-bundle
type ViseRenderBundle = {
  render: SsrBundleRender;
};

type SsrContext = {
  meta: RenderContextMeta,
  extra: JSONObject,
};

type SsrBundleSuccess = Record<'html', string> & SsrContext;
type SsrBundleResult = SsrBundleSuccess | RenderError;
type SsrBundleRender = (renderContext: RenderContext) => Promise<SsrBundleResult>;

type SsrFetchConfig = AxiosRequestConfig & {
  url?: string
  path?: string
  cookies?: {
    [key: string]: string
  }
};

export type {
  PlainObject,
  JSONValue,
  JSONArray,
  JSONObject,

  HTTPRequest,
  HTTPResponse,
  RenderContextMeta,
  SsrContext,

  ParsedViseConfig,
  HttpHeaders,
  SsrBundleSuccess,
  SsrBundleResult,
  SsrBundleRender,
  SsrFetchConfig,
  ViseRenderBundle,
};

// shared package
export {
  injectors,
  replaceContentBetweenMarks,
  replacePlaceholderWithValue,
  getPlaceholderOf,
  getAppVisePath,
  mergeConfig,
} from '@vise-ssr/shared';

// utils 相关
export { default as isEqual } from './node/utils/is-equal';
export { cloneDeep } from './node/utils/object';
export {
  fillSsrTemplate,
  refillRenderResult,
} from './node/utils/strings';
export { default as matchAppForUrl } from './node/utils/match-app';

// vise.config.ts 配置文件
export type {
  ViseConfig,
  SsrCacheKeyGenerator,
} from './node/app-config';

// hooks 相关 export
export {
  // types
  ResolvedRequest,
  CacheInfo,
  HitCache,
  RenderContext,
  RenderResult,
  RenderError,
  HookCallback,
  HookRouterBase,
  HookCallbackConfig,
  VisePlugin,
  ViseHooks,
  HookNames,

  // objects
  RenderResultCategory,
  ALL_HOOKS,

  // classes
  HookCaller,
  HookLifeCycle,
  HookManager,
  HookLogger,
} from './hooks';
