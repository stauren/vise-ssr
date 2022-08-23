[[toc]]
## 介绍
Vise 提供了内置的命令行工具，支持项目从创建 → 开发 → 构建 → 提供服务的全生命周期支持。

## 命令行种类

### vise create
生成一个新页面主体框架，快速创建新页面。使用 enquirer + ora + chalk + google zx 提供更好的交互体验，支持用户配置基础文件，默认支持 Vue3，更多页面框架支持中

### vise dev
开启 dev-server，使用浏览器 esm 模板，免打包，即用即转义即加载，项目秒启动迅速开发。支持根目录执行可选启动目录

### vise build
打包出项目 server、client 文件。client 包为直接部署在静态 CDN 服务器上的文件，供浏览器加载，server 包主要包含用户当前访问页面的 preload 标签的 `ssr-manifest.json`、当前业务 app 所有服务端逻辑的 `server-hooks.js`，以及以 `entry-server.js`来完成 SSR 的渲染

### vise serve
基于 [@vise-ssr/express-server](https://www.npmjs.com/package/@vise-ssr/express-server) 开发，提供 Vise 框架中的基于 Express 的 HTTP 服务，支持如下调用方式
#### 基本用法
```shell
$ vise serve [options] <viseAppDir>
```
- 1. vise serve: 适用于 Vise 单应用项目中运行，注意要先在项目内进行 vise build
```shell
$ vise serve 
  目录格式：
  app-single-vise-app
    ├── dist
    │   ├── client
    │   └── server
    ├── package.json
    ├── src
    ...
  ```
- 2. vise serve ./path/to/app-single-vise-app: 指定项目启动 vise serve，适用于单应用项目，注意要先在项目内进行 vise build
```shell
$ vise serve ./path/to/app-single-vise-app
  目录格式：
  app-single-vise-app
    ├── dist
    │   ├── client
    │   └── server
    ├── package.json
    ├── src
    ...
```
- 3. vise serve ./path/to/vise-app-bundles: 传入一个支持多应用的部署路径，适用于多应用部署
```shell
$ vise serve ./path/to/vise-app-bundles
  目录格式：
  vise-app-bundles (该级目录名称随意)
  ├── my-vise-app-a
  │   ├── client
  │   ├── server
  │   └── package.json
  ├── my-vise-app-b
  │   ├── client
  │   ├── server
  │   └── package.json
  ...
```

#### 参数支持
```shell
  -p, --port <port>                 server listen port (default: "3000")
  -c, --enable-cache <trueOrFalse>  enable server cache (default: "true")
  -r, --repeat-render <times>       repeat ssr for benchmark test (default: "0")
```



### vise genereate
支持 SSG ，跟据用户配置生成静态 HTML 页面，支持定时渲染含有动态数据的网站

## Vise 命令行总体设计图
![Vise SSR framework 整体设计](/command-line.png)

