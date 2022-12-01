---
layout: page
title: "Vise config 配置文件"
permalink: /zh-CN/vise-config.html
---
Vise 配置文件为 app 项目根目录中的 `vise.config.ts`，支持 typescript 格式。

## 可用配置项

```typescript
export type ParsedViseConfig = {
  // 当前 app 使用的 vise 脚手架类型，如 'vue3-app' 或 'react-app'
  scaffold: SupportedScaffold,

  /**
   * https://vitejs.dev/guide/build.html#public-base-path
   * 重载 viteConfig.base
   * 页面资源根路径，可以是完整 url 或者相对或绝对路径，必须以 '/' 结尾
   * 如果配置为 url，vise 将不对页面资源做额外处理
   * 如果配置为路径，服务端将使用配置的路径提供静态资源服务
   */
  base: string,

  // 是否允许 SSR 期间修改 store，参考：
  // https://stauren.github.io/vise-ssr/data-fetch.html#the-risk-of-disable-strictinitstate
  strictInitState: boolean,

  // 默认页面标题，可以被具体页面使用 SSRContext 重载
  defaultTitle: string,

  // 自定义页面 favicon url
  faviconLink: string,

  // 是否将 lib-flexible 代码嵌入 head 标签
  useFlexible: boolean,

  // 自定义 HTML 目标路径
  customTemplate: string,

  // vite 配置
  viteConfig: UserConfig,

  // 运行 `vise dev` 启动调试服务器时使用的端口
  devPort: number,

  // SSR 时生成到 <html> 标签上的 class 属性
  htmlClass: string | (() => string),

  /**
   * 插入到 head 标签中的代码块
   * 某些特定 <script> 标签依赖位于 <head> 标签的头部或尾部
   * SSR 期间，框架可能会往 <head> 中插入若干内容
   * 使用此配置在渲染完成后插入指定内容
   */
  htmlFixedPositionFragments: HtmlFixedPositionFragment[],

  /**
   * 在 src/pages 目录中的页面默认会被构建为异步模块（async chunks）
   * 使用此配置将特定页面使用 eager 配置加载为同步模块
   * https://vitejs.dev/guide/features.html#glob-import
   */
  routerSyncPages: string[],

  /**
   * 使用 html-minifier-terser 压缩 HTML 代码
   * 可传入 bool 类型开关或 html-minifier-terser Options 配置
   */
  htmlMinify: HtmlMinifierTerserOptions | boolean,

  /**
   * 页面路由地址根路径，允许传入字符串或正则表达式数组
   * 1. 如果传入字符串，所有以该根路径的开头的 url 访问将由该 render bundle 处理
   * 2. 如果传入多个正则表达式，可以配置多个 url 同时访问同一个页面
   * 如： [/(\/[\w-]+)?\/vise\/vue3-intro\//], (\/[\w-]+) 是页面 url 中可变的部分
   * url.match(regExp)[0] 为真正的动态页面路由根路径
   */
  routerBase: RegExp[] | string,
};
```
