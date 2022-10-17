---
layout: page
title: "Quick Start"
permalink: /start-develop.html
lang: en
---
## Glossary
- For the meaning of SSR, CSR, isomorphic, please refer to [Server-Side Rendering Guide](https://vuejs.org/guide/scaling-up/ssr.html)

## Install dependencies
Vise depends on Node@16, installing by nvm is recommended.
- Install nvm: follow the instruction on [nvm](https://github.com/nvm-sh/nvm) website, [brew](https://brew.sh/) can be used to install nvm in Mac:

```shell
$ brew install nvm
```
- Install Node.js@16+ and set it as default version:

```shell
$ nvm install 16
$ nvm alias default 16
$ nvm use 16
```

## Install Vise
Install vise globally by npm or any other package manage tools you like:
```shell
  npm install -g vise-ssr
```

## Create Vise App
Use the interactive `vise create` command to create your app:
  ```shell
  $ vise create
  ？ Please Choose app scaffold:
  > vue3-app
  ？ Create app in xx/xx/xx
  > true
  ? Please input app name
  > my-project
  ? Please input app information (Use arrow to move up and down)
                            Author : $user
                       Description : a Vise SSR project
                          DevPort  : 3000
                     Default Title : Vise App
  ```
Then you will see the app created notice and develop guide:
  ```shell
  ✔ 📄  Created public
  ✔ 📄  Created vise.config.ts
  ✔ 📄  Created tsconfig.json  
  ✔ 📄  Created vitest.config.ts
  ✔ 📄  Created .eslintrc.cjs
  ✔ 📄  Created package.json
  ✔ 📄  Created src  
  [vise]: 🎉  app-my-project Created.

  [vise]: 👉  Use following commands to start develop:

  $ cd app-my-project
  $ npm install
  $ vise dev          
  ```

## Start developing
Install dependencies with the tool you like:
```shell
  $ pnpm install 
  // or
  $ yarn install 
  // or
  $ npm install 
```
Stat develop server:
```shell
$ npm run dev
```
Now a [Vite][vite] dev server in listen on http://localhost:3000/, visit it in your browser, you'll see the welcome page.

## App build
### Build with vise build command
Build the app with the following command:
```shell
$ npm run build
```
After the command finish running, there will be 3 generated bundles:
- client bundle: the SPA part of the app loaded in the client browser
- server bundle: aka server render bundle, which transform an app into string or Stream
- vise hooks bundle: app's specific server logic in [vise hooks](./tapable-hooks.html)

```shell
dist
├── client // the client bundle, SPA part of the app
│   ├── assets
│   │   ├── index-legacy.280756ab.js
│   │   ├── index-legacy.280756ab.js.map
│   │   ├── index.e273c818.js
│   │   ├── index.e273c818.js.map
│   │   ├── index.fbec640d.css
│   │   └── polyfills-legacy.d3b85c2f.js
│   ├── index.html
│   ├── logo.svg
│   └── manifest.json
└── server
    ├── assets
    │   ├── formatters.0a15ac5e.js
    │   └── formatters.0a15ac5e.js.map
    ├── entry-server.js // server bundle of SSR
    ├── entry-server.js.map
    ├── logo.svg
    ├── server-hooks.js // server hooks bundle for app serve logic
    ├── server-hooks.js.map
    └── ssr-manifest.json
```

## Serve App
Serve built app with built-in express server:
```shell
$ npm run serve
```
It is possible to use your own HTTP server to serve the built bundles as long as it [implement the Vise SSR Serve API](https://github.com/stauren/vise-ssr/issues/3)

It is also possible to deploy multiple apps on the same server. Execute the command to find more: `./node_modules/.bin/vise-express help start`

## App Directory Structure
```shell
app-my-project                   // app root
├── package.json
├── public                       // static assets referred by url
│   ├── favicon.ico
│   └── some.png
├── src
│   ├── assets                   // static assets referred by import
│   │   └── logo.png
│   ├── utils
│   │   └── my-function.ts
│   ├── composable
│   │   └── use-my-composable.ts
│   ├── components
│   │   └── my-component.vue
│   ├── data
│   │   ├── my-article.txt
│   │   └── my-data.json
│   ├── pages                     // the page name maps to the public url
│   │   ├── index.vue
│   │   └── page-a.vue
│   ├── services
│   │   └── index.ts
│   ├── store
│   │   ├── actions.ts
│   │   ├── index.ts
│   │   ├── mutation-types.ts
│   │   ├── mutations.ts
│   │   └── state.ts
│   ├── server-hooks.ts           // app server logic
│   └── app.vue                   // app entry
└── types
│   └── index.d.ts
├── tsconfig.json
└── vise.config.ts                // main config of vise

```
Files in `src/pages` directory will map to public urls.

[vite]: <https://vitejs.dev/>
