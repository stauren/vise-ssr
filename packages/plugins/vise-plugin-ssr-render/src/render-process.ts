/*
 * @Description: 用于服务端渲染的子进程
 * @usage:
 * @FilePath: /vise/packages/plugins/vise-plugin-ssr-render/src/render-process.ts
 */
import { RequestMessage } from './subprocess-render';
import type { EntryServerModule, ResponseMessage } from '../types/ssr-render';
class BundleRender {
  static entryBundles: Record<string, EntryServerModule> = {};

  static async listen() {
    process.on('message', (msg: RequestMessage) => {
      this.receiveMessage(msg);
    });
  }

  static async receiveMessage(msg: RequestMessage) {
    const { type, entryServerPaths } = msg;
    if (type === 'InitializeMessage') {
      // 动态导入entryServer模块
      for (const appName of Object.keys(entryServerPaths)) {
        this.entryBundles[appName] = await import(entryServerPaths[appName]);
      }
      return;
    }

    const { data: renderContext, uid } = msg;
    const { extra: { projectName } } = renderContext;
    // 当初始化导入失败时,在render时兜底再次导入
    if (!this.entryBundles[projectName as string]) {
      this.entryBundles[projectName as string] = await import(entryServerPaths[projectName as string]);
    }

    const { render } = this.entryBundles[projectName as string] ?? {};
    let responseMsg: ResponseMessage;
    if (!render) {
      responseMsg = {
        responseType: 'ERROR',
        uid,
        message: 'entryServerModule lack render',
      };
    }
    try {
      const renderRes = await render(renderContext);
      responseMsg = {
        responseType: 'SUCCESS',
        uid,
        data: renderRes,
      };
    } catch (error) {
      let message;
      let detail;
      if (error instanceof Error) {
        message = error.message;
        detail = { stack: error.stack };
      } else {
        message = String(error);
      }
      responseMsg = {
        responseType: 'ERROR',
        uid,
        message,
        ...detail ? { detail } : {},
      };
    }
    process.send!({ ...responseMsg });
  }
}
BundleRender.listen();
