import express, { RequestHandler, Response } from 'express';
import cors, { CorsOptions } from 'cors';
import type {
  HookNames,
  ViseHooks,
  HookCallback,
  HookRouterBase,
  HTTPRequest,
  HTTPResponse,
  RenderResult,
  CacheInfo,
} from 'vise-ssr';
import {
  HookLifeCycle,
  HookLogger,
  RenderResultCategory,
  matchAppForUrl,
} from 'vise-ssr';

import MemCache from 'src/utils/mem-cache';
import { log, error } from 'src/utils/logger';
import { VALID_APP_NAME, loadHookConfig } from 'src/utils/load-bundles';
import { getAppClientBundlePath } from 'src/utils/path';
import RenderService from './render-service';

export interface SSRServerConfig {
  apps: string[],
  base: string,
  useCache?: boolean,
  repeatRender?: number,
  port?: number,
}

function getSafeApps(apps: SSRServerConfig['apps']) {
  return apps.reduce((prev, cur) => {
    if (!cur.match(VALID_APP_NAME)) {
      log(`${cur} is not a safe app name.`);
      return prev;
    }
    prev.push(cur);
    return prev;
  }, [] as string[]);
}

export default class SSRServer {
  private static corsOptions: CorsOptions = {
    origin: true,
    optionsSuccessStatus: 200,
    maxAge: 36000,
  };

  public static getPort() {
    return parseInt(process.env.NODE_PORT || '3000', 10);
  }

  private static getCacheKey(app: string, cacheKey: string) {
    return `${app}-${cacheKey}`;
  }

  private static sendResponse(res: Response, data: HTTPResponse) {
    res.set(data.headers)
      .status(data.code)
      .end(data.body ?? '');
  }

  private express = express();

  private cacheService = new MemCache();

  private useCache: boolean;

  private apps: string[];

  private base: string;

  private port: number;

  private repeatRender: number;

  private renderService: RenderService;

  private hooksRunners: Record<string, HookLifeCycle> = {};

  private routerBaseConfigs: Record<string, HookRouterBase> = {};

  private baseConfigs: Record<string, string> = {};

  private hooks: Partial<HookCallback> = {
    async receiveRequest(request: HTTPRequest): Promise<RenderResult | undefined> {
      log(`request: ${request.url}`);
      return undefined;
    },
    async findCache(this: SSRServer, cacheInfo: CacheInfo) {
      if (this.useCache) {
        return this.findCacheByInfo(cacheInfo);
      }
      return undefined;
    },
    async hitCache(cacheInfo: CacheInfo) {
      log(`response with cache of: ${cacheInfo.key}`);
    },

    async render(this: SSRServer, renderContext) {
      const appName = String(renderContext.extra.app);
      const renderResult = await this.renderService.render(
        appName,
        renderContext,
      );

      // 性能压测时候的重复渲染逻辑
      if (this.repeatRender > 0) {
        for (let i = 0; i < this.repeatRender; i += 1) {
          // await render one bye one on purpose
          // eslint-disable-next-line no-await-in-loop
          await this.renderService.render(appName, renderContext);
          log(`repeat render count: ${i}.`);
        }
      }

      return renderResult;
    },
    async afterRender(this: SSRServer, renderResult) { // 固定为最后一个 callback
      if (renderResult.type === RenderResultCategory.render) {
        const { html, cacheInfo, context } = renderResult;
        const key = cacheInfo?.key;
        if (key && context.meta.cache) {
          const cacheKey = SSRServer.getCacheKey(key, context.extra.app as string);
          this.cacheService.set(cacheKey, html);
          log(`render and cache with: ${key}`);
        } else {
          log('render without cache');
        }
      }
      return renderResult;
    },

    async beforeResponse(renderResult) {
      log(`page render by: ${renderResult.renderBy}`);
    },
  };

  constructor(config: SSRServerConfig) {
    this.base = config.base;
    this.apps = getSafeApps(config.apps);
    this.port = config.port ?? SSRServer.getPort();
    this.repeatRender = config.repeatRender ?? 0;
    this.renderService = new RenderService(this.base, this.apps);

    // repeat render is used to test mem leak, need to disable cache
    const defaultUseCache = config.repeatRender === 0;

    this.useCache = config.useCache ?? defaultUseCache;
    this.initHooks().then(() => {
      this.setupStatic();
      this.setupSSRRequest();
    });

    this.setupRanNumRequest();
  }

