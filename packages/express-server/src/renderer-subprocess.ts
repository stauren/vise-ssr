import type { ViseRenderBundle } from 'vise-ssr';

import type { RequestMessage, ResponseMessage } from '@/ssr-server/render-service';
import { loadRenderBundle } from '@/utils/load-bundles';
import doLog from '@/utils/logger';
import type { EncodedMessage } from '@/ssr-server/render-process-scheduler';
import RenderProcessScheduler from '@/ssr-server/render-process-scheduler';

function log(txt: string) {
  doLog(`[rp] ${txt}`);
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
    log(`receive msg for: ${url}`);
    if (innerMsg.type === 'render') {
      log(`start render for: ${url}`);
      try {
        const bundle = await this.getBundle(app, bundlePath);
        const ssrResult = await bundle.render(renderContext);
        this.sendMessage(msg, { ...ssrResult });
      } catch (e) {
        const errText = e instanceof Error ? e.message : String(e);
        log(`[error] render fail: ${errText}`);
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
    log(`child send msg for: ${innerMsg.type}`);
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
log('render process forked.');
