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
  error?: RenderError, // 当各个钩子发生异常时，可以在渲染上下文携带该error信息
} & SsrContext;

// 渲染解析类型，存储原始渲染上下文及解析后上下文
export type ResolvedRequest = {
  // 被解析的处理该请求的 app
  readonly original: RenderContext,
  resolved: RenderContext,
};

export type CacheInfo = {
  // 业务缓存 key
  key: string,
  // 缓存过期时间点, unix timestamp
  expire: number,
  // 是否先使用已过期数据再更新缓存
  stale: boolean,
  context: RenderContext,
};

// 注意：命中缓存 key 不包括非业务的框架生成的缓存 key 部分
export type HitCache = CacheInfo & {
  content: string,
};

// 内部 hook findCacheInner 的返回值
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
  // 传递渲染中的参数和各个钩子的注入的 metadata
  context: RenderContext,
  // 渲染者，便于定位页面生成的责任方
  renderBy: string,
};

export type SuccessRenderResult = RenderResultBase & {
  // 完成了全新 SSR 渲染时触发
  type: 'render',
  // SSR 渲染结果
  html: string,
  // afterRender hooks 需要 cacheInfo 来更新缓存，如果 beforeUseCache 有返回则会带入
  cacheInfo?: CacheInfo,
};

// 服务器渲染结果，包括渲染上下文、缓存相关信息和 SSR 渲染结果，也有可能是渲染异常
export type RenderResult = (RenderResultBase & ({
  type: 'error',
  // 在渲染异常时触发，RenderError 中包含完整错误信息
  // 可据此在 beforeResponse 中生成相关错误对应的 HTTPResponse 页面
  error: RenderError,
} | {
  // 这一类渲染请求是被 receiveRequest 拦截的请求
  // Plugin 或者 App 应该在 afterRender 或/和 beforeResponse 中
  // 识别到自己的拦截，并自行完成页面的渲染或 HTTPResponse 构建
  type: 'receiveRequest',
} | {
  // 命中缓存的渲染结果，没有发生真正渲染
  type: 'hitCache',
  content: string,
  cacheInfo: CacheInfo,
})) | SuccessRenderResult;

type HookStorage = Record<HookNames | InnerHookNames, AsyncHook<any, any>>;

type SecondArgOf<T> = T extends (arg1: any, arg2: infer U, ...args: any[]) => any ?
  U : never;

export type ArrayOrSingle<T> = T | T[];

export type HookCallback = {
  [K in HookNames]: SecondArgOf<InstanceType<typeof HookManager>[K]['tapPromise']>;
};

export type HookCallbackConfig = {
  [K in HookNames]?: ArrayOrSingle<HookCallback[K] | {
    callback: HookCallback[K],
    // 如果是 waterfall 类型 hooks，支持将对应回调放入当前回调数组头或尾
    // 注意 pre 并不一定意味为数组头，当多个 pre 回调同时应用时，
    // 最后一个回调放入数组头，post 同理
    // 另外注意服务端可能有固定兜底回调不受此控制
    // 默认 post
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

export type ViseHooks = HookCallbackConfig & {
  appName: string,
  plugins?: Array<VisePlugin>,
  /**
   * 以下 2 个 base 不由用户配置，是一个从 build time 的 vise.config.ts 向
   * runtime 的 vise-hooks.ts 传递参数的设计，是自动注入的
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