  public start() {
    this.express.listen(this.port, () => {
      log(`ssr server started: http://localhost:${this.port}`);
    });
  }

  private async loadHookConfig(appName: string): Promise<ViseHooks> {
    return loadHookConfig(this.base, appName);
  }

  private async initHooks() {
    return Promise.all(this.apps.map(async (appName: string) => {
      try {
        const hookConfig = await this.loadHookConfig(appName);
        if (hookConfig && hookConfig.appName === appName) {
          // routerBaseConfig 已经被转成 string 了
          this.registerBase(appName, hookConfig.routerBaseConfig!, true);
          this.registerBase(appName, hookConfig.base!, false);
          this.hooksRunners[appName] = new HookLifeCycle(
            this.addServerPlugin(hookConfig),
            new HookLogger(log),
          );
          log(`server hooks for "${appName}" installed.`);
        } else {
          log(`no server hooks found for "${appName}".`);
        }
      } catch (e) {
        error(`loadServerHooks fail for "${appName}".`, e);
        throw e;
      }
    }));
  }

  private registerBase(appName: string, base: HookRouterBase, isRouterBase: boolean) {
    const config = isRouterBase ? this.routerBaseConfigs : this.baseConfigs;
    const appWithSameBase = Object.keys(config)
      .find((app) => config[app] === base);
    if (appWithSameBase) {
      throw `${appName} and ${appWithSameBase} has same ${isRouterBase ? 'routerBase' : 'base'}: ${base}`;
    }
    config[appName] = base;
  }

  private addServerPlugin(config: ViseHooks): ViseHooks {
    const bindHooks = (Object.keys(this.hooks) as HookNames[])
      .reduce((prev, hookName) => ({
        ...prev,
        [hookName]: this.hooks[hookName]!.bind(this),
      }), {});
    return {
      ...config,
      plugins: [...config.plugins ?? [], {
        name: 'vise:express-server',
        hooks: bindHooks,
      }],
    };
  }

  private setupSSRRequest() {
    this.express.use('*', (req, res) => {
      const { projectName, routerBase } = matchAppForUrl(this.routerBaseConfigs, req.originalUrl);
      if (!projectName || !this.hooksRunners[projectName]) {
        SSRServer.sendResponse(res, {
          code: 404,
          headers: {},
          body: 'Not found',
        });
        return;
      }

      const handleWithHookLifeCycle = async () => {
        try {
          const response = await this.hooksRunners[projectName].start({
            url: req.originalUrl,
            headers: req.headers,
            body: req.body,
          }, {
            routerBase,
          }, {
            app: projectName,
          });
          SSRServer.sendResponse(res, response);
        } catch (e) {
          const isError = (x: any): x is Error => typeof x.stack === 'string';
          const msg = isError(e) ? e.stack : e;
          log(`request to ${req.originalUrl} failed: ${msg}`);
          SSRServer.sendResponse(res, {
            code: 500,
            headers: {},
            body: String(msg),
          });
        }
      };

      handleWithHookLifeCycle();
    });
  }

  private setupStatic() {
    this.apps.forEach((appName) => {
      const staticBase = this.baseConfigs[appName];
      // 只处理相对路径，如果是 http 开头，则由独立 CDN 提供文件服务
      if (staticBase.indexOf('/') === 0) {
        this.express.use(
          staticBase,
          express.static(getAppClientBundlePath(this.base, appName), {
            index: false,
          }),
        );
      }
    });
  }

  private setupRanNumRequest() {
    this.express.options('/random-num', cors(SSRServer.corsOptions) as RequestHandler);
    this.express.get(
      '/random-num',
      cors(SSRServer.corsOptions) as RequestHandler,
      (req, res) => {
        res.status(200).set({ 'Content-Type': 'application/json' })
          .end(JSON.stringify({
            code: 0,
            msg: 'ok',
            data: {
              value: Math.round(Math.random() * 10000),
            },
          }));
      },
    );
  }

  private findCacheByInfo(cacheInfo: CacheInfo): string | undefined {
    // TODO 处理 cacheInfo.expire 和 stale 相关逻辑
    const key = SSRServer.getCacheKey(cacheInfo.key, cacheInfo.context.extra.app as string);
    return this.cacheService.get(key);
  }
}
