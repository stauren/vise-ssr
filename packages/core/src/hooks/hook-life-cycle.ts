import type {
  HTTPRequest,
  HTTPResponse,
  RenderContextMeta,
  SsrContext,
} from '../';
import type {
  RenderContext,
  RenderError,
  RenderResult,
  ViseHooks,
  CacheInfo,
} from './hook-manager';
import HookCaller from './hook-caller';
import HookManager from './hook-manager';
import HookLogger from './hook-logger';
import { parseHooksWithPlugins } from './hook-plugin';

const DEFAULT_RENDER = 'vise:core';

const HTTP_RESPONSE_CODE = {
  success: 200,
  serverError: 500,
};

// type Optional<T, K extends keyof T> = Omit<T, K> & Partial<T>;
type CallCacheResult = {
  // 有缓存信息且命中
  renderBy: string,
  content: string,
  cacheInfo: CacheInfo,
} | {
  // 未命中，可能传了也可能未传 cache 信息
  cacheInfo?: CacheInfo,
};

class HookLifeCycle {
  private hookCaller: HookCaller;
  constructor(
    viseHooks: ViseHooks,
    logger?: HookLogger,
  ) {
    const hooksConfig = parseHooksWithPlugins(viseHooks);
    const hookManager = new HookManager();
    hookManager.tap(hooksConfig);

    this.hookCaller = new HookCaller(hookManager, logger);
  }

  public async start(
    httpRequest: HTTPRequest,
    sessionMeta: RenderContextMeta = {},
    sessionExtra: SsrContext['extra'] = {},
  ): Promise<HTTPResponse> {
    const initMeta: RenderContextMeta = {
      title: '',
      cache: true,
      initState: {},
      routerBase: '/',
      ...sessionMeta,
    };
    const { routerBase } = initMeta;
    const { url } = httpRequest;

    // url in lifecycle start with '/' and do NOT have routerBase prefix
    let urlInLifeCycle = url.substring(url.indexOf(routerBase!) + routerBase!.length);
    if (!urlInLifeCycle.startsWith('/')) {
      urlInLifeCycle = `/${urlInLifeCycle}`;
    }
    const originalRequest = {
      ...httpRequest,
      url: urlInLifeCycle,
    };
    const originalContext = {
      request: originalRequest,
      meta: initMeta,
      extra: sessionExtra,
    };
    const interceptedResult = await this.hookCaller.receiveRequest(originalRequest);
    if (interceptedResult !== undefined) {
      return this.end({
        type: 'receiveRequest',
        context: interceptedResult.context,
        renderBy: interceptedResult.renderBy,
      });
    }

    const { resolved: resolvedContext } = await this.hookCaller.requestResolved({
      original: originalContext,
      resolved: {
        request: { ...originalRequest },
        meta: { ...initMeta },
        extra: { ...sessionExtra },
      },
    });

    const cacheResult = await this.callCacheHooks(resolvedContext);
    if ('content' in cacheResult) {
      return this.end({
        ...cacheResult,
        context: resolvedContext,
        type: 'hitCache',
      });
    }

    const finalRenderContext = await this.hookCaller.beforeRender(resolvedContext);

    const finalRenderResult = await this.callRenderHooks(finalRenderContext, cacheResult.cacheInfo);

    return this.end(finalRenderResult);
  }

  private async callCacheHooks(context: RenderContext): Promise<CallCacheResult> {
    const cacheInfo = await this.hookCaller.beforeUseCache(context);

    if (cacheInfo?.key) {
      const cacheResult = await this.hookCaller.findCache(cacheInfo);
      if (cacheResult) {
        const hitCache = {
          ...cacheInfo,
          content: cacheResult.content,
        };
        this.hookCaller.hitCache(hitCache);
        return {
          cacheInfo,
          ...cacheResult,
        };
      }
      return {
        cacheInfo,
      };
    }
    return {};
  }

  private async callRenderHooks(context: RenderContext, cacheInfo?: CacheInfo): Promise<RenderResult> {
    let renderResult: RenderResult;
    const { error } = context;
    const getErr = (error: RenderError): RenderResult => ({
      type: 'error',
      renderBy: DEFAULT_RENDER,
      context,
      error,
    });
    // 当 RenderContext.error 存在异常时，此时没必要走 render
    // 可以直接吐出 renderError，最后兜底进行降级处理
    if (error) {
      return getErr(error);
    }
    try {
      renderResult = await this.hookCaller.render(context);
    } catch (e) {
      renderResult = getErr({
        code: HTTP_RESPONSE_CODE.serverError,
        message: e instanceof Error ? e.message : String(e),
        detail: e instanceof Error ? { stack: e.stack } : undefined,
      });
    }
    if (cacheInfo && renderResult.type === 'render') {
      renderResult.cacheInfo = cacheInfo;
    }

    return renderResult;
  }

  private async end(renderResult: RenderResult): Promise<HTTPResponse> {
    const finalRenderResult = await this.hookCaller.afterRender(renderResult);
    const hookRes = await this.hookCaller.beforeResponse(finalRenderResult);
    if (hookRes) {
      return hookRes;
    }

    let code = HTTP_RESPONSE_CODE.success;
    let body;
    switch (renderResult.type) {
      case 'hitCache':
        body = renderResult.content;
        break;
      case 'error':
        code = renderResult.error.code;
        body = renderResult.error.message;
        break;
      case 'receiveRequest':
        // should not end here, plugin intercept at receiveRequest should finish render
        // in previous hooks
        code = HTTP_RESPONSE_CODE.serverError;
        body = 'Fatal Error: Hooks intercept the request with receiveRequest without finish rendering';
        break;
      default: // render
        body = renderResult.html;
    }

    return {
      code,
      body,
      headers: {
        'content-type': 'text/html; charset=utf-8',
      },
    };
  }
}

export default HookLifeCycle;
