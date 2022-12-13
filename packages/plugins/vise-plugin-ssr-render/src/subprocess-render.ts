import path from 'path';
import { fileURLToPath } from 'url';
import { fork, ChildProcess } from 'child_process';
import { RenderContext } from 'vise-ssr';
import { SSR_RENDER, PROCESS_TIME_OUT } from './constants';
import type {
  MessageQueueItem,
  Logger,
  RequestMessage,
  ResponseMessage,
  RenderMessage,
} from '../types/ssr-render';

const DIR_NAME = path.dirname(fileURLToPath(import.meta.url));

class SubProcessRender {
  uid = 0; // 唯一标识

  waiting = false; // 同一时间一个子进程只能处理一个 render，处理完后该状态变为 false

  subprocessRenderCount = 0; // 用于记录当前 子进程 渲染次数

  renderTimeoutCountInARow = 0; // 用于记录当前子进程 连续渲染超时的次数

  renderProcess: ChildProcess | undefined; // fork 的子进程

  waitingSendQueue: MessageQueueItem[] = []; // 等待发送的队列

  waitingResponseQueue: MessageQueueItem[] = []; // 等待 消息回收 处理的队列

  subProcessConfig = {
    maxSubprocessRenderCount: 600, // 子进程每渲染到该数值即回收
    maxWaitingTime: 1500, // timeout 时长
    maxFailCountInARow: 10, // 子进程连续超时的最大上限
  };

  logger: Logger | undefined;

  entryServerPaths: Record<string, string>;

  constructor(logger: Logger | undefined, entryServerPaths: Record<string, string>) {
    this.logger = logger;
    this.entryServerPaths = entryServerPaths;
    this.sendInitializeMessage();
  }

  /**
     * 进行 render 的入口，会先排队注册render msg
     * @param {string} url
     * @param { renderContext: RenderContext }
     * @returns {Promise<ResponseMessage>}
     * @memberOf SubProcessRender
     */
  public render(renderContext: RenderContext): Promise<ResponseMessage> {
    this.uid += 1;

    const { uid } = this;
    const msg: RenderMessage = {
      type: 'RenderMessage',
      uid,
      data: renderContext,
      entryServerPaths: this.entryServerPaths,
    };

    const result = new Promise<ResponseMessage>((resolve) => {
      this.registerRenderMessage(
        msg,
        (resMsg: ResponseMessage) => {
          resolve({
            ...resMsg,
          });
        },
      );
      setTimeout(() => {
        resolve({
          uid,
          responseType: 'TIMEOUT',
          message: PROCESS_TIME_OUT,
        });
      }, this.subProcessConfig.maxWaitingTime);
    });
    result.then((val) => {
      // 只有当子进程渲染超时时才进行后续动作
      if (val.responseType !== 'TIMEOUT') return;
      this.deleteSpecificQueenItem(this.waitingSendQueue, msg);
      const inWaitingResponseQueue = this.deleteSpecificQueenItem(this.waitingResponseQueue, msg);
      this.renderTimeoutCountInARow += 1;
      if (this.renderTimeoutCountInARow >= this.subProcessConfig.maxFailCountInARow) {
        // 超过子进程连续超时的最大上限,杀死子进程
        this.logger?.info(`[${SSR_RENDER}]: exceed maxFailCountInARow, kill render process`);
        this.killRenderProcess();
      }
      if (inWaitingResponseQueue) this.waiting = false;
      this.sendMessageIfIdle();
    });
    this.sendMessageIfIdle();
    return result;
  }

  /**
     * fork process
     * @returns
     * @memberOf SubProcessRender
     */
  public forkRenderProcess() {
    if (this.renderProcess) {
      if (this.waiting) {
        // 已有渲染子线程，且渲染中，返回
        return;
      }
      this.logger?.info(`[${SSR_RENDER}]: already have renderProcess,kill old and fork new`);
      this.killRenderProcess();
    }
    this.renderProcess = fork(path.resolve(DIR_NAME, './render-process.js'), [], {
      silent: false, // 注意该配置
    });

    if (this.renderProcess) {
      this.renderProcess.on('message', this.onMessage.bind(this));
      this.renderProcess.on('error', (error) => {
        this.logger?.error(`[${SSR_RENDER}]: `, error);
        // 子进程遇到异常进行kill动作，以便后续能重新fork
        this.killRenderProcess();
      });
      this.logger?.info(`[${SSR_RENDER}]: success to fork render process`);
    } else {
      this.logger?.error(`[${SSR_RENDER}]: failed to fork render process`);
    }
  }

