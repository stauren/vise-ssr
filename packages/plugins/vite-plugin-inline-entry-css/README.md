# @vise-ssr/vite-plugin-inline-entry-css

本插件的功能就是通过检查 Vite 构建产物 manifest.json 清单文件，找到客户端构建入口文件 index.html 所依赖的 css 文件列表，将其内容合并插入到 html 的 `<head>` 中，并将 html 中原对应的 css 外链 link 元素全部删除。

## 使用

在 Vite 支持的项目配置文件中直接引入即可：

```ts
import visePostHtmlPlugin from '@vise-ssr/vite-plugin-inline-entry-css';

export default {
  // ...
  build: {
    // 必须，本插件依赖这个生成的 manifest.json 清单文件
    manifest: true,
  },
  plugins: [
    // ...
    // 本插件对顺序暂无要求，因为实在 writeBundle 钩子里才去做的
    // 文档： https://rollupjs.org/guide/en/#writebundle
    viteInlineEntryCssPlugin(),
  ],
}
```

## 说明

本插件目前只兼容项目根目录下一个 index.html 的项目构建，多页面入口暂未支持。

多页面及 index.html 构建入口参见 Vite 官方文档：
+ [build.outdir](https://cn.vitejs.dev/config/#build-outdir)
+ [index.html 与项目根目录](https://cn.vitejs.dev/guide/#index-html-and-project-root)
+ [多页面应用模式](https://cn.vitejs.dev/guide/build.html#multi-page-app)
