import type { AxiosRequestConfig } from 'axios';
import type {
  PlainObject,
  JSONValue,
  JSONArray,
  JSONObject,
  ParsedViseConfig,
  EHtmlFixedPositions,
  HttpHeaders,
} from '@vise-ssr/shared';

import type { RenderContext, RenderError, RenderContextExtra } from './hooks/';

// shared package
export {
  injectors,
  replaceContentBetweenMarks,
  replacePlaceholderWithValue,
  getPlaceholderOf,
  getAppVisePath,
  mergeConfig,
} from '@vise-ssr/shared';

// server entry 打包生成的 server-render-bundle
type ViseRenderBundle = {
  render: SsrBundleRender;
};

type HashMap = {
  [key: string]: JSONValue;
};

type SsrBundleSuccessKey = 'app' | 'html' | 'template' | 'preloadLinks';
type SsrBundleSuccess = Record<SsrBundleSuccessKey, string> & Record<'extra', RenderContextExtra>;
type SsrBundleResult = SsrBundleSuccess | RenderError;
type SsrBundleRender = (renderContext: RenderContext) => Promise<SsrBundleResult>;

type SsrFetchConfig = AxiosRequestConfig & {
  url?: string
  path?: string
  cookies?: {
    [key: string]: string
  }
};

type SsrFetchResultOf<T> = {
  // 返回结果状态码
  code: number
  // 返回结果信息，通常当状态为错误时有意义
  msg: string
  // 返回结果，要求是 JSONValue 数据格式
  data: T
  // 可选原生返回结果，如 axios 可以返回 response
  raw?: JSONObject
};
type SsrFetchResult = SsrFetchResultOf<JSONValue>;

export type {
  PlainObject,
  JSONValue,
  JSONArray,
  JSONObject,
  HashMap,
  EHtmlFixedPositions,

  ParsedViseConfig,
  HttpHeaders,
  RenderContextExtra,
  SsrBundleSuccess,
  SsrBundleResult,
  SsrBundleSuccessKey,
  SsrBundleRender,
  SsrFetchConfig,
  SsrFetchResultOf,
  SsrFetchResult,
  ViseRenderBundle,
};

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
  HTTPRequest,
  HTTPResponse,
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
} from './hooks/';
