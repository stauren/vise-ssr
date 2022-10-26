import * as React from 'react';
import { Routes, Route } from 'react-router-dom';
import { appPages } from './env.ts';
import { useSSRContext } from './ssr-context.ts';

type ReactLazyRoutes = {
  path: string,
  page: React.LazyExoticComponent<React.ComponentType<any>>,
};
type FirstArgOf<T> = T extends (arg1: infer U, ...args: any[]) => any ?
  U : never;

const REG_PAGE = /\/src\/pages\/([^/]+)\.tsx$/;
const routes: ReactLazyRoutes[] = Object.keys(appPages).reduce((routeArr, pagePath) => {
  const matches = pagePath.match(REG_PAGE);
  if (!matches) {
    return routeArr;
  }
  const name = `/${matches[1].toLowerCase()}`;
  const importedPage = appPages[pagePath];
  const page = importedPage.default;
  const relativePath = name;
  const result = [
    ...routeArr,
    {
      path: relativePath,
      page,
    },
    { // RouteObject 不支持 alias，创建 2 条 Route
      path: `${relativePath}.html`,
      page,
    },
  ];

  // 默认路由为 index 首页路由
  if (name === '/index') {
    result.push({
      path: '/',
      page,
    });
  }

  return result;
}, [] as ReactLazyRoutes[]);

export function matchUrl(url: string) {
  return routes.findIndex((route) => url.indexOf(route.path) === 0) > -1;
}

export default function RouterView() {
  const ssrContext = useSSRContext();
  return (
    <>
      <Routes>
        {
          routes.map((route) =>
            <Route
              key={route.path}
              path={route.path}
              element={
                <route.page ssrContext={ssrContext} />
              }
            />
        )
        }
      </Routes>
    </>
  );
}
