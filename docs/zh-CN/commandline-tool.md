---
layout: page
title: "命令行工具"
permalink: /zh-CN/commandline-tool.html
---
Vise 提供了内置的命令行工具，支持项目从创建 → 开发 → 构建 → 提供服务的全生命周期支持。

## 命令行种类

### vise create
使用交互式命令行提示创建新项目，目前支持 Vue3 和 React

### vise dev
启动支持 SSR 的 vite 开发服务器

### vise build
使用 vite build 构建 SSR 项目产物供生产部署，生成以下3个包：
- Server Bundle: 所使用的页面框架的服务端渲染包
- Client bundle: 所使用的页面框架的客户端包，供浏览器加载
- Vise hook bundle: Tapped function 形式的项目的 vise-hooks 服务端生命周期中的逻辑

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

## Vise 命令行总体设计图
![Vise 命令行工具整体设计](../images/command-line.png)

