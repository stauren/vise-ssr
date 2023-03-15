---
layout: page
title: "FAQ and Documents"
permalink: /doc-resource.html
lang: en
---

## Vise related npm packages
- [vise-ssr](https://www.npmjs.com/package/vise-ssr)
- [@vise-ssr/shared](https://www.npmjs.com/package/@vise-ssr/shared)
- [@vise-ssr/vue3](https://www.npmjs.com/package/@vise-ssr/vue3)
- [@vise-ssr/react](https://www.npmjs.com/package/@vise-ssr/react)
- [@vise-ssr/express-server](https://www.npmjs.com/package/@vise-ssr/express-server)
## FAQ
__1. Is is correct that using CSR only when data fetch fails in beforeRender hook?__

Not only when beforeRender fails.

Sometimes you can skip SSR to CSR when the server is too busy.


__2. My page has a loading effect, should I keep it after using SSR?__

Yes, the loading effect should be kept. Only the landing page is SSR, when user go to page b from page a, page b will be rendered in the browser so loading effect is still needed.

__3.If a page is completely rendered in the server side, why hydration mismatch happens? Hydration is the process of rendering a page from empty tempate and data in useSSRContext(), if the page does not fetch data in the client side, what are being matched?__

Hydration is a process during app initialization, which use data from window.Vise.initState to render vnodes, then compare those vnodes to see if they match the HTML generated in SSR. So, no data fetched in the client side is related.

__4. An API called in beforeRender hook relays on user id which comes from document.cookie. But no window.document object exits during SSR, how can I access information in the cookie?__

Cookie is an HTTP header could be accessed with renderContext.request.headers in Vise hooks. If cookie is needed in UI library like Vue or React, it could be accessed from their specific SSRContext.

Also noted that if generated HTML varies according to information in the cookie, that information must be part of cache key used in beforeUseCache hook.

__5. My page needs data from 3 APIs, one of them depends on user id, so I ignored it during SSR and loaded the API after page is mounted in the browser, a component will suddenly appear after page load, is that reasonable?__

In the above scenario, delay data fetch till page loaded could greatly increase cache hit rate and mitigate pressure on the server. So there is a balance between server pressure and user experience, you need to make that choice based on your needs.
