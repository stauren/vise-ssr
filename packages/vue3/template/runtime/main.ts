import { createSSRApp, createApp as createCSRApp } from 'vue';
import { ViseRouter } from 'vise-ssr';
import { createRouter } from './router';
import App from '@/app.vue';
import { createStore, key } from '@/store';
import { IS_SSR } from './env';

// SSR requires a fresh app instance per request, therefore we export a function
// that creates a fresh app instance. If using Vuex, we'd also be creating a
// fresh store here.
export function createApp(routerBase = '/') {
  const app = IS_SSR || window.Vise.initState ? createSSRApp(App) : createCSRApp(App);
  const store = createStore();
  // <!--START_ROUTE_BASE
  const ROUTE_BASE = null;
  // END_ROUTE_BASE-->

  // HookLifeCycle 不向 render 传递 routerBase 之前部分，固定为 '/'
  let finalBase: string = '/';
  if (!IS_SSR) {
    // client端 ROUTE_BASE 为 string 时，即为插入的ROUTE_BASE
    if (typeof ROUTE_BASE === 'string') {
      finalBase = ROUTE_BASE
    } else {
      // 此时根据 window.location.pathname 进行动态匹配
      // 由于 vise 依赖 zx => fileURLToPath, 在__vite-browser-external 不存在，因此暂时没有用 vise-ssr export 的 matchAppForUrl 来处理
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
          finalBase = regRes;
          return true;
        }
        return false
      });
    }
  }
  const router: ViseRouter = createRouter(store, finalBase);
  app.use(store, key);
  app.use(router);

  // 对外提供一个项目应用级别的生命钩子，便于开发者注册插件之类的操作
  App.appCreated?.(app);
  return { app, router, store };
}
