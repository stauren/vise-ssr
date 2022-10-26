---
layout: page
title: "Tapable hooks"
permalink: /zh-CN/tapable-hooks.html
---
## 概述
在进行 SSR 页面渲染的时候，从服务器收到客户度发来的 HTTP Request 请求，到服务端完成构建并发出 HTTP Response 响应的整个阶段中，调用 Vue 等框架的服务端渲染包如 `vue/server-renderer` 将关键的 Vue app 渲染为 HTML 字符串是关键的一步（Vise 框架不止限于支持 Vue 框架，Vise 是可以跨框架完成 SSR 渲染的，以下举例仍然使用 Vue），Vise 框架也是围绕这个 app 渲染步骤来进行的构建。

同样重要的是，业务在服务端需要除去 Vue 渲染的其它逻辑，如
1. 从第三方接口加载 Vue 渲染需要的初始化数据
1. 完成特定的数据上报
1. 加载数据和渲染异常梳理
1. 服务端缓存的使用逻辑

这些逻辑可以放到 Vue render bundle 中，但这会导致服务端执行代码和客户端执行代码难以分开，尤其是在他们对第三方包有不同依赖的时候，可能导致客户端加载大量不必要的服务端运行代码。另外一个选择是把业务的服务端逻辑硬编码到服务端代码中（这也是 Vise 早期的方式），但这会导致扩展性的问题。

为了解决以上问题， Vise 基于 [tapable] 定义了基于 hooks 的服务端生命周期：
1. 通过 hooks 定义标准的、与业务无关的服务端生命周期，剥离特定业务和 server 端核心实现；
1. 多个业务 app 可以并存于同一服务器而不冲突，各个业务 app 独立定义自身的服务端逻辑；
1. hooks 使用灵活、可扩展，各个服务端的流程通过 hooks 标准化，服务器开发者和业务 app 开发者、插件开发者可以把各自的逻辑通过 hooks 整合到一起；

## Server Hooks 流程图
![Vise tapable hooks 整体流程](../images/tapable-hooks.png)

## 第三方依赖
hooks 基于 tapable 实现，具体可参考：
- <https://github.com/webpack/tapable>
- <https://segmentfault.com/a/1190000039380095>

## 服务端 SSR 过程定义
Vise 将服务端 SSR 过程定义为以下过程：
```
receiveHTTPRequest      // 接收到客户端发来的 HTTP 请求
resolveHttpRequest      // 解析客户端发来的 HTTP 请求
searchHTMLCache         // 搜索可用的 HTML 缓存
renderPrepare           // 预加载页面渲染所需数据等
renderHTML              // SSR 渲染 HTML
sendHTTPResponse        // 发送 HTTP 响应
```

## 服务端 Hooks 定义
基于以上抽象过程，Vise 定义以下 hooks 以便，开发者插入自定义逻辑：
- hooks.receiveRequest
- hooks.requestResolved
- hooks.beforeUseCache
- hooks.findCache
- hooks.hitCache
- hooks.beforeRender
- hooks.render
- hooks.afterRender
- hooks.beforeResponse

## Hooks 详解
### hooks.receiveRequest
接收到 HTTP 请求后，可以在此拦截请求，跳转或者直接返回等，任意回调函数(tapped function)返回结果即终止其它回调函数执行

| 类别 | Description |
| ----------- | ----------- |
| 名称 | receiveRequest |
| Hook 类型 | AsyncParallelBailHook |
| 参数类型 | HTTPRequest |
| 返回值类型 | Omit<RenderResult, 'type' \| 'renderBy'> \| void |

### hooks.requestResolved
HTTP 请求解析完成，多个钩子函数顺序执行传递解析结果，可在此修改解析结果（注意：如果修改了 url，会导致 hydration 时候出现 mismatch：js 端看到的是修改前的 urlA，服务端看到的是修改后的 urlB，所以如果这里修改 url，需要配合前端的逻辑同步修改）

