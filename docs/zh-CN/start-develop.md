-
-
layout: page
title: "开始开发"
permalink: /zh-CN/start-develop.html
---
## 名词解释
- SSR、CSR、同构的解释请参考 [Server-Side Rendering Guide
](https://vuejs.org/guide/scaling-up/ssr.html)

## 前置依赖
- 安装 nvm： 参考 [nvm官网](https://github.com/nvm-sh/nvm)，mac 下推荐使用 [brew](https://brew.sh/) 进行安装：
  ```shell
  $ brew install nvm
  ```
- 安装 Node.js@16+ 并设置为默认 node，以便使用 npm@7+：
  ```shell
  $ nvm install 16
  $ nvm alias default 16
  $ nvm use 16
  ```
## 安装 Vise
使用 Vise 开发项目，推荐全局安装 vise npm 包
`npm install -g vise-ssr`

## 搭建第一个 Vise 项目 (App)
- 如使用 monorepo, 在 workspaces 中执行 
- 如未用 monorepo, 在根目录执行
  ```shell
  $ vise create
  ？ 请选择项目类型
  > vue3-app
  ？ 是否在 xx/xx/xx 下创建目录
  > true
  ? 项目名称
  > my-project
  ? 请输入项目信息（上下箭头切换） 
                            Author : $user
                       Description : a Vise SSR project
      DevPort(开发时使用的 http 端口) : 3000
                            默认标题 : Vise App
  ```
- 完成问答配置文件后，会有如下提示表示项目生成，以及快速开发提示
  ```shell
  ✔ 📄  Created public
  ✔ 📄  Created vise.config.ts
  ✔ 📄  Created tsconfig.json  
  ✔ 📄  Created vitest.config.ts
  ✔ 📄  Created .eslintrc.cjs
  ✔ 📄  Created package.json
  ✔ 📄  Created src  
  [vise]: 🎉  app-my-project 创建成功   

  [vise]: 👉  使用以下指令开始快速开发:

  $ cd app-my-project
  $ npm install
  $ npm run dev          
  ```

## 开发调试
- 初始化项目
  ```shell
    $ yarn install 
    // npm 亦可
    $ npm install 
  ```
- 在 app-my-project 目录执行 
  ```shell
  $ npm run dev
  ```
  即可开始使用 [Vite][vite] 进行开发调试。

## 项目构建
### Vue 业务项目构建
- 在 app-my-project 目录执行 
  ```shell
  $ vise build
  ```
  即可对 app 项目进行构建打包，打包后将得到可以部署在 CDN 的 client bundle 及需要部署在 server 端的 server bundle。

## 启动服务
### 启动 express-server 服务
- 构建完成后，在 app-my-project 目录执行 
  ```shell
  $ npm run serve
  ```
  即可启动服务，访问 [http://localhost:3000](http://localhost:3000) 即可查看页面。

## App 目录结构
```shell
app-my-project                   // 某个业务项目根目录
├── package.json
├── public                       // 通过 url 引用的图片等静态资源
│   ├── favicon.ico
│   └── some.png
├── src
│   ├── assets                   // 通过 import 引用的图片等静态资源
│   │   └── logo.png
│   ├── utils                    // 功能函数
│   │   └── my-function.ts
│   ├── composable               // composition 组件
│   │   └── use-my-composable.ts
│   ├── components               // 组件
│   │   └── my-component.vue
│   ├── data
│   │   ├── my-article.txt
│   │   └── my-data.json
│   ├── pages                     // 页面，名称与 url 路径一一对应
│   │   ├── index.vue
│   │   └── page-a.vue
│   ├── services                  // 页面、组件依赖的接口、JsBridge
│   │   └── index.ts
│   ├── store                     // vuex
│   │   ├── actions.ts
│   │   ├── index.ts
│   │   ├── mutation-types.ts
│   │   ├── mutations.ts
│   │   └── state.ts
│   ├── server-hooks.ts           // 服务端 hooks，可在此注入 app 的预取数据等逻辑
│   └── app.vue                   // App 入口
└── types                         // 类型声明
│   └── index.d.ts
├── tsconfig.json
└── vise.config.ts                // vise 配置文件

```
- app.vue 为整个项目入口，内置 `<router-view>` 路由根据 url 渲染不同页面。Vise 没有设计 layout 层。如有多个页面共用样式，可以直接在 app.vue 入口中自行实现相关逻辑。
- pages 目录中的 vue 文件将渲染为 router-view 中的路由，访问 url 与文件名一一对应，如 `page-a.vue` 将对应 `https://example.com/path/to/root/page-a/`，文件名使用 kebab-case 命名方式

[vite]: <https://vitejs.dev/>
