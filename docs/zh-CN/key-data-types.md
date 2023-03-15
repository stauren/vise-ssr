---
layout: page
title: "关键数据类型"
permalink: /zh-CN/key-data-types.html
---
## 概述
以下介绍在 app 开发、插件开发中可能用到的数据类型（均从 npm 包 `vise-ssr` 中 export）

## RenderContext
RenderContext 主要用来在某一次请求期间传递数据，各个 hooks 使用者可以将自定义数据放入 RenderContext.extra 中。能从参数中读取 RenderContext 的 hooks有：`requestResolved`, `beforeUseCache`, `findCache`, `beforeRender`, `render`, `afterRender`, `beforeResponse`

在一个典型的场景中，App 在 `requestResolved` 中解析收到的请求，有可能在此阶段根据用户信息请求 AB实验接口以确定用户实验分支，在此阶段将实验相关信息放入 RenderContext.extra；在 `beforeUseCache` 中，App 将某些缓存相关信息存入 RenderContext.extra 供后续的生成页面缓存脚注等使用（如果是全新 render，可以在 afterRender 中读取到 CacheInfo 信息，但如果是 `hitCache` 场景，afterRender 中无法读取）；在 `beforeRender` 中，App 请求页面依赖的接口数据，并放入 RenderContext.meta.initState；在 `render` 阶段，Vue 等页面框架通过 SSRContext 获取前面钩子保存在 RenderContext 中的值，并将 `render` 的改动写回。`afterRender` 和 `beforeResponse` 阶段，App 主要读取之前 hooks 设置的信息，以便决定最后的页面生成逻辑（如利用 `render` 阶段返回的 title 生成页面标题）。

`RenderContext.meta` 是一个有固定字段的，存放 Vise 框架定义的数据的变量，其值可以在 `render` 期间的 SSRContext 中访问和修改。其中有以下固定字段：
- title: `render` 过程中，被渲染页面根据设置，返回当前页面标题
- cache: `render` 过程中，页面通知后续 hooks，本次渲染结果不可缓存（如发生了渲染异常）
- initState: `render` 之前的钩子，通过接口数据等构建的页面初始化 state 数据。如果配置了 ViseConfig.strictInitState === true，Vise 会忽略 `render` 期间对 initState 的改动，将 `render` 之前的快照传递到客户端
- routerBase: context 中传递的 HTTP request 的 url 只包含 app 中路由部分，前半截的路由 base 在此查询
- app: UI library 将 app 渲染后得到的 string
- template: 渲染使用的 HTML 页面模板，可以修改其中自动后使用 fillSsrTemplate 重新填充页面
- preloadLinks: 页面需要预加载的资源 HTML 标签

```typescript
type RenderContextMeta = Partial<{
  // page title
  title: string,
  // should SSR result be cached
  cache: boolean,
  // initState used for store
  initState: JSONObject,
  // url in HTTP request passed around hooks do not have
  // routerBase prefix
  routerBase: string,
  // UI library app rendered as string
  // be careful of hydration mismatch
  app: string,
  // HTML template
  template: string,
  // preload link as string for the rendered page
  preloadLinks: string,
}>;

// HTTP 渲染上下文，主要用来传递 HTTP 请求内容和在 extra 中存储各个钩子的额外数据
type RenderContext = {
  request: HTTPRequest,
  meta: RenderContextMeta,
  extra: JSONObject,
  error?: RenderError, // 当各个钩子发生异常时，可以在渲染上下文携带该 error 信息
};
```
## RenderResult
渲染结果，根据不同场景有多种可能，以下在注释中说明。
```typescript
type RenderResultBase = {
  // 传递渲染中的参数和各个钩子的注入的 metadata
  context: RenderContext,
  // 渲染者，便于定位页面生成的责任方
  renderBy: string,
};

export type SuccessRenderResult = RenderResultBase & {
  // 完成了全新 SSR 渲染时触发
  type: 'render',
  // SSR 渲染结果
  html: string,
  // afterRender hooks 需要 cacheInfo 来更新缓存，如果 beforeUseCache 有返回则会带入
  cacheInfo?: CacheInfo,
};

// 服务器渲染结果，包括渲染上下文、缓存相关信息和 SSR 渲染结果，也有可能是渲染异常
export type RenderResult = (RenderResultBase & ({
  type: 'error',
  // 在渲染异常时触发，RenderError 中包含完整错误信息
  // 可据此在 beforeResponse 中生成相关错误对应的 HTTPResponse 页面
  error: RenderError,
} | {
  // 这一类渲染请求是被 receiveRequest 拦截的请求
  // Plugin 或者 App 应该在 afterRender 或/和 beforeResponse 中
  // 识别到自己的拦截，并自行完成页面的渲染或 HTTPResponse 构建
  type: 'receiveRequest',
} | {
  // 命中缓存的渲染结果，没有发生真正渲染
  type: 'hitCache',
  content: string,
  cacheInfo: CacheInfo,
})) | SuccessRenderResult;
```

## ViseHooks
此数据类型为业务 app 的 `server-hooks.ts` 文件输出值类型。支持配置 Vise 定义的各个生命周期 hooks 回调（支持以输入传入多个回调），同时支持引用 Vise Plugin 插件。

```typescript
// 基础类型，定义了每个 hooks 回调函数
export type HookCallback = //...;

// 在 HookCallback 基础上，封装了支持传入数组配置
// 同时支持对 waterfall 类型 hooks 配置回调位置
export type HookCallbackConfig = {
  [K in HookNames]?: ArrayOrSingle<HookCallback[K]> | ArrayOrSingle<{
    callback: HookCallback[K],
    // enforce the execution order of waterfall type callbacks
    // execution order: pre => default (without enforce) => post
    enforce?: 'pre' | 'post',
  }>;
};

// 完整的配置文件类型，除了配置各个 hooks 回调，需要传入 app 名称，支持插件
export type ViseHooks = HookCallbackConfig & {
  appName: string, // 注意 app 名称不要以 app- 开头，是自动补全的
  plugins?: Array<VisePlugin>,
};
```

## VisePlugin
Vise 插件输出值的类型，业务 app 可以 import VisePlugin 值后，放入 `server-hooks.ts` 配置文件使用。主要内容是插件名，及插件实现的一组 hooks 回调。
```typescript
export type VisePlugin = {
  // 插件名应该与 npm 包名一致，满足约定：
  // vise core：vise:${componentName}
  // 插件：vise-plugin-${myPluginName}
  // app: app-${myAppName}
  // 其中自定义名应该只由以字母开头的只包含小写字母、数字、连接线(-)，并以小写字母开头
  name: string,
  hooks: HookCallbackConfig,
};
```

## CacheInfo
缓存相关信息，主要是 `beforeUseCache`, `findCache`, `hitCache` 等几个 hooks 使用。
```typescript
export type CacheInfo = {
  // 业务缓存 key
  key: string,
  // 缓存过期时间点, unix timestamp
  expire: number,
  // 是否先使用已过期数据再更新缓存
  stale: boolean,
  context: RenderContext,
};
```
[tapable]: <https://github.com/webpack/tapable>
