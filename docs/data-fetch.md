# 背景介绍
SSR 服务端渲染，重要的问题就是生成页面需要的数据如何加载和传输，以及如何完成页面同构。

## 整体设计
![Data Flow](./images/data-flow.png)

## 数据流程
- 请阅读文档了解数据传递的数据类型：[RenderContext](./key-data-types.html#rendercontext)
- 数据加载: Vise 推荐在 [tapable-hooks] 中按需加载数据，没有特殊情况推荐在 `beforeRender` 中进行数据加载，并存储在 `RenderContext.extra.initState` 上，注意 `RenderContext.extra.initState` 应该为应用 App 的 Store 的 state 的子集，即 DeepPartial&lt;State&gt;
- SSR 期间: Vise 框架会将 hooks 加载好的数据通过  `SSRContext` 传递到 Server Render Bundle 中。业务 app 在 setup 阶段可以通过调用 `useSSRContext` 或直接通过 store 访问到相关数据
- strictInitState: 该参数在 `vise.config.ts` 中配置，默认为 true，主要控制 SSR 期间 store 是否可变。在默认的严格模式下，Vise 会忽略 SSR 期间 App 对 store 的修改，在 SSR 开始期间和客户端页面初始化之前，将 `RenderContext.extra.initState` 数据注入到 store 中。设置 strictInitState 为 false 后，Vise 不会在 SSR 时将 initState 注入 store；会使用 SSR 期间修改后的 Store 数据传输到客户端页面，并在 hydration 之前注入 store
- 服务端到客户端传输：初始化数据通过 JavaScript 全局变量的形式，在生成的 HTML 页面 &lt;script&gt; 标签中进行传输，传输的数据源，会根据 strictInitState 参数有所不同
- 客户端数据初始化及同构(hydration): Vise 框架使用全局变量自动初始化数据到 Store 中，业务 App 从初始化开始既可以从 Store 中获取最新数据进行 [hydration]
### 禁用 strictInitState 的风险
在默认情况下，Vise 是不推荐 App 在 SSR 期间修改 Store 数据的。这主要是因为，将一个响应式 App 渲染为 HTML 字符串不是一个动态的过程，其实更像是取了某一个瞬间的 App 的一个截图，如果中途数据发生改动，那么有数据不一致的风险。

想象在页面的头部和尾部各存在一个组件，显示 Store 中的同一个字段。在头部 header 组件使用初始化数据渲染成字符串后，中间的 body 组件在渲染过程汇总触发了一次 Store Mutation 修改了数据，在随后的尾部 footer 组件渲染过程中，将使用更新后的数据生成 HTML 字符串片段，这里头尾数据是不一致的，已经渲染完成的头部并不会因为数据变动再重新渲染。在这种情况下，无论是像客户端传输修改前还是修改后的数据，都会在 header 或 footer 组件中触发 hydration mismatch 错误，导致页面重新生成。

基于以上原因，Vise 默认是不会向浏览器端传输渲染期间修改过的数据的。但在某些特定情况下，仍然需要在渲染期间生成数据并保存到 Store，Vise 允许通过设置 strictInitState=false 来绕过这一限制，开发者应该清楚相关限制，确保在数据改动前没有依赖这一数据的组件完成渲染。
### SSR 渲染期间 Node.js 服务与 Vue 页面的通讯
在 SSR 渲染开始是，服务端会向 Vue render bundle 注入 context，其中最重要的信息有当前请求 headers，Vue 页面可以在 `setup` 生命周期 通过 `useSSRContext` 获取相关上下文，从 header 中获取请求 cookie、userAgent 信息，也可以回写全局页面 `title` 等信息：
```typescript
// pages/my-page.vue
defineComponent({
  setup() {
    const context = useSSRContext();
    // 获取当前请求 cookies, userAgent
    console.log(context.userAgent, context.cookies);
    // 回写 title，最后会生成在页面上
    context.title = 'My Page Title';
  }
})
```
如果需要使用 `context` 传递更多信息控制全局 HTML 内容，请参考 [从 Vue 控制全局 HTML 内容](./server-api.html#从-vue-控制全局-html-内容)。

## `fetch` 生命周期 (deprecated)
> 注意：放入 vue 组件中的 fetch 生命周期已被标记为 deprecated，不推荐使用。如果需要在服务端渲染时预取数据，请使用 beforeRender hook，具体请参考 [tapable-hooks]。在 Vise 开发完成后，Vue 也放出了官方的服务端生命周期 [ServerPrefetch](https://vuejs.org/api/composition-api-lifecycle.html#onserverprefetch)，本质上与 fetch 是一样的，但 Vise 同样不推荐使用，原因主要是服务端 fetch 是服务端逻辑，可能引用大量服务端专用 packages，将纯服务端逻辑与双端逻辑写在一起会导致各种问题，Vise 推荐使用独立打包构建的 [tapable-hooks]。

Vise 为页面级别组件（`src/pages` 目录下组件）引入额外的生命周期 `fetch`，在 Vue 生命周期 `created` 之前执行，如下所示：
```typescript
<script lang="ts">
import { reactive, computed, defineComponent } from 'vue';
import { SsrServerFetcher } from 'vise-ssr';
import { useStore, MutationTypes, MyStore } from '@/store/';
import { fetchLuckyNumber } from '@/services';

// 定义页面级别 fetch 函数，在 SSR 阶段和 CSR 阶段都可能使用
// SSR 阶段会从服务端传入 $ssrFetcher，接受 SsrFetchConfig 参数
// 服务端可以实现 tRPC 调用逻辑等
async function fetch({ $ssrFetcher, to, headers }: {
   $ssrFetcher: SsrServerFetcher,
   to: RouteLocationNormalized,
   headers: HttpHeaders,
} = {}) {
  // 具体的 fetch 逻辑应该放入 services 层，将 $ssrFetcher 传入供调用
  const newLuckyNumber = await fetchLuckyNumber($ssrFetcher, to.query?.id ?? '1', headers.cookie);
  // fetch 的数据必须进入 store 以便 SSR 完成后的 hydration
  // 返回 store commit 函数，SSR 阶段由框架注入 store，CSR 阶段自行提供 store

  return (store: MyStore) => {
    store.commit(MutationTypes.UPDATE_LUCKY_NUM, { newLuckyNumber });
  };
}

export default defineComponent({
  setup() {
    const store = useStore();
    const luckyNumber = computed(() => store.state.luckyNumber);
    const fetchLuckyNum = async () => {
      // CSR 阶段调用页面初始数据接口
      const doCommit = await fetch();
      // fetch 返回 commit 函数，需调用方提供 store 实例
      doCommit(store);
    };

    return {
      luckyNumber,
      fetchLuckyNum,
    };
  },
  // 在 options API 中传入 fetch 方法（注意不是在 methods 中的 fetch 方法）
  // 以便在 SSR 阶段调用获取渲染所需数据
  fetch,
});
</script>
```
`fetch` 生命周期必须返回类型为 `Promise<(store: MyStore) => void>` 的回调函数，并在其中将周期中获取的数据 `commit`，Vise 框架会注入所需的 store 依赖。这是为了确保所有 `fetch` 生命周期获取的数据都进入 [Vuex Store](https://next.vuex.vuejs.org/)。

### CSR 时从 Vue 组件中调用 `fetch` 方法获取数据
```typescript
// inside vue component methods
const fetchLuckyNum = async () => {
  // CSR 阶段调用页面初始数据接口
  const doCommit = await fetch();
  // fetch 返回 commit 函数，需调用方提供 store 实例
  doCommit(store);
};
```
在 Vue 组件方法中，可以主动调用闭包中的 fetch 方法，从客户端发起对同一份数据的请求。获取 `(store: MyStore) => void` 类型返回值后，主动传入 store 实例触发 `commit` 更新数据。

### 抽取接口处理逻辑到 service 层
```typescript
// services.ts
export async function fetchLuckyNumber(ssrFetcher?: SsrServerFetcher): Promise<number> {
  const fetcher = import.meta.env.SSR ? ssrFetcher : clientFetcher;
  const fetchConfig: SsrFetchConfig = {
    url: 'https://vise.com/random-num',
  };
  const result = await fetcher(fetchConfig).catch((error) => {
    // error handle
  }) as SsrFetchResultOf<{ value: number };

  if (result.code === 0) {
    return parseInt(String(result.data.value), 10);
  }
  throw `fetch fail: ${JSON.stringify(result)}`;
}
```
由于 fetch 返回值含有大量接口相关的数据格式，如请求是否成功等，不推荐在组件中直接使用。示例中的 `fetch` 调用了来时 `services.ts` 的 `fetchLuckyNum` 方法，并传入 SSR 阶段注入的 `SsrServerFetcher`。Service 层在 SSR 和 CSR 阶段调用对应的 fetcher，获取到 `SsrFetchResult` 后将处理过的数据返回调用方。

[hydration]: <https://vuejs.org/guide/scaling-up/ssr.html#client-hydration>
[tapable-hooks]: <./tapable-hooks.html>
