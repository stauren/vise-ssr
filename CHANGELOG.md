# [0.9.0](https://github.com/stauren/vise-ssr/tree/v0.9.0) (2023-10-12)
### Features
- Upgrade from vite 3 to vite 4
- Use "@vitejs/plugin-react-swc" to replace "@vitejs/plugin-react"
- Upgrade other npm package version
- Added 'legacy' option in vise config;
### Bug Fixes
- Missing pre-build bundle on the first dev run;
# [0.8.1](https://github.com/stauren/vise-ssr/tree/v0.8.1) (2022-12-16)
### Features
- **Merge vite config in vise config**:
  1. Merge config fields in vise.config.ts come from vite such as 'hmrPort', 'ssr', 'resolve', 'build', 'plugins' into viteConfig.
  2. Finish english version of vise config file doc.
- **Using airbnb eslint config**:
  1. Update eslint to version 8;
  2. Change main eslint config to eslint-config-airbnb;
  3. Split eslintrc config into packages;
  4. Project created by vise now use airbnb eslint config;
  5. Fixed all eslint error;
- **Change data structure in RenderContext**: move extra.initState to meta.initState
- Added 'generateCsrHtml' option in vise config;
- SsrFetchConfig, SsrFetchResult & SsrFetchResultOf removed;
- **"Data Fetch & Transportation" translated**: finish English version of "Data Fetch & Transportation"
- **refactor mergeConfig, better array merge**: now can merge `T|T[]` type value into `T[]`; add and change all comments to English; add more fp flavor;
- Better render error report in dev-server;
- Better console.log management;
- Added axios dependency in template;
- Remove core's dependency to axios
- Project create by vise use English now
### Bug Fixes
- Fix phantom dependency issue in template to support pnpm;
- Fix cyclic dependency bug;
- Fix dependency deprecated issue;
# [0.8.0](https://github.com/stauren/vise-ssr/tree/v0.8.0) (2022-10-25)
### Features
- **Vise react SSRContext**: All pages in vise-react apps will receive an ssrContext attribute, for accessing and updating values in RenderContext.meta and RenderContext.extra. For example title of the page could be changed via RenderContext.meta.title
- **meta and extra in RenderContext**: Now RenderContext has RenderContext.meta which contains all metadata used by Vise, and RenderContext.extra which contains all user custom data used in server-hooks; They used to be both on RenderContext.extra
- **SsrBundleSuccess simplified**: Then render result type of SsrBundleSuccess used to have 'app', 'html', 'template', 'preloadLinks' properties, now only 'html'. Other rendered pieces are moved to RenderContext.meta.
- **hook-logger**: Now the hook-logger has shorter default output by reducing logged HTTP headers.
- fetch hooks in vue component removed.
- Related document updated.
### Bug Fixes
- fix a cache bug in express-server.
# [0.7.2](https://github.com/stauren/vise-ssr/tree/v0.7.2) (2022-10-13)
### Features
- using vitest to replace jest
- add unit test to vise created template projects
### Bug Fixes
- fix a bug in vise create caused by random execute order of copy
# [0.7.0](https://github.com/stauren/vise-ssr/tree/v0.7.0) (2022-10-09)
### Features
- upgrade vite 2.0 to vite 3.0
- using pnpm to replace yarn
### Bug Fixes
- phantom dependencies;
- prebundle dependencies missing issue;
# [0.6.3](https://github.com/stauren/vise-ssr/tree/v0.6.3) (2022-09-23)
### Bug Fixes
  - fix wrong parameter in server-hooks.ts of react template.
# [0.6.2](https://github.com/stauren/vise-ssr/tree/v0.6.2) (2022-08-30)
### Bug Fixes
  - fix wrong dependencies config of @vise-ssr/vue3
# 0.6.1 (2022-08-25)
### Bug Fixes
- update for documents on npm and github
# [0.6.0](https://github.com/stauren/vise-ssr/tree/v0.6.0) (2022-08-24)
### Features
- First public npm package: [vise-ssr](https://www.npmjs.com/package/vise-ssr)
- documents: https://stauren.github.io/vise-ssr/
- use `vise dev` to start dev server
- use `vise build` to build production bundles
- use `vise create` to initialize apps
- use `vise serve` to start HTTP SSR service with built bundles [more](https://stauren.github.io/vise-ssr/commandline-tool.html) 
- **Provide Vise hooks API**: use [server-hooks.ts](https://stauren.github.io/vise-ssr/tapable-hooks.html) to customize apps server logic
- supported UI library: Vue3, React
- @vise-ssr/express-server uses sub-process to do page rendering to avoid memory leak