| 类别 | Description |
| ----------- | ----------- |
| 名称 | requestResolved |
| Hook 类型 | AsyncSeriesWaterfallHook |
| 参数类型 | ResolvedRequest |
| 返回值类型 | ResolvedRequest  |

### hooks.beforeUseCache
在开始使用 HTML 缓存之前执行，如果确定缓存是否过期需要请求接口，可以在这里请求（如放映厅请求无极数据已确定缓存是否过期），多个钩子并行执行，串行依赖自行在单个钩子中解决。返回钩子返回结果即终止其它钩子执行。返回 CacheInfo 包含 cache key、cache 有效期信息；会使用其中信息试图命中缓存，如果未命中，重新生成的 HTMl 会依赖此缓存信息进行缓存

| 类别 | Description |
| ----------- | ----------- |
| 名称 | beforeUseCache |
| Hook 类型 | AsyncParallelBailHook |
| 参数类型 | RenderContext |
| 返回值类型 | CacheInfo \| void |

### hooks.findCache
根据 CacheInfo 参数中的信息，返回命中的缓存 HTML 字符串。这个钩子主要是给 server 实现者注入 Redis 查询逻辑等使用，并行执行，第一个返回的结果即为命中的缓存。除非特殊情况 app 业务实现方应该忽略此 hook，否则可能使服务端缓存失效

| 类别 | Description |
| ----------- | ----------- |
| 名称 | findCache |
| Hook 类型 | AsyncParallelBailHook |
| 参数类型 | CacheInfo |
| 返回值类型 | string \| void |

### hooks.hitCache
在 HTML 缓存命中后并行执行所有钩子，然后响应 HTTP 请求，无法在此更改响应，可做统计等

| 类别 | Description |
| ----------- | ----------- |
| 名称 | hitCache |
| Hook 类型 | AsyncParallelHook |
| 参数类型 | HitCache |
| 返回值类型 | void |

### hooks.beforeRender
在准备使用 Vue render bundle 等服务端渲染包生成 HTML 之前调用，可用来请求依赖数据等，多个钩子顺序执行传递请求参数

| 类别 | Description |
| ----------- | ----------- |
| 名称 | beforeRender |
| Hook 类型 | AsyncSeriesWaterfallHook |
| 参数类型 | RenderContext |
| 返回值类型 | RenderContext |

### hooks.render
渲染服务端 App 时调用，对于 Vue 应用，此步骤对应加载 vue-render-bundle 渲染页面。这个钩子主要是给  server  实现方使用，并行执行，第一个返回的结果即为渲染结果。渲染结果 RenderResult 支持多种类型，包括渲染失败等情况。除非特殊情况 app 业务实现方应该忽略此 hook。

| 类别 | Description |
| ----------- | ----------- |
| 名称 | render |
| Hook 类型 | AsyncParallelBailHook |
| 参数类型 | RenderContext |
| 返回值类型 | RenderResult |

### hooks.afterRender
在 App 渲染完成后执行，根据渲染成功或失败，RenderResult 可能为成功或失败，如需重载渲染结果，钩子可以返回更改后的 RenderResult。渲染结果中包含 SsrBundleResult，服务端会使用 SsrBundleResult 中的值重新拼装页面模板。这里可以简单替换掉页面 template 而不引起 hydration mismatch (模板是 Vue app 以外的部分)。注意钩子瀑布流顺序执行。

| 类别 | Description |
| ----------- | ----------- |
| 名称 | afterRender |
| Hook 类型 | AsyncSeriesWaterfallHook |
| 参数类型 | RenderResult |
| 返回值类型 | RenderResult |

### hooks.beforeResponse
在所有 HTTP 响应发送前执行，任意回调函数(tapped function)返回结果即终止其它回调函数执行。优先返回 HTTPResponse 将替代原有 HTTPResponse 返回。参数 RenderResult 包含 RenderContext 中各钩子添加的 meta data 和渲染异常 Error 等信息，可通过它们构建最终响应 HTTPResponse。

