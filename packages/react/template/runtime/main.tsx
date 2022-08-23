import type { Store } from 'redux';
import { Provider } from 'react-redux';
import React from 'react';
import App from '@/app';
import type { ContextValue } from '@/hooks/ssr-context.ts';
import { SSRContext } from '@/hooks/ssr-context.ts';
import RouterView from './router.tsx';

type AppCreatorParams = {
  store: Store,
  Router: JSX.Element,
  initUrl?: string,
  ssrContext?: ContextValue
}
// <!--START_ROUTE_BASE
const ROUTE_BASE = '/';
// END_ROUTE_BASE-->
export function createApp({
  store,
  initUrl,
  ssrContext,
  Router,
}: AppCreatorParams) {
  let csrRouterBase = '/';
  if (!ssrContext) {
    // client端 ROUTE_BASE 为 string 时，即为插入的ROUTE_BASE
    if (typeof ROUTE_BASE === 'string') {
      csrRouterBase = ROUTE_BASE;
    } else {
      // 此时根据 window.location.pathname 进行动态匹配
      ROUTE_BASE.some((regStr) => {
        if (regStr.startsWith('/')) {
          regStr = regStr.substr(1);
        }
        if (regStr.endsWith('/')) {
          regStr = regStr.substr(0, regStr.length - 1);
        }
        const regRule = new RegExp(regStr);

        const [regRes] = window.location.pathname.match(regRule) ?? [];
        if (regRes) {
          csrRouterBase = regRes;
          return true;
        }
        return false
      });
    }
  }

  const appWithRouter = ssrContext ?
    // HookLifeCycle 不向 render 中传递 base 前部分，base 固定为 '/'
    (<Router location={initUrl} basename="/">
      <SSRContext.Provider value={ssrContext}>
        <App RouterView={RouterView} />
      </SSRContext.Provider>
    </Router>) :
    (<Router basename={csrRouterBase}>
      <App RouterView={RouterView} />
    </Router>);

  return (
    <React.StrictMode>
      <Provider store={store}>
        { appWithRouter }
      </Provider>
    </React.StrictMode>
  );
}

