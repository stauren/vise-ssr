import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import React from 'react';
import { RenderContext } from 'vise-ssr';
import { StaticRouter } from 'react-router-dom/server.mjs'
import App from '@/app';
import type { ContextValue } from './ssr-context.ts';
import { SSRContext } from './ssr-context.ts';
import RouterView from './router.tsx';

type AppCreatorParams = {
  store: ReturnType<typeof configureStore>,
  Router: typeof StaticRouter | typeof StaticRouter,
  initUrl?: string,
  ssrContext?: ContextValue
}
// <!--START_ROUTE_BASE
const ROUTE_BASE = '/';
// END_ROUTE_BASE-->

function joinPath(base: string, subPath: string) {
  return `${base}${subPath.substring(1)}`;
}

function AppWithSSRContext({ ssrContext, Router, location, basename }: {
  ssrContext: ContextValue,
  Router: typeof StaticRouter,
  location: string,
  basename: string
}) {
  const [context, updateContext] = React.useState(ssrContext);
  const realUpdate = React.useCallback(function(newContext) {
    // assign SsrContext back to the server
    Object.assign(ssrContext, newContext);
    return updateContext(newContext);
  }, []);

  return (
    <Router location={location} basename={basename}>
      <SSRContext.Provider value={{ context, updateContext: realUpdate }}>
        <App RouterView={RouterView} />
      </SSRContext.Provider>
    </Router>
  );
}
export function createApp({
  store,
  initUrl,
  ssrContext,
  Router,
}: AppCreatorParams) {
  let routerBase = '/';
  // client端 ROUTE_BASE 为 string 时，即为插入的ROUTE_BASE
  if (typeof ROUTE_BASE === 'string') {
    routerBase = ROUTE_BASE;
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
        routerBase = regRes;
        return true;
      }
      return false
    });
  }

  const appWithRouter = ssrContext ?
    // HookLifeCycle 不向 render 中传递 base 前部分
    <AppWithSSRContext
      ssrContext={ssrContext}
      Router={Router}
      location={joinPath(routerBase, initUrl!)}
      basename={routerBase}
    /> :
    (<Router basename={routerBase}>
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

