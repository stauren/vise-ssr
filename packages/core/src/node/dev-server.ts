import path from 'path';
import express, { Express, Response } from 'express';
import { createServer as viteCreateServer } from 'vite';
import type { ViteDevServer } from 'vite';
import type { SupportedScaffold } from '@vise-ssr/shared';
import { mergePartial, ScaffoldToPackage } from '@vise-ssr/shared';
import type {
  HTTPResponse,
  SsrBundleRender,
} from '..';
import { getAppRoot, getAppVisePath } from './utils/path';
import prepareViseDir from './init-app';
import { getViteDevConfig } from './config';
import { refillRenderResult } from './utils/strings';
import matchAppForUrl from './utils/match-app';
import type {
  ViseHooks,
  HookCallback,
  HookRouterBase,
  HookNames,
  SuccessRenderResult,
} from '../hooks';
import {
  HookLifeCycle,
  HookLogger,
} from '../hooks';
import dynamicImportTs from './utils/dynamic-import-ts';
import getAppViseConfig from './app-config';
import { log, error } from './utils/log';

const isTest = process.env.NODE_ENV === 'test' || !!process.env.VITE_TEST_BUILD;
const CODE_SERVER_ERROR = 500;
const DEV_RENDERER = 'vise:dev-server';

const SERVER_HOOK_CONFIG = 'src/server-hooks.ts';

class ViseDevServer {
  private static async sendResponse(res: Response, data: HTTPResponse) {
    res.set(data.headers)
      .status(data.code)
      .end(data.body ?? '');
  }

  private appRoot: string;

  private appVisePath: string;

  private express: Express;

  private scaffold: SupportedScaffold;

  private mapScaffoldFiles: Record<string, string> = {};

  private viteServer: ViteDevServer | undefined;

  private port: number;

  private hookLifeCycle: HookLifeCycle | undefined;

  private hooks: Partial<HookCallback> = {
    async render(this: ViseDevServer, renderContext) {
      const { request } = renderContext;
      const template = await this.viteServer!.transformIndexHtml(request.url, '');
      const entryPath = this.resolve(this.mapScaffoldFiles.serverEntry);
      const render = (await this.viteServer!.ssrLoadModule(entryPath)).render! as SsrBundleRender;
      const ssrResult = await render(renderContext);
      if (!ssrResult || 'code' in ssrResult) {
        return {
          type: 'error',
          renderBy: DEV_RENDERER,
          error: ssrResult ?? {
            code: CODE_SERVER_ERROR,
            message: 'Render fail',
          },
          context: renderContext,
        };
      }
      const { extra, meta, html } = ssrResult;
      const result: SuccessRenderResult = {
        renderBy: DEV_RENDERER,
        type: 'render',
        context: mergePartial(renderContext, {
          meta: {
            ...meta,
            template,
          },
          extra,
        }),
        html,
      };
      return refillRenderResult(result);
    },
    async beforeResponse(this: ViseDevServer, renderResult) {
      if (renderResult.type === 'error') {
        error('render fail', renderResult.error);
      }
    },
  };

  private routerBaseConfigs: Record<string, HookRouterBase> = {};

  constructor(
    appRoot: string,
    scaffold: SupportedScaffold,
    port: number,
  ) {
    this.appRoot = appRoot;
    this.appVisePath = getAppVisePath({ root: appRoot });
    this.scaffold = scaffold;
    this.port = port;
    this.express = express();
  }

  public start() {
    this.express.listen(this.port, () => {
      log(`ssr server started: http://localhost:${this.port}`);
    });
  }

  public async init() {
    await prepareViseDir(this.appVisePath);
    await this.importScaffoldFiles();
    await this.initHooks();
    await this.setupExpress();
  }

  private async importScaffoldFiles() {
    this.mapScaffoldFiles = (await import(ScaffoldToPackage[this.scaffold])).SCAFFOLD_FILES;
  }

