import type {
  ViseHooks,
} from 'vise-ssr';
import {
  mergeConfig,
  RenderResultCategory,
} from 'vise-ssr';
import { fetchLuckyNumber } from './services';
import type { RootState } from './store';

type DeepPartial<T> = T extends object ? { [P in keyof T]?: DeepPartial<T[P]>; } : T;

/**
 * All hook callbacks could be function or array of functions
 * Notice: request.url will only include relative path without appName and domain. For example,
 * dev path: http://127.0.0.1:3000/page-a/
 * online path: https://example.com/path/to/app-name/page-a/
 * all match to request.url === '/page-a/'
 * check https://stauren.github.io/vise-ssr/ for more
 */
const serverHooks: ViseHooks = {
  // app name should not have app- prefix
  appName: '<!--ssr-server-hooks-app-name-->',

  // Vise hooks plugin
  plugins: [],

  /**
   * HTTP requests could be intercepted in this hook after server received it from clients
   * Bypass the default SSR is possible by return a custom `RenderResult`
   * Marks and data should be put in renderResult.context.extra
   */
  receiveRequest: async (/* httpRequest */) => {
    // return Omit<RenderResult, 'type' | 'renderBy'> to intercept
  },

  /**
   * Tapped functions receive a `ResolvedRequest` and return a `ResolvedRequest`.
   * Marks could be added to context of certain requests for later process.
   * Be careful of [hydration mismatch] if you change data in the HTTPRequest.
   */
  requestResolved: async (resolvedRequest) => resolvedRequest,

  /**
   * Tapped function calculate `CacheInfo` from `RenderContext`
   * Which will be used to find previous cached SSR data or save newly generated SSR data.
   */
  beforeUseCache: async (renderRequest) => {
  },

  // Tapped functions will be notified with a successful cache hit event.
  hitCache: async (hitCache) => {
  },

  /**
   * Tapped functions will be called in order before rendering HTML with server renderer provided by web UI libraries
   * Typically this could be used to fetch data for SSR. Data should be transferred in `RenderContext.extra`
   */
  beforeRender: async (renderContext) => {
    const { url } = renderContext.request;
    let extraInitState = {};
    // request data for index page
    if (url === '/') {
      extraInitState = {
        luckyNumber: await fetchLuckyNumber(),
      };
    }
    // strictInitState set to false, state could be updated during render
    const initState: DeepPartial<RootState> = {
      viseIntro: {
        startTime: Date.now(),
        ...extraInitState,
      },
    };
    return mergeConfig(renderContext, {
      meta: {
        initState,
      },
    });
  },

  /**
   * Tapped functions will be called in order after render finishes
   * Processing the result of a successful rendering or handle the error of a failed rendering.
   * Failed SSR could be downgraded to CSR here.
   * Be careful of [hydration mismatch].
   */
  afterRender: [async (renderResult) => renderResult,
    // multiple callbacks supported
    {
      enforce: 'post', // enforce execute order
      callback: async (renderResult) => renderResult,
    }],

  /**
   * Tapped functions will be called after `afterRender`
   * This is the last hook before HTTP Response is sent
   * and it's mainly used for composing the HTTP Response
   * Which could be generated with all data in the
   * `RenderResult` containing the `RenderContext`
   */
  beforeResponse: async (renderResult) => {
    // successful render
    if (renderResult.type === RenderResultCategory.render) {
    }

    // intercepted by receiveRequest hook
    if (renderResult.type === RenderResultCategory.receiveRequest) {
    }

    // render error happened, get detail in renderResult.context and renderResult.error
    if (renderResult.type === RenderResultCategory.error) {
    }
  },
};

export default serverHooks;
