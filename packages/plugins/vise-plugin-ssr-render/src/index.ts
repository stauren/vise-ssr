import { RenderContext, RenderResultCategory, mergeConfig, SsrBundleSuccess } from 'vise-ssr';
import SubProcessRender from './subprocess-render';
import { SSR_RENDER } from './constants';
import type { SSRrenderPlugin, EntryServerModule } from '../types/ssr-render';

const ssrRenderPlugin = async (options: SSRrenderPlugin) => {
  const {
    renderBySubprocess,
    logger,
    entryServerPaths,
  } = options;
  let subProcessRender: SubProcessRender| undefined;
  const entryServerModules: Record<string, EntryServerModule> = {};
  if (renderBySubprocess) {
    // 采用子进程进行渲染的机制
    subProcessRender = new SubProcessRender(logger, entryServerPaths);
  } else {
    for (const appName of Object.keys(entryServerPaths)) {
      entryServerModules[appName] = await import(entryServerPaths[appName]);
    }
  }
  // 处理通过render子进程进行服务端渲染的逻辑
  async function handleSubRender(renderContext: RenderContext) {
    const { projectName } = renderContext.extra;
    const subProcessRenderResult = await (subProcessRender as SubProcessRender).render(renderContext);
    if (subProcessRenderResult.responseType === 'SUCCESS') {
      const { extra, ...ssrResult } = subProcessRenderResult.data as SsrBundleSuccess;
      return {
        type: RenderResultCategory.render,
        context: mergeConfig(renderContext, {
          extra,
        }),
        ssrResult,
      };
    }
    const { message, detail = '' } = subProcessRenderResult;
    logger?.error(`[${SSR_RENDER}]: render ${projectName as string} error`, message, detail);
    return {
      type: RenderResultCategory.error,
      error: {
        code: 500,
        message,
        detail,
      },
      context: renderContext,
    };
  }
  // 处理直接通过work进程进行服务端渲染的逻辑
  async function handleWorkRender(renderContext: RenderContext) {
    const { projectName } = renderContext.extra;
    try {
      const renderRes = await entryServerModules[projectName as string].render(renderContext);
      const { extra, ...ssrResult } = renderRes as SsrBundleSuccess;
      return {
        type: RenderResultCategory.render,
        context: mergeConfig(renderContext, {
          extra,
        }),
        ssrResult,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const detail = err instanceof Error ? { stack: err.stack } : undefined;
      logger?.error(`[${SSR_RENDER}]: workRender ${projectName as string} error`, message, detail);
      return {
        type: RenderResultCategory.error,
        error: {
          code: 500,
          message,
          detail,
        },
        context: renderContext,
      };
    }
  }
  async function render(renderContext: RenderContext) {
    const renderRes = renderBySubprocess && subProcessRender
      ? await handleSubRender(renderContext)
      : await handleWorkRender(renderContext);
    return renderRes;
  };
  return {
    viseRenderPlugin: {
      name: 'vise-plugin-ssr-render',
      hooks: {
        // @ts-ignore
        render,
      },
    },
    killAllSubprocess: subProcessRender ? subProcessRender?.killRenderProcess.bind(subProcessRender) : () => {},
  };
};

export default ssrRenderPlugin;
export type { SubProcessRender };
