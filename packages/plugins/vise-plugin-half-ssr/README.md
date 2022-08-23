## 概述
该插件用于处理vise ssr框架中，配置了halfSSR模式的渲染

## 详解
该 plugin 实现 `hooks.render` hook,处理配置了halfSSR模式的渲染，此时将页面初始数据塞到页面插桩中
