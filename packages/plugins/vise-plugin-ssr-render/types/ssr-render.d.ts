import { RenderContext, SsrBundleResult } from 'vise-ssr';

export type Logger = {
  info: (...rest: string[]) => void,
  warn: (...rest: string[]) => void,
  error: (...rest: unknown[]) => void,
};

export type RenderMessage = {
  type: 'RenderMessage',
  uid: number,
  data: RenderContext,
  entryServerPaths: Record<string, string>,
};
export type InitializeMessage = {
  type: 'InitializeMessage',
  entryServerPaths: Record<string, string>
};
// 发送消息的类型
export type RequestMessage = RenderMessage | InitializeMessage;

// 接收消息的类型
export type ResponseMessage = {
  uid: number
} & ({
  responseType: 'SUCCESS',
  data: SsrBundleResult
} | {
  responseType: 'ERROR' | 'TIMEOUT',
  message: string,
  detail?: { stack: unknown }
});

// 队列中 存储的待处理项，分别为 携带的信息、回调函数
export type MessageQueueItem = [RenderMessage, (obj: ResponseMessage) => void];

export type SSRrenderPlugin = {
  logger?: Logger,
  renderBySubprocess: boolean,
  entryServerPaths: Record<string, string>,
};

export type EntryServerModule = NodeModule & {
  render: (renderContext: RenderContext) => Promise<SsrBundleResult>
};
