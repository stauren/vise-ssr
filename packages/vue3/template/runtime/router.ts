import { useSSRContext } from 'vue';
import {
  createMemoryHistory,
  createRouter as _createRouter,
  createWebHistory,
  RouteRecordRaw,
} from 'vue-router';

import { ViseRouteComponent, ViseRouter } from '@vise-ssr/vue3';
import { MyStore } from '@/store/';
import { State } from '@/store/state';
import { IS_SSR, appPages, syncAppPages } from './env';

const allAppPages = {
  ...appPages,
  ...syncAppPages,
};
if (!IS_SSR) {
  console.log('[allAppPages]: ', allAppPages);
}

const REG_PAGE = /\/src\/pages\/([^/]+)\.vue$/;
const routes: Array<RouteRecordRaw> = Object.keys(allAppPages).reduce((routeArr, pagePath) => {
  const matches = pagePath.match(REG_PAGE);
  if (!matches) {
    return routeArr;
  }
  const name = `/${matches[1].toLowerCase()}`;
  const theAppPage = allAppPages[pagePath];
  const importedPage = typeof theAppPage === 'function'
    ? theAppPage
    : theAppPage?.default;
  const relativePath = name;
  const result: Array<RouteRecordRaw> = [
    ...routeArr,
    {
      path: relativePath,
      alias: `${relativePath}.html`,
      component: importedPage,
    },
  ];

  // 默认路由为 index 首页路由
  if (name === '/index') {
    result.push({
      path: '/',
      component: importedPage,
    });
  }

  return result;
}, [] as Array<RouteRecordRaw>);

// 不兼容 404 了
// if (importedIndexPage) {
//   routes.push({
//     path: '/:pathMatch(.*)*',
//     name: 'NotFound',
//     component: importedIndexPage,
//   });
// }

export function createRouter(store: MyStore, base = '/') {
  const router: ViseRouter = _createRouter({
    // use appropriate history implementation for server/client
    // import.meta.env.SSR is injected by Vite.
    history: IS_SSR ? createMemoryHistory(base) : createWebHistory(base),
    routes,
  });

  router.beforeResolve(async (to, from, next) => {
    if (to.matched.length === 0 || to.matched.find(item => item.name === 'NotFound')) {
      const { query = {}, hash = '' } = to;
      next({
        path: '/',
        query,
        hash,
      });
      return;
    }
    if (IS_SSR) {
      const firstMatch = to.matched[0];
      const matchedComponent = firstMatch?.components.default;
      const isViseComponent = (x: any):
        x is ViseRouteComponent<State> => typeof x?.fetch === 'function';
      if (isViseComponent(matchedComponent)) {
        try {
          const {
            headers,
          } = router.$ssrContext!;
          const result = await matchedComponent.fetch.call(null, {
            to,
            headers,
          });
          if (typeof result === 'function') {
            result(store);
          } else {
            console.error(`Fetch for ${to.fullPath} failed with: ${result}`);
          }
          next();
        } catch (e) {
          const originalSetup = 'setup' in matchedComponent ? matchedComponent.setup : (() => {});

          // 不关心具体参数类型，只是原样传递
          matchedComponent.setup = (...args: any[]) => {
            const ssrContext = useSSRContext();
            ssrContext!.noCache = true;

            // 防止内存泄露
            matchedComponent.setup = originalSetup;
            // 这里不关心类型，只是原样传递参数
            // eslint-disable-next-line prefer-spread
            return originalSetup.apply(null, args);
          };
          console.error(`Fetch for ${to.fullPath} failed with: ${e}`, e);
          next();
        }
        return;
      }
    }

    next();
  });
  return router;
}
