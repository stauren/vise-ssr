import path from 'path';
import express, { Express, Response } from 'express';
import vite from 'vite';
import type { ViteDevServer } from 'vite';
import type { SupportedScaffold } from '@vise-ssr/shared';
import { mergeConfig, ScaffoldToPackage } from '@vise-ssr/shared';
import type {
  SsrBundleRender,
} from '../';
import { getAppRoot, getAppVisePath } from './utils/path';
import { prepareViseDir } from './init-app';
import { getViteDevConfig } from './config';
import { refillRenderResult } from './utils/strings';
import matchAppForUrl from './utils/match-app';
import type {
  HTTPResponse,
  ViseHooks,
  HookCallback,
  HookRouterBase,
  HookNames,
  SuccessRenderResult,
} from '../hooks/';
import {
  HookLifeCycle,
  HookLogger,
} from '../hooks/';
import dynamicImportTs from './utils/dynamic-import-ts';
import getAppViseConfig from './app-config';

const isTest = process.env.NODE_ENV === 'test' || !!process.env.VITE_TEST_BUILD;
const CODE_SERVER_ERROR = 500;
const DEV_RENDERER = 'vise:dev-server';

const SERVER_HOOK_CONFIG = 'src/server-hooks.ts';

class ViseDevServer {
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
      const { extra, ...newSsrResult } = ssrResult;
      const result: SuccessRenderResult = {
        renderBy: DEV_RENDERER,
        type: 'render',
        context: mergeConfig(renderContext, {
          extra,
        }),
        ssrResult: {
          ...newSsrResult,
          template,
        },
      };
      return refillRenderResult(result);
    },
    async beforeResponse(this: ViseDevServer, renderResult) {
      this.log(`page render: ${renderResult.renderBy}`);
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
    this.initScaffoldFiles();
    this.port = port;
    this.express = express();
    this.initHooks();
  }

  public start() {
    this.express.listen(this.port, () => {
      this.log(`ssr server started: http://localhost:${this.port}`);
    });
  }

  public async createServer() {
    await prepareViseDir(this.appVisePath);
    this.setupExpress();

    return {
      app: this.express,
      vite: this.viteServer,
    };
  }

  private async initScaffoldFiles() {
    this.mapScaffoldFiles = (await import(ScaffoldToPackage[this.scaffold])).SCAFFOLD_FILES;
  }

  private async loadAppHookConfig() {
    // 加载 app 服务端 hooks 文件
    const hookConfigFile = path.resolve(this.appRoot, SERVER_HOOK_CONFIG);
    return await dynamicImportTs<ViseHooks>(hookConfigFile);
  }

  private async initHooks() {
    try {
      await this.initViteServer();
      const hookConfig = await this.loadAppHookConfig();
      if (hookConfig) {
        const { routerBase } = await getAppViseConfig();
        const { appName } = hookConfig;

        /**
         * 以下这个转换，本来是在 scaffold-generator 中，在 rollup 的
         * load 生命周期中，在 build time 从 vise.config.ts 中读取配置后
         * 生成到 runtime 的 server-hooks.ts 中的。但这要求在 dev 时读取
         * server-hooks.ts 文件也走 vite 流程，即使用 ssrLoadModule 来加载。
         * 但实际使用中发现相关转换有 bug，会在替换 export 语句时将临近的
         * import 语句误删除。
         * 基于以上原因，这里不走 vite 流程，直接从 2 个配置文件读取配置
         * 考虑到 dev-server 运行时肯定有 build time 依赖，应该没啥问题
         */
        const routerBaseConfig = typeof routerBase === 'string'
          ? routerBase
          : routerBase.map(o => o.toString());
        this.routerBaseConfigs[appName] = routerBaseConfig;
        this.hookLifeCycle = new HookLifeCycle(
          this.addServerPlugin(hookConfig),
          new HookLogger(this.log.bind(this)),
        );
        this.log(`server hooks for app-${appName} installed`);
      } else {
        this.log('no server hooks found');
      }
    } catch (e) {
      console.error('[Vise] loadServerHooks fail', e);
      throw e;
    }
    this.createServer();
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
        this.sendResponse(res, {
          code: 500,
          headers: {},
          body: 'Fail to init HookLifeCycle',
        });
        return;
      }
      const { projectName, routerBase } = matchAppForUrl(this.routerBaseConfigs, req.originalUrl);
      if (!projectName) {
        this.sendResponse(res, {
          code: 404,
          headers: {},
          body: 'Not Found',
        });
        return;
      };

      const handleWithHookLifeCycle = async () => {
        try {
          const response = await this.hookLifeCycle!.start({
            url: req.originalUrl,
            headers: req.headers,
            body: req.body,
          }, {
            routerBase,
          });
          this.sendResponse(res, response);
        } catch (e) {
          const isError = (x: any): x is Error => typeof x.stack === 'string';
          const msg = isError(e) ? e.stack : e;

          if (isError(e)) {
            viteServer.ssrFixStacktrace(e);
          }
          console.log(msg);
          this.sendResponse(res, {
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
    const config = mergeConfig(viteDevConfig, {
      logLevel: isTest ? 'error' : 'info',
    });

    const viteServer = await vite.createServer(config);
    this.viteServer = viteServer;

    return viteServer;
  }

  private log(txt: string) {
    console.log(`[Vise] ${txt}`);
  }

  private async sendResponse(res: Response, data: HTTPResponse) {
    res.set(data.headers)
      .status(data.code)
      .end(data.body ?? '');
  }

  private resolve(subPath: string): string {
    return path.resolve(this.appVisePath, subPath);
  }
}

export default function createServer(projectScaffold: SupportedScaffold, port: number) {
  const root = getAppRoot();
  return new ViseDevServer(root, projectScaffold, port);
}