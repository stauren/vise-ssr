import { fork } from 'child_process';
import type { ChildProcess, Serializable } from 'child_process';
import type { RenderError } from 'vise-ssr';
import { log } from 'src/utils/logger';
import ERROR_CODE from 'src/ssr-server/constants';

export type ResponseMessageOrError<T> = T | {
  message: T,
  error: RenderError,
};

export type CallbackWithMsg<T> = (message: ResponseMessageOrError<T>) => void;

export type EncodedMessage = {
  uid: number,
  body: Serializable,
};

const MAX_ALLOW_SEND_MESSAGE = 2;
const MAX_SUBPROCESS_RENDER_COUNT = 100;
const RENDER_TIMEOUT = 3000;

export default class RenderProcessScheduler {
  public static encodeMessage(msg: Serializable, uid: number): EncodedMessage {
    return {
      uid,
      body: msg,
    };
  }

  private renderProcess: ChildProcess | undefined;

  private processFilePath: string;

  private renderCount = 0;

  private uid = 0;

  private queue: [number, NodeJS.Timeout][] = [];

  private notify: CallbackWithMsg<Serializable>;

  constructor(processFilePath: string, notify: CallbackWithMsg<Serializable>) {
    this.processFilePath = processFilePath;
    this.notify = notify;
  }

  public isReady(): boolean {
    return this.renderProcess !== undefined && !this.renderProcess.killed;
  }

  public canSendMessage(): boolean {
    return this.isReady()
      && this.renderCount < MAX_SUBPROCESS_RENDER_COUNT
      && this.queue.length < MAX_ALLOW_SEND_MESSAGE;
  }

  public fork() {
    if (this.renderProcess) {
      if (!this.kill()) {
        // 大概率是已有渲染子线程，且渲染中，返回
        return;
      }
    }

    this.renderProcess = fork(this.processFilePath, [], {
      silent: true,
      stdio: 'inherit',
    });

    if (this.renderProcess) {
      log('render process created.');
      this.renderProcess.on('message', this.onMessage.bind(this));
      this.renderProcess.on('error', (error) => {
        log(JSON.stringify(error));
        this.kill();
      });
    } else {
      log('error: failed to fork render process');
    }
  }

  public send(message: Serializable) {
    if (!this.renderProcess) {
      return;
    }
    this.renderCount += 1;
    this.uid += 1;

    const outgoingMsg = RenderProcessScheduler.encodeMessage(message, this.uid);
    this.addToQueueWithTimeout(outgoingMsg);
    this.renderProcess.send(outgoingMsg);
  }

  public kill(): boolean {
    if (this.queue.length > 0) {
      // 还有渲染消息未返回，不能 kill
      return false;
    }
    if (!this.renderProcess || this.renderProcess.killed) {
      this.renderProcess = undefined;
      this.renderCount = 0;
      return true;
    }
    if (!this.renderProcess.kill()) {
      log('fail to kill render process');
      return false;
    }
    this.renderProcess = undefined;
    this.renderCount = 0;
    log('render process killed.');
    return true;
  }

  private addToQueueWithTimeout(message: EncodedMessage) {
    const timeoutId = setTimeout(() => {
      if (this.removeFromQueue(message.uid)) {
        this.notify({
          message: message.body,
          error: {
            code: ERROR_CODE.timeout,
            message: 'render timeout',
          },
        });
      }
    }, RENDER_TIMEOUT);
    this.queue.push([message.uid, timeoutId]);
  }

  private removeFromQueue(uid: number): boolean {
    const index = this.queue.findIndex((item) => item[0] === uid);
    if (index > -1) {
      // after splice the message in no longer in the queue
      const [, timeoutId] = this.queue.splice(index, 1)[0];
      clearTimeout(timeoutId);
      return true;
    }
    return false;
  }

  private onMessage(responseMessage: EncodedMessage) {
    this.removeFromQueue(responseMessage.uid);
    this.notify(responseMessage.body);
    if (this.renderCount >= MAX_SUBPROCESS_RENDER_COUNT) {
      // 超过最大渲染次数，主动释放内存
      this.kill();
    }
  }
}
