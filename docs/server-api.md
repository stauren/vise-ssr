---
layout: page
title: "Server Render"
permalink: /server-api.html
lang: en
---
## Render service in the server
Vise provide [express-server](https://github.com/stauren/vise-ssr/blob/main/packages/express-server) to host SSR service by default, and also support any custom Node.js HTTP server as long as it implements Vise's SSR bundle API.

If you need to implements your own HTTP SSR sever, you could continue reading.

## App bundle
After execute `vise build` in a Vise app directory, the generated bundles will be like this:

```shell
app-my-project
└── dist
    ├── client
    │   ├── index.html
    │   └── assets
    │       ├── module.hash.js
    │       ├── module.hash.css
    │       ├── some.png
    │       └── ...
    └── server
        ├── ssr-manifest.json
        ├── server-hooks.js
        └── entry-server.js
```

Files in `client` directory are used by end user's browser, and it's best to be deployed on CDN. In fact the `index.html` is the entry to a CSR [SPA](https://en.wikipedia.org/wiki/Single-page_application), which can be used as a fallback url when SSR service fails. If you want to generate CSR entries for all pages, `generateCsrHtml` in [vise.config.ts](./vise-config.html) could be used.

In the `server` directory, there is a  `ssr-manifest.json` which contains module's dependencies information, a `server-hooks.js` which contains app's server logic, a `entry-server.js` which is entry of the UI library framework's server render bundle. 

## Using Render bundle in TypeScript
Server can import as a `ViseRenderBundle`:
```typescript
import type { ViseRenderBundle } from 'vise-ssr';
const bundleOfApp = await import('/path/to/bundles/entry-server.ts') as ViseRenderBundle;
```
## API of Render bundle
Render bundle provide the following API from `ViseRenderBundle` type:
```typescript
type ViseRenderBundle = {
  render: SsrBundleRender;
};
```
The `render` function accepts an `RenderContext` type parameter, returns a `Promise<SsrBundleResult>`, the render hooks use the result to compose the final `RenderResult`;

### Control HTML generation from UI render bundle
The `SsrBundleResult`, which is the server render output, is as following:

```typescript
type SsrContext = {
  meta: RenderContextMeta,
  extra: JSONObject,
};

type SsrBundleSuccess = Record<'html', string> & SsrContext;
type SsrBundleResult = SsrBundleSuccess | RenderError;
```

Except the main render result `html`, there are also the `SsrContext` which controls how the page is generated. Generally developer puts their logic in the UI library page code, so it's convenient to control the overall HTML through change `SsrContext`. For example, page title is generated from `context.meta.title`, Vue user can change the context through `useSSRContext` hook, React user can use the `updateContext` function pass from page's attributes. 

```typescript
defineComponent({
  setup() {
    const context = useSSRContext();
    context.meta.title = 'My Page Title';
  },
  ...
});
```

If context needs to be updated after render, user can update the RenderContext then call `refillRenderResult` again.

### Accessing data from server hooks
In almost all server hooks, data could be changed and passed in the `RenderContext`. Data defined by Vise is in `RenderContext.meta`, user define data is passed in `RenderContext.extra`. Those data will be passed to UI library's SSRContext.

```typescript
export async function render(renderContext: RenderContext): Promise<SsrBundleResult> {
  // ...
  const ssrContext: SSRContext = {
    meta: renderContext.meta,
    extra: renderContext.extra,
  };
```

UI library can access data in the RenderContext and update them. Mind the extra has a type of `JSONValue`, only simple literal value allowed.

## Deploy Service
After implements APIs above and [tapable hooks](./tapable-hooks.html)'s HookLifeCycle, now the HTTP server is able to process user's request, render the HTML and provide SSR service.
