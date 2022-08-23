## 概述
该 plugin 通过App 开发者提供的 vue3 Server RenderContext Bundle，基于`@vue/server-renderer`实现服务端渲染，得到渲染好的html模版

## 详解

### Vue3SSRPlugin 入参
因渲染依赖 App 开发者提供的 vue3 Server RenderContext Bundle，故需要传入业务打包后的entryServerPaths（该路径为绝对路径）

### 子进程渲染机制
通过 forkRenderProcess 创建子进程，

### renderHook
vue3SSRPlugin实例上的该方法用于吐出 render hook，通过hookConfig传入，再render hook周期会被调用，从而触发vue3SSRPlugin实例上的render方法，
发消息给子进程，交由子进程进行渲染，并将渲染结果发消息给主进程