  private async loadAppHookConfig() {
    // ?????? app ????????? hooks ??????
    const hookConfigFile = path.resolve(this.appRoot, SERVER_HOOK_CONFIG);
    return dynamicImportTs<ViseHooks>(hookConfigFile);
  }

  private async initHooks() {
    try {
      await this.initViteServer();
      const hookConfig = await this.loadAppHookConfig();
      if (hookConfig) {
        const { routerBase } = await getAppViseConfig();
        const { appName } = hookConfig;

        /**
         * ????????????????????????????????? scaffold-generator ????????? rollup ???
         * load ????????????????????? build time ??? vise.config.ts ??????????????????
         * ????????? runtime ??? server-hooks.ts ???????????????????????? dev ?????????
         * server-hooks.ts ???????????? vite ?????????????????? ssrLoadModule ????????????
         * ??????????????????????????????????????? bug??????????????? export ?????????????????????
         * import ??????????????????
         * ????????????????????????????????? vite ?????????????????? 2 ???????????????????????????
         * ????????? dev-server ?????????????????? build time ???????????????????????????
         */
        const routerBaseConfig = typeof routerBase === 'string'
          ? routerBase
          : routerBase.map((o) => o.toString());
        this.routerBaseConfigs[appName] = routerBaseConfig;
        this.hookLifeCycle = new HookLifeCycle(
          this.addServerPlugin(hookConfig),
          new HookLogger(log),
        );
        log(`server hooks for app-${appName} installed`);
      } else {
        log('no server hooks found');
      }
    } catch (e) {
      error('loadServerHooks fail', e);
      throw e;
    }
  }

  private addServerPlugin(appHookConfig: ViseHooks): ViseHooks {
    const bindedHooks = Object.keys(this.hooks).reduce((prev, hookName) => ({
      ...prev,
      [hookName]: this.hooks[hookName as HookNames]!.bind(this),
    }), {});
    return {
      ...appHookConfig,
      plugins: [...appHookConfig.plugins ?? [], {
        name: 'vise:dev-server',
        hooks: bindedHooks,
      }],
    };
  }

  private setupExpress() {
    const viteServer = this.viteServer!;

    // use vite's connect instance as middleware
    this.express.use(viteServer.middlewares);

    this.express.use('*', (req, res) => {
      if (!this.hookLifeCycle) {
        ViseDevServer.sendResponse(res, {
          code: 500,
          headers: {},
          body: 'Fail to init HookLifeCycle',
        });
        return;
      }
      const { projectName, routerBase } = matchAppForUrl(this.routerBaseConfigs, req.originalUrl);
      if (!projectName) {
        ViseDevServer.sendResponse(res, {
          code: 404,
          headers: {},
          body: 'Not Found',
        });
        return;
      }

      const handleWithHookLifeCycle = async () => {
        try {
          const response = await this.hookLifeCycle!.start({
            url: req.originalUrl,
            headers: req.headers,
            body: req.body,
          }, {
            routerBase,
          });
          ViseDevServer.sendResponse(res, response);
        } catch (e) {
          const isError = (x: any): x is Error => typeof x.stack === 'string';
          const msg = isError(e) ? e.stack : e;

          if (isError(e)) {
            viteServer.ssrFixStacktrace(e);
          }
          error('unknown error', isError(e) ? e : msg);
          ViseDevServer.sendResponse(res, {
            code: 500,
            headers: {},
            body: String(msg),
          });
        }
      };

      handleWithHookLifeCycle();
    });
  }

  private async initViteServer() {
    const viteDevConfig = await getViteDevConfig(this.appRoot);
    const config = mergePartial(viteDevConfig, {
      logLevel: isTest ? 'error' : 'info',
    });

    const viteServer = await viteCreateServer(config);
    this.viteServer = viteServer;

    return viteServer;
  }

  private resolve(subPath: string): string {
    return path.resolve(this.appVisePath, subPath);
  }
}

export default function createServer(projectScaffold: SupportedScaffold, port: number) {
  const server = new ViseDevServer(getAppRoot(), projectScaffold, port);
  server.init();
  return server;
}
