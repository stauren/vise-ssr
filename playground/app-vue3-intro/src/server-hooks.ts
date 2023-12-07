import cookie from 'cookie';
import type {
  ViseHooks,
} from 'vise-ssr';
import {
  RenderResultCategory,
  mergePartial,
  refillRenderResult,
} from 'vise-ssr';
import SIDEBAR_ITEMS from './data/sidebar-items.json';
import { fetchLuckyNumber } from './services';
import type { State } from './store';

function findMarkdownPage(url: string) {
  return SIDEBAR_ITEMS
    .find((item) => url.indexOf(`/${item.id}.html`) === 0
      || (url === '/' && item.id === 'introduction'));
}

/**
 * All hook callbacks could be function or array of functions
 * Notice: request.url will only include relative path without appName and domain. For example,
 * dev path: http://127.0.0.1:3000/page-a/
 * online path: https://example.com/path/to/app-name/page-a/
 * all match to request.url === '/page-a/'
 */
const serverHooks: ViseHooks = {
  // app name should not have app- prefix
  appName: 'vue3-intro',
  // Vise hooks plugin
  plugins: [],

  /**
   * HTTP requests could be intercepted in this hook after server received it from clients
   * Bypass the default SSR is possible by return a custom `RenderResult`
   * Marks and data should be put in renderResult.context.extra
   */
  receiveRequest: [async (httpRequest) => {
    let result;
    if (httpRequest.url === '/hook-test') {
      result = {
        context: {
          request: httpRequest,
          meta: {},
          extra: { // add marks to context.extra
            jumpTo: 'https://www.qq.com/',
          },
        },
      };
    }
    return result;
  }],

  /**
   * Tapped functions receive a `ResolvedRequest` and return a `ResolvedRequest`.
   * Marks could be added to context of certain requests for later process.
   * Be careful of [hydration mismatch] if you change data in the HTTPRequest.
   */
  requestResolved: [async (resolvedRequest) => {
    const { original } = resolvedRequest;
    const { url } = original.request;
    const extraData: Record<string, string> = {};

    if (url === '/hook-jump') {
      extraData.injectByHook = 'RequestResolved inject';
    }
    return mergePartial(resolvedRequest, {
      resolved: {
        extra: extraData,
      },
    });
  }, {
    // multiple tapped functions allowed
    callback: async (resolvedRequest) => {
      const { original: { request: { headers } } } = resolvedRequest;
      return mergePartial(resolvedRequest, {
        resolved: {
          // pass user agent and cookie as context extra data
          // which could be accessed as ssr context
          extra: {
            userAgent: headers['user-agent'] || '',
            cookies: cookie.parse(headers.cookie as string ?? ''),
          },
        },
      });
    },
    // enforcing execution order of Waterfall type hooks
    enforce: 'pre',
  }],

  /**
   * Tapped function calculate `CacheInfo` from `RenderContext`
   * Which will be used to find previous cached SSR data or save newly generated SSR data.
   */
  beforeUseCache: async (renderRequest) => {
    const { url, headers } = renderRequest.request;
    const userAgent = headers['user-agent'] || '';
    let result;

    // suppose generated html depends on browser is chrome or not
    const browser = userAgent.indexOf('Chrome') > -1 ? 'chrome' : 'other';

    // cache html by page
    if (findMarkdownPage(url)) {
      result = {
        key: `${browser}_${url}`,
        expire: Date.now() + 3600 * 1000,
        stale: true,
        context: renderRequest,
      };
    }
    return result;
  },

  // Tapped functions will be notified with a successful cache hit event.
  hitCache: async (hitCache) => {
    // for example
    // eslint-disable-next-line no-console
    console.log(`Use cache with key: ${hitCache.key}`);
  },

  /**
   * Tapped functions will be called in order before rendering HTML
   * with server renderer provided by web UI libraries.
   * Typically this could be used to fetch data for SSR.
   * Data should be transferred in `RenderContext.extra`
   */
  beforeRender: async (renderContext) => {
    const { url } = renderContext.request;
    let extraInitState = {};
    // request data for index page
    if (url === '/') {
      extraInitState = {
        luckyNumber: await fetchLuckyNumber(),
        subTitle: ['Lucky', 'Number', 'from', 'API:'],
      };
    }
    // strictInitState set to false, state could be updated during render
    const initState: Partial<State> = {
      startTime: Date.now(),
      ...extraInitState,
    };
    return mergePartial(renderContext, {
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
  afterRender: async (renderResult) => {
    if (renderResult.type === RenderResultCategory.render) {
      const { url } = renderResult.context.request;

      let newMeta = mergePartial(renderResult.context.meta, {
        initState: { renderEndTime: Date.now() },
      });
      if (url === '/hook-jump') {
        newMeta = mergePartial(newMeta, {
          title: 'render finish override2',
        });
      }
      return refillRenderResult(mergePartial(renderResult, {
        context: {
          meta: newMeta,
        },
      }));
    }
    if (renderResult.type === RenderResultCategory.error) {
      const err = renderResult.error;
      return mergePartial(renderResult, {
        error: {
          // handle error in beforeResponse hook
          message: err.code === 404 ? (err.detail!.reason as string) : err.message,
        },
      });
    }
    return renderResult;
  },

  /**
   * Tapped functions will be called after `afterRender`
   * This is the last hook before HTTP Response is sent
   * and it's mainly used for composing the HTTP Response
   * Which could be generated with all data in the
   * `RenderResult` containing the `RenderContext`
   */
  beforeResponse: async (renderResult) => {
    if (renderResult.type === RenderResultCategory.render) {
      return {
        code: 200,
        headers: {
          'content-type': 'text/html;charset=utf-8',
        },
        body: renderResult.html,
      };
    }

    // request intercepted by receiveRequest hook
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
      // fallback to CSR when error
      /*
       * result = {
       *   code: 302,
       *   headers: {
       *     location: 'http://example.com/path/to/csr',
       *   },
       * };
       */
    }
    return undefined;
  },
};

export default serverHooks;
