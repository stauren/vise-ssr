import type {
  HTTPRequest,
} from '../index';
import type {
  HookNames,
  RenderContext,
  RenderResult,
  ResolvedRequest,
  HitCache,
  CacheInfo,
} from './hook-manager';
import HookManager from './hook-manager';

import HookLogger from './hook-logger';

import isEqual from '../node/utils/is-equal';
import type { JSONValue } from '../';

class HookCaller {
  private hooks: HookManager;
  private logger: HookLogger | undefined;

  constructor(
    hooks: HookManager,
    logger?: HookLogger,
  ) {
    this.hooks = hooks;
    this.logger = logger;
  }

  public async receiveRequest(httpRequest: HTTPRequest) {
    // 因为返回值被 hof 改变，实际调用的 hook 是 receiveRequestInner
    const hookResult = await this.hooks.receiveRequestInner.promise(httpRequest);
    if (hookResult !== undefined) {
      // 日志仍然按 receiveRequest 显示
      this.log('receiveRequest', hookResult);
    }
    return hookResult;
  }

  public async requestResolved(resolvedRequest: ResolvedRequest) {
    const name = 'requestResolved';
    const finalResolvedRequest = await this.hooks[name].promise(resolvedRequest);
    if (!isEqual(finalResolvedRequest.original, finalResolvedRequest.resolved)) {
      this.log(
        name,
        finalResolvedRequest,
      );
    }
    return finalResolvedRequest;
  }

  public async beforeUseCache(renderContext: RenderContext) {
    const name = 'beforeUseCache';
    const cacheInfo = await this.hooks[name].promise(renderContext);
    if (cacheInfo !== undefined) {
      this.log(name, cacheInfo);
    }
    return cacheInfo;
  }

  public async findCache(cacheInfo: CacheInfo) {
    // 因为返回值被 hof 改变，实际调用的 hook 是 findCacheInner
    const result = await this.hooks.findCacheInner.promise(cacheInfo);
    if (result !== undefined) {
      // 日志仍然按 findCache 显示
      this.log('findCache', result);
    }
    return result;
  }

  public async hitCache(hitCache: HitCache) {
    const name = 'hitCache';
    this.hooks[name].promise(hitCache);
    this.log(name, hitCache);
  }

  public async beforeRender(renderContext: RenderContext) {
    const name = 'beforeRender';
    const finalRenderContext = await this.hooks[name].promise(renderContext);
    if (!isEqual(finalRenderContext, renderContext)) {
      this.log(name, finalRenderContext);
    }
    return finalRenderContext;
  }

  public async render(renderContext: RenderContext) {
    const name = 'render';
    const renderResult = await this.hooks[name].promise(renderContext);
    this.log(name, renderResult);
    return renderResult;
  }

  public async afterRender(renderResult: RenderResult) {
    const name = 'afterRender';
    const hookResult = await this.hooks[name].promise(renderResult);
    if (!isEqual(hookResult, renderResult)) {
      this.log(name, hookResult);
    }
    return hookResult;
  }

  public async beforeResponse(renderResult: RenderResult) {
    const name = 'beforeResponse';
    const hookResult = await this.hooks[name].promise(renderResult);
    if (hookResult !== undefined) {
      this.log(name, hookResult);
    }
    return hookResult;
  }

  private log(hookName: HookNames, interception: JSONValue) {
    this.logger?.log(hookName, interception);
  }
}

export default HookCaller;
