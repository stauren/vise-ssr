import type { ViseRenderBundle } from 'vise-ssr';

import type { RequestMessage, ResponseMessage } from 'src/ssr-server/render-service';
import { loadRenderBundle } from 'src/utils/load-bundles';
import { log, error } from 'src/utils/logger';
import type { EncodedMessage } from 'src/ssr-server/render-process-scheduler';
import RenderProcessScheduler from 'src/ssr-server/render-process-scheduler';

function doLog(txt: string) {
  log(`[rp] ${txt}`);
}
function logError(txt: string, err: unknown) {
  error(`[rp] ${txt}`, err);
}

class VueBundleRender {
  private static bundles: Record<string, ViseRenderBundle> = {};

  public static listen() {
    process.on('message', (msg: EncodedMessage) => {
      this.receiveMessage(msg);
    });
  }

  private static async receiveMessage(msg: EncodedMessage) {
    const innerMsg = msg.body as RequestMessage;
    const { renderContext, app, bundlePath } = innerMsg;
    const { request: { url } } = renderContext;
    doLog(`receive msg for: ${url}`);
    if (innerMsg.type === 'render') {
      doLog(`start render for: ${url}`);
      try {
        const bundle = await this.getBundle(app, bundlePath);
        const ssrResult = await bundle.render(renderContext);
        this.sendMessage(msg, { ...ssrResult });
      } catch (e) {
        const errText = e instanceof Error ? e.message : String(e);
        logError(`render fail: ${errText}`, e);
        this.sendMessage(msg, errText);
      }
    }
  }

  private static async getBundle(app: string, serverBundlePath: string): Promise<ViseRenderBundle> {
    if (!this.bundles[app]) {
      const bundle = await loadRenderBundle(serverBundlePath, app) as ViseRenderBundle;
      this.bundles[app] = bundle;
    }
    return this.bundles[app];
  }

  private static sendMessage(incomingMessage: EncodedMessage, data: ResponseMessage['data']) {
    const innerMsg = incomingMessage.body as RequestMessage;
    doLog(`child send msg for: ${innerMsg.type}`);
    const resMessage: ResponseMessage = {
      app: innerMsg.app,
      type: innerMsg.type,
      uid: innerMsg.uid,
      data,
    };

    process.send!(RenderProcessScheduler.encodeMessage(resMessage, incomingMessage.uid));
  }
}

VueBundleRender.listen();
doLog('render process forked.');
