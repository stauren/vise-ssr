import type { JSONValue } from '../';
import type {
  HookNames,
  FindCacheResult,
  HookCallback,
  RenderResult,
} from './hook-manager';

type HookLogProcessor = (interception: JSONValue, fullLog?: boolean) => string;
type UnPromise<T> = T extends Promise<infer U> ? U : T;
type HookReturnType = {
  [K in HookNames]: UnPromise<ReturnType<HookCallback[K]>>;
};

export default class HookLogger {
  public static mapHookLogProcessor: Partial<Record<HookNames, HookLogProcessor>> = {
    receiveRequest(interception, fullLog) {
      const data = interception as RenderResult;
      return JSON.stringify(fullLog ? data : {
        renderBy: data!.renderBy, extra: data!.context.extra,
      });
    },
    requestResolved(interception, fullLog) {
      const { resolved } = interception as HookReturnType['requestResolved'];
      const { extra } = resolved;
      return JSON.stringify(fullLog ? resolved : {
        ...resolved,
        extra: {
          ...extra,
          initState: extra.initState ? JSON.stringify(extra.initState).substring(0, 100) : null,
        },
      });
    },
    findCache(interception, fullLog) {
      const data = interception as FindCacheResult;
      return JSON.stringify(fullLog ? data : {
        renderBy: data.renderBy,
        content: `${data.content.substring(0, 100)}...`,
      });
    },
    render(interception, fullLog) {
      const data = interception as HookReturnType['render'];
      let txt;
      if (data.type === 'error') {
        txt = `render failed with: ${JSON.stringify(data.error)}`;
      } else if (data.type === 'render') {
        if (fullLog) {
          return JSON.stringify(data);
        }
        txt = `${data.ssrResult.app.substring(0, 100)}...`;
      }
      return JSON.stringify({
        renderBy: data.renderBy,
        result: txt,
      });
    },
    afterRender(interception, fullLog) {
      const data = interception as HookReturnType['afterRender'];
      if (fullLog) {
        return JSON.stringify(data);
      }
      const tmp = {
        renderBy: data.renderBy,
        context: {
          request: { url: data.context.request.url },
          extra: data.context.extra,
        },
      } as any; // 临时 log 用数据，类型无所谓
      if (data.type === 'error') {
        tmp.error = data.error;
      } else {
        tmp.type = data.type;
      }
      return JSON.stringify(tmp);
    },
    beforeResponse(interception, fullLog) {
      const data = interception as HookReturnType['beforeResponse'];
      return data ? JSON.stringify(fullLog ? data : {
        ...data,
        body: data.body ? `${data.body.substring(0, 100)}...` : '',
      }) : '';
    },
  };

  private doLog: (txt: string) => void;
  private fullLog: boolean;

  constructor(
    doLog: (txt: string) => void = console.log,
    fullLog = false,
  ) {
    this.doLog = doLog;
    this.fullLog = fullLog;
  }
  public log(hookName: HookNames, interception: JSONValue): void {
    if (hookName === 'hitCache') {
      return;
    }
    const txt = HookLogger.mapHookLogProcessor[hookName]
      ? HookLogger.mapHookLogProcessor[hookName]!(interception, this.fullLog)
      : JSON.stringify(interception);

    if (txt !== '') {
      this.doLog(`[hook] "${hookName}" intercept with: ${txt}`);
    }
  }
}
