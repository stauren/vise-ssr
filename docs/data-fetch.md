---
layout: page
title: "Data Fetch & Transportation"
permalink: /data-fetch.html
lang: en
---

One the the most important topics in SSR is how to fetch the data needed for sever-side rendering, and how to transport that data to the client so that the page rendered in the server is isomorphic with client counterpart.

## Overall Design
![Data Flow](./images/data-flow.png)

## Data Flow
- For the data structure used in data transportation, please refer to [RenderContext](./key-data-types.html#rendercontext)
- **Data Fetch**: Needed data should be fetched in [tapable-hooks], normally in `beforeRender`. Because if fetch the data earlier, you may find the cache is available after an expensive data loading.
- **Store Data in RenderContext**: Fetched application initialization data should be should in `RenderContext.extra.initState`, all hooks in the downstream are able to access it from the context. It's worth to note that the initState should be a subset of the App's store's state, with a type of `DeepPartial<State>`.
- **Access Data During Render**: Data in the `RenderContext.extra.initState` will be used to initialize the store of `<app>`, which is created with UI libraries such as React or Vue.
- **Update Data During Render**: During the render process, `<app>` may commit new data into the store. This may cause [hydration mismatch]. Vise introduces `strictInitState` config, mainly mean to rise the awareness of developers about the risk.
  - strictInitState: configured in `vise.config.ts` and set to true by default.  In the default strict mode, Vise will ignore all changed made to the store during render, make sure rendering start from exact same state in both server and client side.
- **Send Data to the Client**: Initial State of app will be transported as a JavaScript global variable, embedded in a &lt;script&gt; tag in server-generated HTML.
- **Hydration on the client**: Vise will use the global variable to initialize the app's store, then try to [hydrate][hydration] the static html into a fully interactive app on the client.

### The Risk of disable strictInitState
Image there is a special component, the page header and page footer both use it. The component depends on a data in the store with the value of 'a'. During the rendering, someone changes the data in the store to 'b'. What will happen?

In a client side scenario, the change of data in the store will trigger another render, the outdated component in the header get updated.

But the SSR do NOT re-render! Once the header finishes rendering with the data of 'a', changing the store will not infect the generated HTML fragment, which leave the component in the header has a different view with the counterpart in the footer.

What will happen on the client side when this happens? If client app is initialized with the updated store, there will be a hydration mismatch because the component in the header will never match with a data not even in the store.

That's why Vise introduce `strictInitState` and set it to true by default. In the default mode, changes made to the store during the SSR will be ignored, to make sure both side start from the same point.

But sometimes you still want to keep the changed data, maybe because it is very expensive to get so you don't want to re-get it on the client. It is absolutely possible by setting `strictInitState` to false, and when you do that, you should know about the risk and make sure it's safe to do so.
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
    url: 'https://www.randomnumberapi.com/api/v1.0/random?min=1000&max=9999&count=1',
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
[hydration mismatch]: <https://vuejs.org/guide/scaling-up/ssr.html#hydration-mismatch>
[tapable-hooks]: <./tapable-hooks.html>
