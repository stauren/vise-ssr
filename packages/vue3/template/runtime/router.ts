import { useSSRContext } from 'vue';
import {
  createMemoryHistory,
  createRouter as _createRouter,
  createWebHistory,
  RouteRecordRaw,
} from 'vue-router';

import { ViseRouter } from '@vise-ssr/vue3';
import { MyStore } from '@/store/';
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

    next();
  });
  return router;
}
