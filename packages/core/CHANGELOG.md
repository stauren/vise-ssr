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
