import {
  ViseHooks,
  SsrFetchResultOf,
  RenderResultCategory,
} from 'vise-ssr';
import { fetchDataForSsrRender } from '@/utils/request';
import { State } from '@/store';

type LuckNumFetchResult = SsrFetchResultOf<{ value: number | string }>;

// server hooks 具体用法请参考官网: https://vise.com/
const serverHooks: ViseHooks = {
  // app 名称，注意不要包含 app- 的前缀
  appName: '<!--ssr-server-hooks-app-name-->',

  // 如果加载 Vise plugin，可以放入此数组
  plugins: [],

  // receiveRequest:接收到 HTTP 请求后，可以在此拦截请求，可以简单生成 RenderType 为 receiveRequest 的 RenderResult
  receiveRequest: async (/* httpRequest */) => {
    // 如果希望拦截请求，返回 Omit<RenderResult, 'type' | 'renderBy'>
  },

  // HTTP 请求解析完成，多个钩子函数顺序执行传递解析结果，可在此修改解析结果
  requestResolved: async resolvedRequest => resolvedRequest,

  // 在开始使用 HTML 缓存之前执行，如果确定缓存是否过期需要请求接口，可以在这里请求
  beforeUseCache: async (/* renderRequest */) => {
    // 返回值类型 CacheInfo（包含 cache key、cache 有效期信息）: void
  },

  // 在 HTML 缓存命中后并行执行所有钩子，然后响应 HTTP 请求，无法在此更改响应，可做统计等
  hitCache: async (/* hitCache */) => {
    // console.log(`Use cache with key: ${hitCache.key}`);
  },

  // 在准备使用 Vue render bundle 等服务端渲染包生成 HTML 之前调用
  beforeRender: async (renderContext) => {
    const { url } = renderContext.request;
    let extraInitState = {};
    // 为首页请求额外接口数据
    if (url === '/') {
      try {
        const apiResult = await fetchDataForSsrRender() as LuckNumFetchResult;
        extraInitState = {
          luckyNumber: parseInt(String(apiResult.data.value), 10),
        };
      } catch (e) {
        return {
          ...renderContext,
          error: {
            code: 500,
            detail: e instanceof Error ? { Stack: e.stack } : undefined,
            message: e instanceof Error ? e.message : String(e),
          },
        };
      }
    }
    // 示例使用 strictInitState false 模式，render 期间可以更新 state
    const initState: State = {
      count: 0,
      luckyNumber: -1,
      ...extraInitState,
    };
    return {
      ...renderContext,
      extra: {
        ...renderContext.extra,
        initState,
      },
    };
  },

  // 在 app HTML 渲染完成后（不是整个页面）执行
  // 根据渲染成功或失败，可能接受 RenderError 或 RenderDone 参数
  // 如需重载渲染结果，钩子需要返回 RenderResult 重载，瀑布流顺序执行
  // 注意，如果在这个钩子里面重载渲染结果，在 hydration 的时候可能会发生 mismatch
  afterRender: [async renderResult => renderResult,
    // 支持数组传入多个 callback
    {
      enforce: 'post', // 如有需求，可强制 callback 靠前或靠后执行
      // 可在此修改渲染结果
      callback: async renderResult => renderResult,
    }],

  // 在所有 HTTP 响应发送前执行
  beforeResponse: async (renderResult) => {
    // 为成功渲染页面，统一添加特定 headers 等
    if (renderResult.type === RenderResultCategory.render) {
    }

    // 被 receiveRequest hook 拦截的请求，可以被再次拦截
    if (renderResult.type === RenderResultCategory.receiveRequest) {
    }

    // 发生服务端异常，可以在此从 renderResult.context 和 renderResult.error
    if (renderResult.type === RenderResultCategory.error) {
    }
  },
};

export default serverHooks;
