import cookie from 'cookie';
import { renderToString, SSRContext } from 'vue/server-renderer';
import {
  SsrBundleResult,
  fillSsrTemplate,
  RenderContext,
  cloneDeep,
} from 'vise-ssr';
import { createApp } from './main';
// do NOT remove the comment below
// <!--START_TPL_REPLACE
const manifest = {};
const template = '';
// END_TPL_REPLACE-->
// <!--START_CONF_REPLACE
const strictInitState = true;
// END_CONF_REPLACE-->

type ManifestList = Record<string, Array<string>>;
function isObject(value: unknown): value is Record<string, any> {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function isPrimitive(value: unknown): boolean {
  return value === null
    || value === undefined
    || typeof value === 'string'
    || typeof value === 'bigint'
    || typeof value === 'boolean'
    || typeof value === 'symbol'
    || typeof value === 'number';
}

export function parseUrl(url: string) {
  const [path = '', query = ''] = url.split('?');
  if (!query) return path;
  const groups = query.split('&');
  const decode = (str = '') => decodeURIComponent(str.replace(/\+/g, ' '));
  const queryFinal = groups.reduce((accumulator: string, str) => {
    const [key, val] = str.split('=');
    if (accumulator) {
      return `${accumulator}&${decode(key)}=${decode(val)}`;
    }
    return `${decode(key)}=${decode(val)}`;
  }, '');
  return `${path}?${queryFinal}`;
}

export async function render(renderContext: RenderContext): Promise<SsrBundleResult> {
  const { request, extra } = renderContext;
  const { routerBase = '/' } = extra;
  const { app: vueApp, router, store } = createApp(routerBase);
  const { headers } = request;

  const cookies = cookie.parse(headers.cookie as string || '');
  // 'user-agent often used in the SSR initialization phase
  const userAgent = headers['user-agent'] as string || '';
  router.$ssrContext = {
    headers,
  };

  const goToRoute = parseUrl(request.url);
  if (router.resolve(goToRoute).matched.length === 0) {
    return {
      code: 404,
      message: 'not found',
      detail: {
        reason: `${request.url} is not found on server`,
      },
    };
  }

  // set the router to the desired URL before rendering
  router.push(goToRoute);
  await router.isReady();

  const beforeRenderInitState = cloneDeep({
    ...store.state,
    ...(isObject(extra.initState) ? extra.initState : {}),
  });
  store.replaceState(cloneDeep(beforeRenderInitState));

  // passing SSR context object which will be available via useSSRContext()
  // @vitejs/plugin-vue injects code into a component's setup() that registers
  // itself on ctx.modules. After the render, ctx.modules would contain all the
  // components that have been instantiated during this render call.
  const ssrContext: SSRContext = {
    cookies,
    userAgent,
    ...extra,
  };
  const app = await renderToString(vueApp, ssrContext);
  const stateToTransport = strictInitState
    ? beforeRenderInitState
    : store.state;

  // the SSR manifest generated by Vite contains module -> chunk/asset mapping
  // which we can then use to determine what files need to be preloaded for this
  // request.
  // manifest will be injected in MACRO-like way at build time.
  const preloadLinks = renderPreloadLinks(ssrContext.modules, manifest);
  const newExtra = Object.keys(ssrContext).reduce((lastValue, key) => {
    if (isPrimitive(ssrContext[key])) {
      return {
        ...lastValue,
        [key]: ssrContext[key],
      };
    }
    return lastValue;
  }, {
    initState: stateToTransport,
    title: '',
    noCache: ssrContext.noCache === true,
  });

  const html = template === '' ? '' : fillSsrTemplate({
    app,
    template,
    preloadLinks,
    html: '',
  }, {
    ...newExtra,
  });

  router.$ssrContext = undefined;

  return {
    extra: newExtra,
    app,
    preloadLinks,
    template,
    html,
  };
}

function renderPreloadLinks(modules: Set<string>, manifest: ManifestList) {
  let links = '';
  const seen = new Set();
  const manifestWithoutLegacy: ManifestList = Object.keys(manifest).reduce(
    (previousValue: any, key: string) => {
      const nonLegacyAssets = manifest[key].filter((asset: string) => !asset.includes('-legacy.'));
      return Object.assign(previousValue, { [key]: nonLegacyAssets });
    },
    {},
  );
  modules.forEach((id) => {
    const files = manifestWithoutLegacy[id];
    if (files) {
      files.forEach((file) => {
        if (!seen.has(file)) {
          seen.add(file);
          links += renderPreloadLink(file);
        }
      });
    }
  });
  return links;
}

function renderPreloadLink(file: string): string {
  if (file.endsWith('.js')) {
    return `<link rel="modulepreload" crossorigin href="${file}">`;
  } if (file.endsWith('.css')) {
    return `<link rel="stylesheet" href="${file}">`;
  } if (file.match(/\.(woff2?)$/)) {
    return `<link rel="preload" href="${file}" as="font" type="font/${RegExp.$1}" crossorigin>`;
  } if (file.match(/\.(jpe?g|gif|png)$/)) {
    const type = RegExp.$1 === 'jpg' ? 'jpeg' : RegExp.$1;
    return `<link rel="preload" href="${file}" as="image" type="image/${type}">`;
  }
  // TODO
  return '';
}