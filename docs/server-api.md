## 概述
Vise 框架提供了 [express-server](https://github.com/stauren/vise-ssr/blob/main/packages/express-server)，同时 Vise 支持使用任何自定义的 Node.js 服务器提供 SSR 服务，只需满足 Vise 生成的 SSR bundle 相关接口要求即可。

## app 构建产物
在 Vise app 中，执行 vise build 命令构建后，会在 `dist` 目录生成 server 及 client 2个文件夹，如下所示：
```shell
app-my-project
└── dist
    ├── client
    │   ├── index.html
    │   └── assets
    │       ├── module.hash.js
    │       ├── module.hash.css
    │       ├── some.png
    │       └── ...
    └── server
        ├── ssr-manifest.json
        ├── server-hooks.js
        └── entry-server.js
```
`client` 目录中的文件为直接部署在静态 CDN 服务器上的浏览器文件，同时也是一个完整的 CSR 的 [SPA](https://en.wikipedia.org/wiki/Single-page_application) 客户端，可以在 Node.js 服务异常的时候直接通过静态 SPA 提供服务。

`server` 目录中的文件主要有包含所有模块信息以便生成用户当前访问页面的 preload 标签的 `ssr-manifest.json`，包含当前业务 app 所有服务端逻辑的 `server-hooks.js`，以及以 `entry-server.ts` 为入口的 `entry-server.js`，即 Vue3 等页面框架的 Server Render Bundle (以下简称 Render bundle)，该 bundle 需要在 Node.js 服务器中 require 引入，在服务代码打包的时候，Render bundle 应该以 external 形式异步引入，以便服务器同时支持多个业务 app 部署。

## 在 typescript 中使用 Render bundle
在 typescript 中，推荐以如下形式加载 render bundle:
```typescript
import type { ViseRenderBundle } from 'vise-ssr';
const bundleOfApp = await import('/path/to/bundles/entry-server.ts') as ViseRenderBundle;
```
## Render bundle 的接口
从 `ViseRenderBundle` 类型中可见，Render bundle 提供了以下方法：
```typescript
type ViseRenderBundle = {
  render: SsrBundleRender;
};
```
`render` 方法接受 `RenderContext` 类型参数，在渲染成功时返回 `SsrBundleResult` 类型结果，是 render hooks 中用来构建 `RenderResult` 结果的重要来源。

## 从 Vue 控制全局 HTML 内容
### 设置页面标题
在 Vue 模块中，在 `setup` 生命周期调用 `useSSRContext`，可以获取 SSR 期间上下文 context，设置 `title` 属性后，可在 SSR 时生成页面标题：
```typescript
defineComponent({
  setup() {
    const context = useSSRContext();
    context.title = 'My Page Title';
  },
  ...
});
```

### 从 Vue 模块自定义控制全局 HTML 内容
entryServer 的渲染结果 `SsrBundleResult` 完整定义如下：
```typescript
export enum SsrBundleResultKey {
  app = 'app',
  html = 'html',
  template = 'template',
  preloadLinks = 'preloadLinks',
  initState = 'initState',
}
export type SsrBundleResult =
  Record<SsrBundleResultKey, string> & Record<'ssrContext', Record<string, string>>;
```

可以看见除了完整的页面 `html` 内容以外，渲染结果中还有一些生成完整页面用到的模板、部分内容元素。在某些情况下，如果 Vue 页面需要自定义控制全局 HTML 的某些内容的生成，可以通过 `useSSRContext` 将需要生成的内容从 Vue 传递到服务器渲染上下文（目前页面标题即通过 context.title 传递生成），服务端通过 `ssrContext` 获取，处理 html 后返回给用户。

### 获取来自服务端 hooks 的数据
在多个服务端 hooks 中，可以修改 `RenderContext` 类型的 HTTP 请求渲染上下文参数，其中扩展字段 extra 中的值，会在 render 时传递给 Vue 的 SSRContext：
```typescript
export async function render(renderContext: RenderContext): Promise<SsrBundleResult> {
  // ...
  const ssrContext: SSRContext = {
    cookies,
    userAgent,
    ...renderContext.extra,
  };
```
由以上代码实现可见，业务 app 可以在 server hooks 中实现预取数据等等各种依赖 Vue 以外的接口的逻辑，将获取的结果放入 `RenderContext.extra`，即可在 Vue 组件中 setup 阶段通过 `useSSRContext` 获取。注意 extra 的类型为 `JSONValue`，不可传递复杂数据类型和数据引用。

## 部署服务
实现以上接口后，现在服务器已经可以根据用户请求中的 url, headers 等信息，调用 Render bundle 中提供的 `render` 方法获取页面 HTML，或获取相关页面信息自行组装页面。现在只需要加上相关的缓存、日志、容错等逻辑，就可以部署服务器开始提供 SSR 服务了。
