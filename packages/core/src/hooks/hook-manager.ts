import tapable, { AsyncHook } from 'tapable';
import type {
  HTTPRequest,
  HTTPResponse,
  SsrContext,
} from '..';
import type { VisePlugin } from './hook-plugin';

export const ALL_HOOKS = [
  'receiveRequest',
  'requestResolved',
  'beforeUseCache',
  'findCache',
  'hitCache',
  'beforeRender',
  'render',
  'afterRender',
  'beforeResponse',
] as const;

export const HOOK_TO_INNER = {
  receiveRequest: 'receiveRequestInner',
  findCache: 'findCacheInner',
} as const;

export type HookNames = typeof ALL_HOOKS[number];

export type InnerHookNames = typeof HOOK_TO_INNER[keyof typeof HOOK_TO_INNER];

// SSR Render Context, used for store the HTTP request
// and the data shared between multiple hooks
export type RenderContext = {
  request: HTTPRequest,
  error?: RenderError, // hooks should put their error here when render failed
} & SsrContext;

// used for storing original context and changed context
export type ResolvedRequest = {
  readonly original: RenderContext,
  resolved: RenderContext,
};

export type CacheInfo = {
  // cache key generated from HTTP request, must be unique
  key: string,
  // unix timestamp expire time
  expire: number,
  // use expired data first then update it
  stale: boolean,
  context: RenderContext,
};

export type HitCache = CacheInfo & {
  content: string,
};

// return value of inner hook findCacheInner
export type FindCacheResult = {
  content: string,
  renderBy: string,
};

export type RenderError = {
  code: number,
  message: string,
  detail?: Record<string, string | number | undefined>,
};

export const RenderResultCategory = {
  render: 'render',
  error: 'error',
  receiveRequest: 'receiveRequest',
  hitCache: 'hitCache',
} as const;

type RenderResultBase = {
  context: RenderContext,
  // renderer is used for tracing
  renderBy: string,
};

export type SuccessRenderResult = RenderResultBase & {
  // this is a successful new rendering
  type: 'render',
  // complete html generated from template and rendered app's html
  html: string,
  // afterRender hooks could use it to update cache
  cacheInfo?: CacheInfo,
};

export type RenderResult = (RenderResultBase & ({
  type: 'error',
  // HTTP response of the render error could by generated from the error details
  // eg: displaying the error or redirect to another url
  error: RenderError,
} | {
  // this request is intercepted in receiveRequest hook, SSR is bypassed
  // generate HTTP response with custom logic
  type: 'receiveRequest',
} | {
  // cache hit, no real render happens
  type: 'hitCache',
  content: string,
  cacheInfo: CacheInfo,
})) | SuccessRenderResult;

type HookStorage = Record<HookNames | InnerHookNames, AsyncHook<any, any>>;

type SecondArgOf<T> = T extends (arg1: any, arg2: infer U, ...args: any[]) => any ?
  U : never;

export type ArrayOrSingle<T> = T | T[];

// defined callbacks of all Vise hooks
export type HookCallback = {
  [K in HookNames]: SecondArgOf<InstanceType<typeof HookManager>[K]['tapPromise']>;
};

// added array of callbacks and callback calling timing enforce support
export type HookCallbackConfig = {
  [K in HookNames]?: ArrayOrSingle<HookCallback[K] | {
    callback: HookCallback[K],
    // enforce the execution order of waterfall type callbacks
    // execution order: pre => default (without enforce) => post
    enforce?: 'pre' | 'post',
  }>;
};

export type StdHookCallbackConfig = {
  [K in HookNames]?: Array<HookCallback[K]>;
};

// type of routerBase in vise.config.ts is RegExp[] | string
// when vise write the config in hooks, will call stringifyJSONWithRegExp
// so routerBaseConfig's type is string | string[]
export type HookRouterBase = string | string[];

// exported type of server-hooks.ts
// can config callbacks for hooks and vise hook plugin
export type ViseHooks = HookCallbackConfig & {
  appName: string,
  plugins?: Array<VisePlugin>,
  /**
   * the following 2 base is NOT set by user
   * they are generated in build time base on vise.config.ts
   */
  routerBaseConfig?: HookRouterBase,
  base?: string,
};

export default class HookManager {
  private hooks: HookStorage = {} as HookStorage;

  public tap(config: StdHookCallbackConfig) {
    (Object.keys(config) as Array<keyof typeof config>)
      .forEach((hookName) => {
        const callback = config[hookName];
        if (!callback) {
          return;
        }
        callback.forEach((cb) => {
          // tapPromise 的第一个参数是 tapable 的 pluginName，跟 Vise 的 plugin 不是一回事
          // tapable 的 interception 设计有些无用，所以并不打算依赖其中的数据，直接写死了
          // ts 会匹配不上 cb 类型，因为 ts 把所有 hooks type 聚合了，但因为有 HooksConfig 约束入参
          // 实际 callback 类型跟 hooks 是一一对应的，这里不用检查了，否则只能遍历每个类型
          this[hookName].tapPromise('vise', cb as any);
        });
      });
  }

  private createIfEmpty<T, R>(
    name: HookNames | InnerHookNames,
    creator: () => AsyncHook<T, R>,
  ): AsyncHook<T, R> {
    if (!this.hooks[name]) {
      this.hooks[name] = creator();
    }
    return this.hooks[name];
  }

