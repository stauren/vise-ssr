import type {
  ViseHooks,
  SsrFetchResultOf,
} from 'vise-ssr';
import {
  RenderResultCategory,
  mergeConfig,
  refillRenderResult,
} from 'vise-ssr';
import { formatLuckyNumber } from './formatters';
import request from './utils/request';
import type { RootState } from './store';

type DeepPartial<T> = T extends object ? { [P in keyof T]?: DeepPartial<T[P]>; } : T;

type LuckNumFetchResult = SsrFetchResultOf<{ value: number | string }>;

/*
 * 所有的回调都可以是 function 或者 function 数组
 * 注意从 request.url 中取得的访问路径，是 app 内的路径，不包括 appName 的 routerBase 部分
 * 如开发期间路径为 http://127.0.0.1:3000/page-a/
 * 线上路径是 https://example.com/path/to/app-name/page-a/
 * 在 hooks 中取到的都是 /page-a/
 */
const serverHooks: ViseHooks = {
  // app 名称，注意不要包含 app- 的前缀
  appName: '<!--ssr-server-hooks-app-name-->',
  // 如果加载 Vise plugin，可以放入此数组
  plugins: [],

  /*
   * 接收到 HTTP 请求后，可以在此拦截请求，可以简单生成 RenderType 为 receiveRequest 的 RenderResult
   * 在 afterRender 钩子中进一步处理具体渲染结果，相关信息放入 renderResult.context.extra
   * 生成渲染结果的渲染方应该提供符合规范的 renderBy 名字
   * 任意回调函数(tapped function)返回结果即终止其它回调函数执行
   */
  receiveRequest: [async (httpRequest) => {
    let result;
    if (httpRequest.url === '/hook-test') {
      result = {
        context: {
          request: httpRequest,
          extra: { // 将生成最终 response 的信息放入 extra 传递
            jumpTo: 'https://www.qq.com/',
          },
        },
      };
    }
    return result;
  }, {
    // 多个 hooks 回调可以共存
    callback: async (httpRequest) => {
      console.log(httpRequest.url);
    },
    // 强制回调后执行（注意多个 post 或多个 pre 回调的执行顺序依赖传入顺序）
    enforce: 'post',
  }, {
    callback: async (httpRequest) => {
      console.log(httpRequest.url);
    },
    // 强制回调后执行（注意多个 post 或多个 pre 回调的执行顺序依赖传入顺序）
    enforce: 'pre',
  }],

  /*
   * HTTP 请求解析完成，多个钩子函数顺序执行传递解析结果，可在此修改解析结果
   * 注意如果修改了 url，会导致 hydration 时候出现 mismatch：js 端看到的是修改前的 urlA
   * 服务端看到的是修改后的 urlB，所以如果这里修改 url，需要配合前端的逻辑同步修改
   */
  requestResolved: async (resolvedRequest) => {
    const { original, resolved } = resolvedRequest;
    const { url } = original.request;
    const extraData: Record<string, string> = {};

    if (url === '/hook-jump') {
      extraData.injectByHook = 'RequestResolved inject';
    }
    return {
      original,
      resolved: {
        ...resolved,
        extra: { ...resolved.extra, ...extraData },
      },
    };
  },

  /*
   * 在开始使用 HTML 缓存之前执行，如果确定缓存是否过期需要请求接口，可以在这里请求
   * 多个钩子并行执行，串行依赖自行在单个钩子中解决。返回钩子返回结果即终止其它钩子执行。
   * 返回值 CacheInfo 包含 cache key、cache 有效期信息；
   * 服务端会使用其中信息试图命中缓存，如果未命中，重新生成的 HTMl 会依赖此缓存信息进行缓存
   */
  beforeUseCache: async (renderRequest) => {
    const { url, headers } = renderRequest.request;
    const userAgent = headers['user-agent'] || '';

    // suppose generated html depends on browser is chrome or not
    const browser = userAgent.indexOf('Chrome') > -1 ? 'chrome' : 'other';

    return {
      key: `${browser}_${url}`,
      expire: Date.now() + 3600 * 1000,
      stale: true,
      context: renderRequest,
    };
  },

  // 在 HTML 缓存命中后并行执行所有钩子，然后响应 HTTP 请求，无法在此更改响应，可做统计等
  hitCache: async (hitCache) => {
    console.log(`Use cache with key: ${hitCache.key}`);
  },

  /*
   * 在准备使用 Vue render bundle 等服务端渲染包生成 HTML 之前调用
   * 可用来请求依赖数据等，多个钩子顺序执行，使用 extra 传递数据
   * 在 strictInitState 模式下，extra.initState 即为最终初始化页面数据
   */
  beforeRender: async (renderContext) => {
    const { url } = renderContext.request;
    let extraInitState = {};
    // 为首页请求额外接口数据
    if (url === '/') {
      const apiResult = await request({
        url: 'https://www.randomnumberapi.com/api/v1.0/random?min=1000&max=9999&count=1',
      }) as LuckNumFetchResult;
      extraInitState = {
        luckyNumber: apiResult.code === 0 ? formatLuckyNumber(apiResult) : -1,
      };
    }
    // 示例使用 strictInitState false 模式，render 期间可以更新 state
    const initState: DeepPartial<RootState> = {
      viseIntro: {
        startTime: Date.now(),
        ...extraInitState,
      },
    };
    return mergeConfig(renderContext, {
      extra: {
        initState,
      },
    });
  },

  /*
   * 在 app HTML 渲染完成后（不是整个页面）执行
   * 根据渲染成功或失败，可能接受 RenderError 或 RenderDone 参数
   * 如需重载渲染结果，钩子需要返回 RenderResult 重载，瀑布流顺序执行
   * 注意，如果在这个钩子里面重载渲染结果，在 hydration 的时候可能会发生 mismatch
   */
  afterRender: async (renderResult) => {
    if (renderResult.type === RenderResultCategory.render) {
      // 可以重载渲染结果，根据 ssrResult 重新拼装模板
      // 这里是一个很好的重载 ssrResult.template 的时机，外层模板跟 vue app 无关，不会引起 hydration mismatch
      const { url } = renderResult.context.request;

      let newExtra = mergeConfig(renderResult.context.extra, {
        initState: {
          viseIntro: {
            renderEndTime: Date.now(),
          },
        },
      });
      if (url === '/hook-jump') {
        newExtra = mergeConfig(newExtra, {
          title: 'render finish override2',
        });
      }
      return refillRenderResult(mergeConfig(renderResult, {
        context: {
          extra: newExtra,
        },
      }));
    }
    if (renderResult.type === RenderResultCategory.error) {
      /*
       * 如果发生渲染异常，这里没法做跳转，只能将异常重载为一个正常的渲染结果
       * 或者把一个异常映射为另外的异常，为异常添加具体的 meta data
       * 具体的跳转，需要在 beforeResponse 钩子里面做
       */
      return mergeConfig(renderResult, {
        error: {
          detail: {
            reason: 'info sent with error result, can be ready by beforeResponse hook',
          },
        },
      });
    }
    return renderResult;
  },

  /*
   * 在所有 HTTP 响应发送前执行
   * 任意回调函数(tapped function)返回结果即终止其它回调函数执行
   * 优先的返回 HTTPResponse 将替代原有 HTTPResponse 返回
   */
  beforeResponse: async (renderResult) => {
    // 为成功渲染页面，统一添加特定 headers 等
    if (renderResult.type === RenderResultCategory.render) {
      return { // 可以在此重载渲染成功的 HTTP 响应，其实这里的逻辑跟原生是一样的
        code: 200,
        headers: {
          'content-type': 'text/html;charset=utf-8',
        },
        body: renderResult.ssrResult.html,
      };
    }

    // 被 receiveRequest hook 拦截的请求，可以被再次拦截
    if (renderResult.type === RenderResultCategory.receiveRequest) {
      if (renderResult.context.request.url === '/hook-test') {
        return {
          code: 302,
          headers: {
            location: 'http://127.0.0.1:3000/hook-jump',
          },
        };
      }
    }

    if (renderResult.type === RenderResultCategory.error) {
      /*
       * 发生服务端异常，可以在此从 renderResult.context 和 renderResult.error
       * 读取到之前钩子传递下来的 meta data，可以在此展示最终处理异常，上报、跳转 CSR fallback 页面等
       * result = {
       *   code: 302,
       *   headers: {
       *     location: 'http://example.com/path/to/csr',
       *   },
       * };
       */
    }
  },
};

export default serverHooks;