  /**
     * kill process
     * @returns
     * @memberOf SubProcessRender
     */
  public killRenderProcess() {
    if (!this.renderProcess) return;
    if (this.renderProcess.killed) {
      this.resetRenderProcess();
      return;
    }
    if (!this.renderProcess.kill()) {
      this.logger?.error(`[${SSR_RENDER}]: fail to kill render process`);
    } else {
      this.logger?.info(`[${SSR_RENDER}]: render process killed.`);
    }
    this.resetRenderProcess();
  }

  private resetRenderProcess() {
    this.renderProcess = undefined;
    this.subprocessRenderCount = 0;
    this.renderTimeoutCountInARow = 0;
  }

  /**
     * 接收 子进程 发来的消息
     * @param {ResponseMessage} msg
     * @memberOf RenderService
     */
  private onMessage(msg: ResponseMessage) {
    this.subprocessRenderCount += 1;
    this.renderTimeoutCountInARow = 0;
    this.waiting = false;

    const index = this.waitingResponseQueue
      .findIndex((item) => item[0].uid === msg.uid);

    if (index > -1) {
      const queuedItem = this.waitingResponseQueue.splice(index, 1)[0];
      const [renderMsg, callback] = queuedItem;
      callback(msg);
      this.logger?.info(`[${SSR_RENDER}]: render success ${renderMsg.data.request.url}`);
    }

    if (this.subprocessRenderCount >= this.subProcessConfig.maxSubprocessRenderCount) {
      // 超过最大渲染次数，主动释放内存
      this.logger?.info(`[${SSR_RENDER}]: exceed subprocessRenderCount, release heap`);
      this.killRenderProcess();
    }

    this.sendMessageIfIdle();
  }

  /**
     * 对于 串行消息 进行可否发送消息的判断
     * 若不处于waiting状态时，从waitingSendQueue头部取消息 向 子进程 发送消息
     * @memberOf RenderService
     */
  private sendMessageIfIdle() {
    if (!this.renderProcess) {
      this.forkRenderProcess();
    }
    if (!this.waiting && this.renderProcess) {
      if (this.waitingSendQueue.length > 0) {
        const oldestMsg = this.waitingSendQueue.shift()!;

        // only one render is allowed at the same time
        this.waiting = true;

        this.sendMessage(oldestMsg);
      }
    }
  }

  /**
     * 实际 向 子进程 发送消息的方法
     * @param {MessageQueueItem} msgItem
     * @memberOf RenderService
     */
  private sendMessage(msgItem: MessageQueueItem) {
    if (!this.renderProcess) {
      this.forkRenderProcess();
    }

    if (this.renderProcess) { // fork may fail, will Logger.error in forkRenderProcess
      this.waitingResponseQueue.push(msgItem);
      this.renderProcess.send(msgItem[0]);
    }
  }

  /**
     * 只有 render 类型的 msg 需要经过 registerRenderMessage
     * 因为 render 开销较大，一个子进程 同一时间只能处理 一个 render，需要排队
     * @param {RenderMessage} msg
     * @param {(result: ResponseMessage) => void} callback
     * @memberOf SubProcessRender
     */
  private registerRenderMessage(
    msg: RenderMessage,
    callback: (result: ResponseMessage) => void,
  ) {
    this.waitingSendQueue.push([msg, callback]);
  }

  /**
     * 处理完后对队列中数据进行回收
     * @param {MessageQueueItem[]} queen
     * @param {(RenderMessage | ResponseMessage)} msg
     * @returns
     * @memberOf SubProcessRender
     */
  private deleteSpecificQueenItem(queen: MessageQueueItem[], msg: RenderMessage | ResponseMessage) {
    const index = queen
      .findIndex((item) => item[0].uid === msg.uid);
    if (index > -1) {
      queen.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * 在服务启动时即fork子进程,并发送一条消息,动态导入entryServer模块
   */
  private sendInitializeMessage() {
    if (!this.renderProcess) {
      this.forkRenderProcess();
    }

    if (this.renderProcess) {
      this.renderProcess.send({
        type: 'InitializeMessage',
        entryServerPaths: this.entryServerPaths,
      });
    }
  }
}

export default SubProcessRender;
export type {
  RequestMessage,
  ResponseMessage,
  Logger,
};