| 类别 | Description |
| ----------- | ----------- |
| 名称 | beforeResponse |
| Hook 类型 | AsyncParallelBailHook |
| 参数类型 | RenderResult |
| 返回值类型 | HTTPResponse \| void |

## 使用示例
### App 开发者
App 开发者首先使用 [Vise 命令行工具](./commandline-tool.html)新建自己的业务项目（即 App），得到如 [App目录结构](./start-develop.html#app-目录结构) 中描述的默认项目文件夹。
在项目的 `app-my-project/src/server-hooks.ts` 文件中，开发者可以在从服务器接收到用户 HTTP 请求到发出 HTTP 响应的 9 个 hooks 生命周期中添加自己的业务逻辑。
#### server-hooks.ts 配置文件
一份典型的 `server-hooks.ts` 文件内容如下：
```typescript
import {
  ViseHooks,
  mergeConfig,
  fillSsrTemplate,
} from 'vise-ssr';
import { SIDEBAR_ITEMS } from './data/consts';
import request from './utils/request';

// 所有的回调都可以是 function 或者 function 数组
// 注意从 request.url 中取得的访问路径，是 app 内的路径，不包括 appName 的部分
// 如开发期间路径为 http://127.0.0.1:3000/page-a/
// 线上路径是 https://example.com/path/to/app-name/page-a/
// 在 hooks 中取到的都是 /page-a/
const serverHooks: ViseHooks = {
  appName: 'vue3-intro',
  // 如果加载 Vise plugin，可以放入此数组
  plugins: [],

  // 接收到 HTTP 请求后，可以在此拦截请求，可以简单生成 RenderType 为 receiveRequest 的 RenderResult
  // 在 afterRender 钩子中进一步处理具体渲染结果，相关信息放入 renderResult.context.extra
  // 生成渲染结果的渲染方应该提供符合规范的 renderBy 名字
  // 任意回调函数(tapped function)返回结果即终止其它回调函数执行
  receiveRequest: [async (httpRequest) => {
    let result;
    if (httpRequest.url === '/hook-test') {
      result = {
        context: {
          request: httpRequest,
          extra: { // 将生成最终 response 的信息放入 extra 传递
            jumpTo: 'https://www.qq.com/',
          },
        },
      };
    }
    return result;
  }],

  // HTTP 请求解析完成，多个钩子函数顺序执行传递解析结果，可在此修改解析结果
  // 注意如果修改了 url，会导致 hydration 时候出现 mismatch：js 端看到的是修改前的 urlA
  // 服务端看到的是修改后的 urlB，所以如果这里修改 url，需要配合前端的逻辑同步修改
  requestResolved: async (resolvedRequest) => {
    const { original, resolved } = resolvedRequest;
    const { url } = original.request;
    const extraData: Record<string, string> = {};

    if (url === '/hook-jump') {
      extraData.injectByHook = 'RequestResolved inject';
    }
    return {
      original,
      resolved: {
        ...resolved,
        extra: { ...resolved.extra, ...extraData },
      },
    };
  },

  // 在开始使用 HTML 缓存之前执行，如果确定缓存是否过期需要请求接口，可以在这里请求
  // 多个钩子并行执行，串行依赖自行在单个钩子中解决。返回钩子返回结果即终止其它钩子执行。
  // 返回值 CacheInfo 包含 cache key、cache 有效期信息；
  // 服务端会使用其中信息试图命中缓存，如果未命中，重新生成的 HTMl 会依赖此缓存信息进行缓存
  beforeUseCache: async (renderRequest) => {
    const { url, headers } = renderRequest.request;
    const userAgent = headers['user-agent'] || '';
    let result;

    // suppose generated html depends on browser is chrome or not
    const browser = userAgent.indexOf('Chrome') > -1 ? 'chrome' : 'other';

    // cache html by page
    if (url === '/' || SIDEBAR_ITEMS.find(item => `/${item.id}` === url)) {
      result = {
        key: `${browser}_${url}`,
        expire: Date.now() + 3600 * 1000,
        stale: true,
        context: renderRequest,
      };
    }
    return result;
  },

  // 在 HTML 缓存命中后并行执行所有钩子，然后响应 HTTP 请求，无法在此更改响应，可做统计等
  hitCache: async (hitCache) => {
    console.log(`Use cache with key: ${hitCache.key}`);
  },

  // 在准备使用 Vue render bundle 等服务端渲染包生成 HTML 之前调用
  // 可用来请求依赖数据等，多个钩子顺序执行，使用 extra 传递数据
  beforeRender: async (renderContext) => {
    // 为首页请求额外接口数据
    if (renderContext.request.url === '/') {
      const apiResult = await request({
        url: 'https://www.randomnumberapi.com/api/v1.0/random?min=1000&max=9999&count=1',
      });
      return {
        ...renderContext,
        extra: {
          ...(renderContext.extra || {}),
          initData: apiResult,
        },
      };
    }
    return renderContext;
  },

  // 在 HTML 渲染完成后执行，根据渲染成功或失败，可能接受 RenderError 或 RenderDone 参数
  // 如需重载渲染结果，钩子需要返回 RenderResult 重载，瀑布流顺序执行
  // 注意，如果在这个钩子里面重载渲染结果，在 hydration 的时候可能会发生 mismatch
  afterRender: async (renderResult) => {
    if (renderResult.type === RenderResultCategory.render) {
      // 可以重载渲染结果，根据 ssrResult 重新拼装模板
      // 这里是一个很好的重载 ssrResult.template 的时机，外层模板跟 vue app 无关，不会引起 hydration mismatch
      if (renderResult.context.request.url === '/hook-jump') {
        const newSsrResult = mergeConfig<typeof renderResult.ssrResult>(
          renderResult.ssrResult,
          {
            ssrContext: {
              title: 'render finish override2',
            },
          },
        );
        return {
          ...renderResult,
          ssrResult: {
            ...newSsrResult,
            html: fillSsrTemplate(newSsrResult.template, newSsrResult),
          },
        };
      }
    } else if (renderResult.type === RenderResultCategory.error) {
      // 如果发生渲染异常，这里没法做跳转，只能将异常重载为一个正常的渲染结果
      // 或者把一个异常映射为另外的异常，为异常添加具体的 meta data，具体的跳转，需要在 beforeResponse 钩子里面做
      return mergeConfig<typeof renderResult>(renderResult, {
        error: {
          detail: {
            reason: 'info sent with error result, can be read by beforeResponse hook',
          },
        },
      });
    }
    return renderResult;
  },

  // 在所有 HTTP 响应发送前执行，任意回调函数(tapped function)返回结果即终止其它回调函数执行
  // 优先返回的 HTTPResponse 将替代原有 HTTPResponse 返回
  beforeResponse: async (renderResult) => {
    // 为成功渲染页面，统一添加特定 headers 等
    if (renderResult.type === RenderResultCategory.render) {
      return { // 可以在此重载渲染成功的 HTTP 响应，其实这里的逻辑跟原生是一样的
        code: 200,
        headers: {
          'content-type': 'text/html;charset=utf-8',
        },
        body: renderResult.ssrResult.html,
      };
    }

    // 被 receiveRequest hook 拦截的请求，可以被再次拦截
    if (renderResult.type === RenderResultCategory.receiveRequest) {
      if (renderResult.context.request.url === '/hook-test') {
        return {
          code: 302,
          headers: {
            location: 'http://127.0.0.1:3000/hook-jump',
          },
        };
      }
    }

    if (renderResult.type === RenderResultCategory.error) {
      // 发生服务端异常，可以在此从 renderResult.context 和 renderResult.error
      // 读取到之前钩子传递下来的 meta data，可以在此展示最终处理异常，上报、跳转 CSR fallback 页面等
      // result = {
      //   code: 302,
      //   headers: {
      //     location: 'http://example.com/path/to/csr',
      //   },
      // };
    }
  },
};

export default serverHooks;
```
由以上示例文件可以看到：
- 所有的钩子都支持多次 tap（即支持传入多个回调函数），可以把一些可以解耦的同一生命周期但属于不同模块的逻辑放入不同回调函数，以便管理
- hooks 配置文件需要满足 Vise 提供的 `ViseHooks` 类型约束，使用 VS Code 等开发工具，可以清楚的看到每个 hooks 回调函数的入参和返回值类型，有助于开发者在不查询文档的情况下编写 hooks 回调
- hooks 为多个生命周期定义了 HTTPRequest, HTTPResponse, RenderContext, ResolvedRequest, RenderResult 等多个数据类型，主要用来定义各个 hooks 的参数和返回值类型，同时便于在各个 hooks 之间传递关于同一次 HTTP 请求的上下文（context）信息，这些类型都可以从 Vise import 得到，详细请参见：[关键数据类型](./key-data-types.html)
- hooks 的一个常见操作是在 context 或 result 中修改部分内容，为了方便修改一个较大的数据结构中的部分数据，Vise 提供了 `mergeConfig` 方法

### Server 开发者
#### 核心 Hook Classes
Vise 定义了基于多个 hooks 的服务端生命周期，并提供了多个 Hook 相关类，Server 开发者需要了解以下关键类：
- HookManager: 定义核心 hooks 数据结构、hooks 类型及出入参
- HookCaller: 负责触发（调用、唤起）各个生命周期 hooks，并在 hooks 回调生效时（即，hooks 的回调返回的参数改变了请求相关上下文数据）调用 logger 记录具体 hooks 对上下文的改变
- HookLogger: 默认的 hooks logger，针对各个钩子不同情况对上下文的改变提供了比较简洁和规范的日志，可重载
- HookLifeCycle: 接受用户的 ViseHooks 配置，使用用户提供的回调 tap HookManager 提供的 hooks，定义了服务端渲染生命周期，启动后会依序使用 HookCaller 唤起各个 hooks，完成整个生命周期流程
- HookPlugin : 将 Plugin 配置拆解为普通的 hooks 回调配置，以便支持以 `VisePlugin` 格式传入的插件

#### HookConfig 合并逻辑
可以看到，在以上设计思路下，核心服务端渲染流程已经被 Vise 定义，所以服务端跟 App 业务方一样，需要将自己的专有逻辑通过 HookConfig 传入 HookLifeCycle。因为 App 用户同样会传入一份 HookConfig，所以需要根据一定的策略对 HookConfig 进行合并：
- hooks 有 AsyncParallelBailHook, AsyncParallelHook, AsyncSeriesWaterfallHook 3种类型
- 对 Parallel 类型的 Hook，无需担心执行顺序，只需要考虑如果是 Bail 类型，那么优先返回的 Hook 会取消其它 Hook，如果服务端需要确保用户传入的 HookConfig 不冲突，可能需要用到高阶函数包装等手段
- 对 Waterfall 类型 Hook，执行顺序是至关紧要的，服务端需要根据具体要求对回调函数数组进行合适的排序，如服务端需要在渲染完成后做统一处理，则务必把自身回调作为 `afterRender` hook 的最后一个回调
- 由于整体的插件化体系，建议 server 端将自身的生命周期中逻辑封装为一个 plugin，合并入业务 app 传入的 hooks 配置。实际上可以理解为 Server Plugin + App Plugin + App 引用的其它 Plugin，整体构成了 HookLifeCycle 的运行参数

### 代码示例
```typescript
// my-server.ts
// ...
const serverHookConfig: Partial<HookCallback> = {                // 定义服务专有 hooks 逻辑
  render(renderContext) {
    // ...
    return renderResult;
  },
  // ...
};
const appHookConfig = await this.loadAppViseHooks();    // 加载用户 server-hooks.ts
const hookLifeCycle = new HookLifeCycle(                // 新建 hookLifeCycle
  addServerHooksAsPlugin( // 将 server 配置作为一个 plugin 合并入整体配置
    appHookConfig,
    serverHookConfig,
  ),
  new HookLogger(log), // 提供 logger，可根据自身 log 需求自定义 logger
);
express().use('*', async (req, res) => {
  const response = await hookLifeCycle.start({ // 接收到用户 HTTP 请求后，启动 HookLifeCycle
    url: req.originalUrl,
    headers: req.headers,
    body: req.body,
  });
  sendResponse(res, response);
});
// ...
```

### Plugin 开发者
hooks 开放了多个关键节点的回调，插件 Plugin 开发者可以针对其中某几个 hooks，开发出可重用的特定功能插件。
#### 约定和惯例
特定的编码约定有助于保持代码的整洁和可维护，Vise 对插件开发有以下约定：
- 插件的 npm 包名应该满足：`vise-plugin-${myPluginName}`，其中插件名 myPluginName 应该只由以字母开头的只包含小写字母、数字、连接线(-)
- Plugin 包的输出值类型为 [VisePlugin](./key-data-types.html#viseplugin)
#### Plugin 示例
##### HTML 缓存 plugin
该 plugin 实现 `hooks.beforeUseCache`， `hooks.findCache` 和 `hooks.afterRender` 3 个 hooks，并可允许用户传入自身生成缓存相关配置。
- 在 `hooks.beforeUseCache` 中，根据配置或默认逻辑，以当前 HTTP 请求作为参数，计算出缓存相关唯一 key 等 CacheInfo 信息，可通过它们构建最终响应
- 在 `hooks.afterRender` 中，使用 CacheInfo 信息，将渲染结果 RenderResult 存入相关缓存，可以是 Redis、内存缓存、文件缓存等
- 在 `hooks.findCache` 中，使用 CacheInfo 查询在 `hooks.afterRender` 中保存的缓存内容并返回
##### React SSR plugin
该 plugin 实现 `hooks.render` hook，以 RenderContext 为参数，加载 App 开发者提供的 React Server RenderContext Bundle，并调用生成 React App 对应的 HTML 内容，组装 SsrBundleResult 返回。同理，可以实现任意前端框架如 Angular, Svelte 等的服务端渲染插件。
##### 服务端数据加载 plugin
该 plugin 实现 `hooks.beforeRender` hook，为需要渲染的页面加载用户配置的特定数据并放入 context.extra.initData。该 plugin 可以封装数据异步加载的错误处理逻辑，封装支持多种数据处理协议逻辑，用户只需要在配置中提供特定的 API url 或命令字，既可在页面渲染前拿到依赖的接口数据。
##### 错误处理 plugin
该 plugin 实现 `hooks.beforeResponse` hook，处理 RenderResult.type 为 error 时候的场景，可以做错误上报、降级跳转，或是展示统一的规范错误提示、追查页面等逻辑
##### 自定义页面生成 plugin
该 plugin 实现 `hooks.receiveRequest` 和 `hooks.beforeResponse` hooks，拦截请求并自行生成响应
- 在 `hooks.receiveRequest` 中，拦截特定请求，并返回带 context.extra 扩展信息和 renderBy 渲染者信息的 RenderResult
- 在 `hooks.beforeResponse` 中，匹配上述拦截请求，调用 plugin 自身的逻辑，生成 HTTPResponse 返回，从而完全跳过 Vise 的页面渲染流程

[tapable]: <https://github.com/webpack/tapable>
