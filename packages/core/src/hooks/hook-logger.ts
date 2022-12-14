import type { JSONValue } from '..';
import type {
  HookNames,
  FindCacheResult,
  HookCallback,
  RenderResult,
  RenderContext,
} from './hook-manager';
import { log } from '../node/utils/log';

type HookLogProcessor = (interception: JSONValue, fullLog?: boolean) => string;
type UnPromise<T> = T extends Promise<infer U> ? U : T;
type HookReturnType = {
  [K in HookNames]: UnPromise<ReturnType<HookCallback[K]>>;
};

function simplifyHeaders(context: RenderContext) {
  const { request } = context;
  return {
    ...context,
    request: {
      ...request,
      headers: Object.keys(request.headers).length > 5 ? '[Object]' : request.headers,
    },
  };
}

function shorterText(txt: string) {
  return txt.length > 100 ? `${txt.substring(0, 100)}...` : txt;
}

export default class HookLogger {
  public static mapHookLogProcessor: Partial<Record<HookNames, HookLogProcessor>> = {
    receiveRequest(interception, fullLog) {
      const data = interception as RenderResult;
      return JSON.stringify(fullLog ? data : {
        renderBy: data!.renderBy,
        meta: data!.context.meta,
        extra: data!.context.extra,
      });
    },
    requestResolved(interception, fullLog) {
      const { resolved } = interception as HookReturnType['requestResolved'];
      const { meta } = resolved;
      return JSON.stringify(fullLog ? resolved : {
        ...simplifyHeaders(resolved),
        meta: {
          ...meta,
          initState: meta.initState ? shorterText(JSON.stringify(meta.initState)) : null,
        },
      });
    },
    beforeUseCache(interception, fullLog) {
      const data = interception as HookReturnType['beforeUseCache'];
      if (fullLog) {
        return JSON.stringify(data);
      }
      return JSON.stringify(data ? {
        ...data,
        context: simplifyHeaders(data.context),
      } : data);
    },
    findCache(interception, fullLog) {
      const data = interception as FindCacheResult;
      return JSON.stringify(fullLog ? data : {
        renderBy: data.renderBy,
        content: shorterText(data.content),
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
        txt = shorterText(data.context.meta.app!);
      }
      return JSON.stringify({
        renderBy: data.renderBy,
        result: txt,
      });
    },
    beforeRender(interception, fullLog) {
      const data = interception as HookReturnType['beforeRender'];
      if (fullLog) {
        return JSON.stringify(data);
      }
      return JSON.stringify(simplifyHeaders(data));
    },
    afterRender(interception, fullLog) {
      const data = interception as HookReturnType['afterRender'];
      if (fullLog) {
        return JSON.stringify(data);
      }
      const simpleContext = simplifyHeaders(data.context);
      const tmp = {
        renderBy: data.renderBy,
        context: {
          ...simpleContext,
          meta: {
            ...simpleContext.meta,
            template: shorterText(simpleContext.meta.template ?? ''),
            preloadLinks: shorterText(simpleContext.meta.preloadLinks ?? ''),
            app: shorterText(simpleContext.meta.app ?? ''),
          },
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
    doLog: (txt: string) => void = log,
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