  // 接收到 HTTP 请求后，可以在此拦截请求，可以简单生成 RenderType 为 receiveRequest 的 RenderResult
  // 在 afterRender 钩子中进一步处理具体渲染结果，相关信息放入 renderResult.context.extra
  // 任意回调函数(tapped function)返回结果即终止其它回调函数执行
  public get receiveRequest() {
    return this.createIfEmpty<[HTTPRequest], Omit<RenderResult, 'type' | 'renderBy'> | void>(
      'receiveRequest',
      () => new tapable.AsyncParallelBailHook(['request']),
    );
  }

  // hook-life-cycle 内部实际使用的 receiveRequest hooks，回调是封装后的 HOF
  public get receiveRequestInner() {
    return this.createIfEmpty<[HTTPRequest], RenderResult | void>(
      'receiveRequestInner',
      () => new tapable.AsyncParallelBailHook(['request']),
    );
  }

  // HTTP 请求解析完成，多个钩子函数顺序执行传递解析结果，可在此修改解析结果
  // 注意如果修改了 url，会导致 hydration 时候出现 mismatch：js 端看到的是修改前的 urlA
  // 服务端看到的是修改后的 urlB，所以如果这里修改 url，需要配合前端的逻辑同步修改
  public get requestResolved() {
    return this.createIfEmpty<[ResolvedRequest], ResolvedRequest>(
      'requestResolved',
      () => new tapable.AsyncSeriesWaterfallHook(['resolvedRequest']),
    );
  }

  // 在开始使用 HTML 缓存之前执行
  // 多个钩子并行执行，串行依赖自行在单个钩子中解决。返回钩子返回结果即终止其它钩子执行。
  // 返回值 CacheInfo 包含 cache key、cache 有效期信息；
  // 服务端会使用其中信息试图命中缓存，如果未命中，重新生成的 HTMl 会依赖此缓存信息进行缓存
  public get beforeUseCache() {
    return this.createIfEmpty<[RenderContext], CacheInfo | void>(
      'beforeUseCache',
      () => new tapable.AsyncParallelBailHook(['renderContext']),
    );
  }

  // 接受 CacheInfo 参数，返回命中的缓存字符串
  // 这个钩子主要是给 server 实现者注入 Redis 查询逻辑等使用，并行执行，第一个返回的结果即为命中的缓存
  // 除非特殊情况 app 业务实现方应该忽略此 hook，否则可能使服务端缓存失效
  public get findCache() {
    return this.createIfEmpty<[CacheInfo], string | void>(
      'findCache',
      () => new tapable.AsyncParallelBailHook(['cacheInfo']),
    );
  }

  // hook-life-cycle 内部实际使用的 findCache hooks，回调是封装后的 HOF
  public get findCacheInner() {
    return this.createIfEmpty<[CacheInfo], FindCacheResult | void>(
      'findCacheInner',
      () => new tapable.AsyncParallelBailHook(['cacheInfo']),
    );
  }

  // 在 HTML 缓存命中后并行执行所有钩子，然后响应 HTTP 请求，无法在此更改响应，可做统计等
  public get hitCache() {
    // AsyncParallelHook 只有一个泛型参数，跟其他 hooks 不同，不能使用 createIfEmpty
    const name = 'hitCache';
    if (!this.hooks[name]) {
      this.hooks[name] = new tapable.AsyncParallelHook<[HitCache]>(['hitCache']);
    }
    return this.hooks[name];
  }

  // 在准备使用 render bundle 等服务端渲染包生成 HTML 之前调用
  // 可用来请求依赖数据等，多个钩子顺序执行传递请求参数
  public get beforeRender() {
    return this.createIfEmpty<[RenderContext], RenderContext>(
      'beforeRender',
      () => new tapable.AsyncSeriesWaterfallHook(['renderContext']),
    );
  }

  // 渲染服务端 app 时调用，对于 vue 应用，此步骤对应加载 vue-render-bundle 渲染页面
  // 这个钩子主要是给 server 实现者使用，串行执行，第一个返回的结果即为渲染结果
  // 渲染结果 RenderResult 支持多种类型，包括渲染失败等情况
  // 除非特殊情况 app 业务实现方应该忽略此 hook
  public get render() {
    return this.createIfEmpty<[RenderContext], RenderResult>(
      'render',
      () => new tapable.AsyncParallelBailHook(['renderContext']),
    );
  }

  // 在 App 渲染完成后执行，根据渲染成功或失败，RenderResult 可能为成功或失败
  // 如需重载渲染结果，钩子可以返回更改后的 RenderResult
  // 渲染结果中包含 SsrBundleSuccess，服务端会使用 SsrBundleSuccess 中的值重新拼装页面模板
  // 这里可以简单替换掉页面 template 而不引起 hydration mismatch (模板是 Vue app 以外的部分)
  // 注意钩子瀑布流顺序执行
  public get afterRender() {
    return this.createIfEmpty<[RenderResult], RenderResult>(
      'afterRender',
      () => new tapable.AsyncSeriesWaterfallHook(['renderResult']),
    );
  }

  // 在所有 HTTP 响应发送前执行，任意回调函数(tapped function)返回结果即终止其它回调函数执行
  // 任意回调优先返回 HTTPResponse 将替代原有 HTTPResponse 返回
  // RenderResult 包含 RenderContext 中各钩子添加的 meta data 和渲染异常 Error 等信息，可通过它们构建最终响应 HTTPResponse
  public get beforeResponse() {
    return this.createIfEmpty<[RenderResult], HTTPResponse | void>(
      'beforeResponse',
      () => new tapable.AsyncParallelBailHook(['renderResult']),
    );
  }
}
