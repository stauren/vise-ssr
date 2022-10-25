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
- add unit test to vise created temlate projects
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
- 第一个公开发布到 npm 的 [vise-ssr](https://www.npmjs.com/package/vise-ssr)
- 文档请访问：https://stauren.github.io/vise-ssr/
- 支持 vise dev 启动开发服务器
- 支持 vise build 构建 client bundle 及 server bundle
- **提供 vise create 命令**: 现在可以通过 `vise create` 新建业务 app 了
- **新增 strictInitState 参数**: vise.config.ts 配置文件新增 strictInitState 参数，以提供严格的 SSR 阶段的初始化数据控制逻辑，具体文档参考：[数据流程]
- **新增 vise serve命令**: 现在可以通过 `vise serve` 直接在构建后的 app 目录下启动 HTTP SSR 服务了，[具体参数和文档](https://stauren.github.io/vise-ssr/commandline-tool.html) 
- **提供 vise hooks 及 hook plugin API**: 支持通过 server-hooks.ts 在 9 个 hooks 中配置业务的服务端逻辑
- 目前支持 vue3, react 页面框架
- **支持未命中路由404错误**: SsrBundleResult 可能是 RenderError 了。现在未命中 Vue 路由的 404 请求，可以跳过 render 步骤直接生成 404 错误了
- @vise-ssr/express-server 抽取 RenderProcessManager 可作为一个独立不依赖特定传输数据结构的子进程管理、通讯工具使用； 
- @vise-ssr/express-server 支持 HTTP 服务器主进程发起多个渲染消息到渲染子进程，子进程渲染完成后无需等待发回消息、接收下一个渲染消息即可立即开始下一个渲染，性能有改善；