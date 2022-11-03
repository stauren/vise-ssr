---
layout: page
title: "数据加载及传输"
permalink: /zh-CN/data-fetch.html
---
SSR 服务端渲染，重要的问题就是生成页面需要的数据如何加载和传输，以及如何完成页面同构。

## 整体设计
![Data Flow](../images/data-flow.png)

## 数据流程
- 请阅读文档了解数据传递的数据类型：[RenderContext](./key-data-types.html#rendercontext)
- 数据加载: Vise 推荐在 [tapable-hooks] 中按需加载数据，没有特殊情况推荐在 `beforeRender` 中进行数据加载，并存储在 `RenderContext.meta.initState` 上，注意 `RenderContext.meta.initState` 应该为应用 App 的 Store 的 state 的子集，即 DeepPartial&lt;State&gt;
- 在 RenderContext 中存储数据：Vise 定义的数据统一存放在 `RenderContext.meta`, 包括 app 初始化依赖的 store 数据：`RenderContext.meta.initState`. 用户自定义数据存放在 `RenderContext.extra`.
- SSR 期间: Vise 框架会将 hooks 加载好的数据通过  `SSRContext` 传递到 Server Render Bundle 中。业务 app 可以通过调用 `useSSRContext` 或 attr 访问到 context,或直接通过 store 访问到 initState
- strictInitState: 该参数在 `vise.config.ts` 中配置，默认为 true，主要控制 SSR 期间 store 是否可变。在默认的严格模式下，Vise 会忽略 SSR 期间 App 对 store 的修改，在 SSR 开始期间和客户端页面初始化之前，将 `RenderContext.meta.initState` 数据注入到 store 中。设置 strictInitState 为 false 后，Vise 不会在 SSR 时将 initState 注入 store；会使用 SSR 期间修改后的 Store 数据传输到客户端页面，并在 hydration 之前注入 store
- 服务端到客户端传输：初始化数据通过 JavaScript 全局变量 `window.Vise.initState` 的形式，在生成的 HTML 页面 &lt;script&gt; 标签中进行传输，传输的数据源，会根据 strictInitState 参数有所不同
- 客户端数据初始化及同构(hydration): Vise 框架使用全局变量自动初始化数据到 Store 中，业务 App 从初始化开始既可以从 Store 中获取最新数据进行 [hydration]
### 禁用 strictInitState 的风险
在默认情况下，Vise 是不推荐 App 在 SSR 期间修改 Store 数据的。这主要是因为，将一个响应式 App 渲染为 HTML 字符串不是一个动态的过程，其实更像是取了某一个瞬间的 App 的一个截图，如果中途数据发生改动，那么有数据不一致的风险。

想象在页面的头部和尾部各存在一个组件，显示 Store 中的同一个字段。在头部 header 组件使用初始化数据渲染成字符串后，中间的 body 组件在渲染过程汇总触发了一次 Store Mutation 修改了数据，在随后的尾部 footer 组件渲染过程中，将使用更新后的数据生成 HTML 字符串片段，这里头尾数据是不一致的，已经渲染完成的头部并不会因为数据变动再重新渲染。在这种情况下，无论是像客户端传输修改前还是修改后的数据，都会在 header 或 footer 组件中触发 hydration mismatch 错误，导致页面重新生成。

基于以上原因，Vise 默认是不会向浏览器端传输渲染期间修改过的数据的。但在某些特定情况下，仍然需要在渲染期间生成数据并保存到 Store，Vise 允许通过设置 strictInitState=false 来绕过这一限制，开发者应该清楚相关限制，确保在数据改动前没有依赖这一数据的组件完成渲染。
### SSR 渲染期间 Node.js 服务与 Vue 页面的通讯
在 SSR 渲染开始时，服务端会向 render bundle 注入 context，Vue 页面可以在 `setup` 生命周期 通过 `useSSRContext` 获取相关上下文，React 页面可以通过页面组件的 Props 获取，也可以回写全局页面 `title` 等信息：
```typescript
// pages/my-page.vue
// ...
setup() {
  if (isSSR) {
    const { meta, extra } = useSSRContext();
    // access data in context.extra set by vise hooks
    console.log(extra.userAgent, extra.cookies);
    // communicate to HTTP server by changing data in meta & extra
    meta.title = 'My Page Title';
  }
}
// ...

//pages/my-page.tsx
//...
type MyPageProps = {
  ssrContext: {
    context: Pick<RenderContext, 'meta' | 'extra'>,
    updateContext: (context: Pick<RenderContext, 'meta' | 'extra'>) => void,
  }
};
function MyPage({ ssrContext: { context, updateContext } }: MyPageProps) {
  const { meta, extra } = context;
  // access data in context.extra set by vise hooks
  console.log(extra.userAgent, extra.cookies);
  // communicate to HTTP server by calling updateContext
  updateContext({
    extra,
    meta: Object.assign(meta, {
      title: 'My Page Title',
    })
  });
}
// ...
```
如果需要使用 `context` 传递更多信息控制全局 HTML 内容，请参考 [从 Vue 控制全局 HTML 内容](./server-api.html#从-vue-控制全局-html-内容)。
