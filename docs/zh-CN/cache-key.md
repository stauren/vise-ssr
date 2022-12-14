---
layout: page
title: "SSR 缓存及唯一 key"
permalink: /zh-CN/cache-key.html
---
为提升 SSR 服务器性能，将生成的 HTML 页面放入缓存以便后续请求到达时直接使用是非常有效的，为了能有效利用缓存，应用需要一个有效的方式与服务沟通缓存适用场景，Vise 使用唯一缓存 key 来实现这一点。

## 生成缓存唯一 key
### 通过 beforeUseCache hook 返回 CacheInfo
[tapable-hooks](./tapable-hooks.html) 中定义了多个跟 SSR 缓存相关的 hooks:
- beforeUseCache: 在服务器准备查询缓存前调用，返回的 CacheInfo 中包含缓存唯一 key、缓存有效期等信息
- findCache: 服务器查询缓存时调用，可以由服务器开发者或者业务 App 开发者实现，通过参数的的 App（客户端）唯一 key 配合服务端唯一 key 逻辑（如当前部署版本号），生成缓存 key，去第三方缓存服务等中查询到结果后返回
- hitCache: 缓存命中时调用，可做统计等
- afterRender: 页面渲染成功，根据 context 中的 CacheInfo 信息，使用最新生成的 HTML 更新缓存

### 通过 beforeUseCache 提供唯一缓存 key
```typescript
const serverHooks: ViseHooks = {
  // ...
  beforeUseCache: async (renderRequest) => {
    const { url, headers } = renderRequest.request;
    const userAgent = headers['user-agent'] || '';

    // suppose generated html depends on browser is chrome or not
    const browser = userAgent.indexOf('Chrome') > -1 ? 'chrome' : 'other';

    return {
      key: `${browser}_${url}`,
      expire: Date.now() + 3600 * 1000,
      stale: true,
      context: renderRequest,
    };
  },
  // ...
};
```
`beforeUseCache` 接收 `HTTPRequest` 参数，包含 HTTP 请求中的 url 和请求头，在示例中根据请求头中的 `user-agent` 参数判断请求是否来自 Chrome 浏览器，同时从 `url` 中解析到请求对应的具体页面，返回了由浏览器信息和页面名称组合而成的唯一 key，在下一次从同样浏览器发起的对同一个页面的请求，将生成同一个缓存 key。

## 典型的影响页面 HTML 缓存的因素
### 具体请求页面  
该信息可以从 `url` 解析获得，显然不同页面的 HTML 内容是不同的，缓存应该至少基于所请求页面
### 页面 query 参数
该信息可以从 `url` 解析获得，如果页面 HTML 内容依赖 url 上的 query 参数，那么应该在缓存 key 中包含相关参数信息
### 请求头中的浏览器信息
如果生成的 HTML 因为不同的浏览器种类、版本有不同的结果，那么应该在缓存 key 中包含相关信息。注意不要使用整个请求头或者整个 `userAgent` 字符串作为缓存 key，应该使用你所依赖的特性，例如 `iOS12+` 和 `iOS12-`，否则会因为特殊性太高而导致缓存几乎没有重用机会，命中率极低。
### 请求头中的 Cookie 信息
典型的场景是每个用户看到的页面是不同的，但是每个用户看到的页面在一定时间内，是一致的。那么可以将 Cookie 中的用户唯一 id 包含在缓存 key 中。注意不要使用整个请求头或者整个 Cookie 作为缓存 key，否则会因为特殊性太高导致缓存几乎没有重用机会，命中率极低。

## 防止缓存错误结果
在 SSR 构建页面过程中，可能会发生诸如接口超时等错误，此时构建出来的是一个带有错误信息或者空白内容的页面，可能需要在浏览器端重试接口后重新渲染页面。

在这种情况下，必须阻止服务端缓存此错误页面，以免把临时网络抖动的异常页面提供给后续的大量可以本来可以看到正常页面的用户。Vise 通过 `useSSRContext`，让 Vue 通知设置 `ssrContext.meta.cache = false;` 服务器，不要缓存此页面：
```typescript
// comePageOrComponent.vue
export default defineComponent({
  setup() {
    const ssrContext = useSSRContext();
    //... fetch & init the page, some error happens
    ssrContext.meta.cache = false;
  }
});
```
与上面类似，除了在 render 阶段，在其它 hooks 中也可以通过主动设置 `RenderContext.meta.cache` 来控制缓存。
## 对 App 开发者管理 header 和 url 的建议
在应用中，Vue 页面或组件在 SSR 阶段可以从 router 获取 url 相关信息，从 useSSRContext 中获取请求头相关信息；生成缓存 key 的逻辑配置在 `server-hooks.ts` 文件中。如果不加以妥善管理，非常有可能出现如下场景：
- 某页面或组件读取了 url 或 header，生成了特定的 HTML 内容，却并没有将对相关信息的依赖加入配置文件的 `beforeUseCache` 逻辑中
- 服务端使用 `beforeUseCache` 返回的 key，缓存页面 HTML
- 下一个用户使用不同的 url 或 header 访问页面时，`beforeUseCache` 返回了同样的缓存 key，服务器端判断命中缓存，返回缓存页面
- 当页面加载到新用户的浏览器中之后，Vue 等 UI 框架开始进行 [Client Side hydration](https://v3.vuejs.org/guide/ssr/hydration.html)，检测到服务端与客户端生成 HTML 内容不一致，触发 hydration mismatch 错误，整页重绘。

综上，建议 App 开发者对 url 及 headers 信息的使用进行相关规范，并确保依赖的信息在 `beforeUseCache` 的逻辑中体现。一个可能的方式是，所有的页面和组件获取 url 和 headers 信息经过一个过滤函数处理，此函数在 `beforeUseCache` 中重用，确保缓存 key 与页面和组件获得同样多的信息。

## 服务端具体的缓存实现
服务端应该根据业务性质，设置具体的缓存类型，如 Redis、数据库、文件缓存等；同时设置符合业务逻辑的缓存过期时间。
