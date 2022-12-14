import type { Serializable } from 'child_process';
import type {
  RenderContext,
  SsrBundleResult,
  RenderResult,
  RenderError,
} from 'vise-ssr';
import {
  mergeConfig,
} from 'vise-ssr';
import { log } from 'src/utils/logger';
import { getRenderProcessFilePath } from 'src/utils/path';
import ERROR_CODE from 'src/ssr-server/constants';
import RenderProcessScheduler from './render-process-scheduler';
import type { ResponseMessageOrError } from './render-process-scheduler';

const RENDER_NAME = 'vise:express-server';

export type MessageCategory = 'render';

export type RequestMessage = {
  app: string,
  bundlePath: string,
  type: MessageCategory,
  uid: number,
  renderContext: RenderContext,
};

export type ResponseMessage = {
  app: string,
  type: MessageCategory,
  uid: number,
  data: SsrBundleResult | string,
};

type MessageQueueItem = [RequestMessage, (obj: ResponseMessage) => void];

function isRenderError(result: SsrBundleResult): result is RenderError {
  return 'code' in result;
}

export default class SSRRenderService {
  private uid = 0;

  private renderProcessScheduler: RenderProcessScheduler;

  private waitingSendQueue: MessageQueueItem[] = [];

  private waitingResponseQueue: MessageQueueItem[] = [];

  constructor(private bundleBase: string, private apps: string[] = []) {
    this.renderProcessScheduler = new RenderProcessScheduler(
      getRenderProcessFilePath(),
      this.onMessage.bind(this),
    );
    this.renderProcessScheduler.fork();
  }

  public async render(app: string, renderContext: RenderContext): Promise<RenderResult> {
    const { request } = renderContext;
    if (this.apps.indexOf(app) === -1) {
      throw `unsupported app: ${app}`;
    }

    log(`starting render for ${request.url}`);
    this.uid += 1;

    const { uid } = this;
    const msg: RequestMessage = {
      app,
      type: 'render',
      bundlePath: this.bundleBase,
      uid,
      renderContext,
    };

    const result = new Promise((resolve) => {
      const fail = (error: RenderError) => resolve({
        type: 'error',
        renderBy: RENDER_NAME,
        context: renderContext,
        error,
      });
      this.registerNewMessage(msg, (resMsg: ResponseMessage) => {
        if (typeof resMsg.data === 'string') {
          fail({
            code: ERROR_CODE.serverError,
            message: resMsg.data,
          });
          return;
        }
        if (isRenderError(resMsg.data)) {
          fail(resMsg.data);
          return;
        }

        const { extra, html, meta } = resMsg.data;
        resolve({
          type: 'render',
          renderBy: RENDER_NAME,
          context: mergeConfig(renderContext, {
            meta,
            extra,
          }),
          html,
        });
      });
    }) as Promise<RenderResult>;

    this.trySendMessage();
    return result;
  }

  private registerNewMessage(msg: RequestMessage, callback: (result: ResponseMessage) => void) {
    this.waitingSendQueue.push([msg, callback]);
  }

  private canSendMessage() {
    return this.waitingSendQueue.length > 0
      && this.renderProcessScheduler.canSendMessage();
  }

  private trySendMessage() {
    if (!this.renderProcessScheduler.isReady()) {
      this.renderProcessScheduler.fork();
    }
    if (this.canSendMessage()) {
      const oldestMsg = this.waitingSendQueue.shift()!;
      this.sendMessage(oldestMsg);
    }
  }

  private sendMessage(msgItem: MessageQueueItem) {
    this.waitingResponseQueue.push(msgItem);
    this.renderProcessScheduler.send(msgItem[0]);
    log(`send render msg for ${msgItem[0].renderContext.request.url}`);
  }

  private onMessage(message: ResponseMessageOrError<Serializable>) {
    const msg = message as ResponseMessageOrError<ResponseMessage>;
    let responseMessage: ResponseMessage;
    if ('error' in msg) {
      const { message: req, error } = msg;
      responseMessage = {
        uid: req.uid,
        app: req.app,
        type: req.type,
        data: error,
      };
    } else {
      responseMessage = msg;
    }
    const queuedMsgItem = this.takeFromWaitingResponseQueue(responseMessage.uid);

    if (queuedMsgItem) {
      const [requestMessage, callback] = queuedMsgItem;
      callback(responseMessage);
      if (requestMessage.type === 'render') {
        log(`render process ok for url: ${requestMessage.renderContext.request.url}`);
      }
    } else {
      // 临时 log 用，不关注类型
      let data: any;
      if (typeof responseMessage.data === 'string') {
        data = responseMessage.data;
      } else if (isRenderError(responseMessage.data)) {
        data = responseMessage.data;
      } else {
        data = {
          ...responseMessage.data,
          html: responseMessage.data.html?.substring(0, 20),
        };
      }
      log(`error: fail to find queued msg for: ${JSON.stringify({
        ...responseMessage,
        data,
      })}`);
    }

    this.trySendMessage();
  }

  private takeFromWaitingResponseQueue(uid: number): MessageQueueItem | void {
    const index = this.waitingResponseQueue
      .findIndex((item) => item[0].uid === uid);
    if (index > -1) {
      // after splice the message in no longer in the queue
      return this.waitingResponseQueue.splice(index, 1)[0];
    }
    return undefined;
  }
}
