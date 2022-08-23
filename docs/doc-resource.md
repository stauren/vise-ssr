# Vise 系列 npm 包
- [vise-ssr](https://www.npmjs.com/package/vise-ssr)
- [@vise-ssr/express-server](https://www.npmjs.com/package/@vise-ssr/express-server)
- [@vise-ssr/plugin-foot-note](https://www.npmjs.com/package/@vise-ssr/plugin-foot-note)
- [@vise-ssr/plugin-render-error](https://www.npmjs.com/package/@vise-ssr/plugin-render-error)
- [@vise-ssr/plugin-ssr-render](https://www.npmjs.com/package/@vise-ssr/plugin-ssr-render)
- [@vise-ssr/vite-plugin-visecss](https://www.npmjs.com/package/@vise-ssr/vite-plugin-visecss)
- [@vise-ssr/vite-plugin-inline-entry-css](https://www.npmjs.com/package/@vise-ssr/vite-plugin-inline-entry-css)
# 常见问题
## CSR 数据加载相关
__1. 是不是只有在 beforeRender hook 中数据加载失败时，才去用 CSR 的方法加载呢？__

不只是。
在服务端 beforeRender 中数据加载失败的时候，有不同的处理方式，首先是上报和告警，如果大量的加载失败，开发人员必须要得到通知来查找问题。其次是 fallback 的手段，常用的有重试（当然得限定一定的次数，最好有指数衰退的策略避免雪崩），换备份接口（如 tRPC 换 HTTP 等）。如果都不行，那么这里需要在 RenderContext.error 中赋值相关的 RenderError，以跳过 render 阶段。在后续的 afterRender 和 beforeResponse 中，可以对这个类型为 error 的 RenderResult 进行相关的处理，通常的方式是 302 跳转到 CDN 的静态页面中去，或服务端直接吐出跟 CSR 一样的带空白数据和 HTML 的页面模板，后续肯定就是完全走 CSR 流程了。
在没有发生 beforeRender 中加载异常的时候，也仍然需要在页面组件中实现客户端的数据加载逻辑。这是因为，现代页面框架通常支持页面局部刷新，如点击链接后从页面 a 跳转页面 b，这个时候页面是不在服务端生成的，所以无论如何客户端都是需要实现数据加载逻辑的。

__2. 页面本来做了一个 loading 的逻辑，现在用 SSR 的话，还需要 loading 吗？因为目前这个 loading 包含了 fail 的状态，但是对于 ssr 来说 fail 就是使用csr?__

这个问题看了问题 1 的答案过后应该能推断出来，因为必然有 CSR 的场景，所以仍然应该支持 loading。

__3. 如果页面数据完全使用 ssr 返回的数据渲染的话，为什么还会出现 mismatch 呢？注水过程是把空的模板 + useSSRContext() 返回的数据渲染成页面，如果页面完全没有用到 CSR 再去拉接口的流程，这个 mismatch 是谁跟谁 mismatch 呢？__

hydration 是用 app 在使用初始化的通过 window.Vise.initState 传递的 store 数据逐个构建 vnode 并通过 vnode 生成 HTML 的过程中，用 vnode 与页面上已有的 HTML 进行对比，如果失败则发生 mismatch。所以，hydration 过程完全不涉及到 CSR 阶段的数据请求。

__4. 在 beforeRender 期间调用的接口要依赖用户 id，用户 id 应从 document.cookie 中获取，但是因为是 ssr 期间，所以不存在 document，但是 renderContext.request.header 里面是包含 cookie 的，这里的 cookie 可以直接用吗？__

可以直接用。并且取决于你在哪用，如果是 hooks 里面，那就是 renderContext.request.header，如果是 Vue 组件里面，那就是 useSSRContext() 中的 headers，记得用了之后，如果因为这个值导致生成的 html 不一样，那么需要在 beforeUseCache 中按用到的值生成 cache key；

__5. 目前我的页面加载了三个接口，其中一个依赖用户 id, 如果 SSR 的时候忽略依赖 id 那个接口的话，首屏会少一部分，之后走 CSR 的时候也会加载那个接口，但是就会出现页面突然跳出一部分组件，这合理吗？__

 这种千人千面的组件，如果是非首屏的，建议做 CSR 的延迟加载，这样可以大幅提升 SSR 缓存命中率；如果是首屏且关键，那么只能放弃通用缓存，把用户 id 作为缓存 key，这样缓存只能对同一个用户再次访问生效了；
