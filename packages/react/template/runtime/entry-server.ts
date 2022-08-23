import cookie from 'cookie';
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom/server.mjs'
import {
  SsrBundleResult,
  fillSsrTemplate,
  RenderContext,
  cloneDeep,
} from 'vise-ssr';
import { createStore } from '@/store';
import { createApp } from './main.tsx';
import { matchUrl } from './router.tsx';
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
  const { headers } = request;

  const cookies = cookie.parse(headers.cookie as string || '');
  const userAgent = headers['user-agent'] as string || '';

  const goToRoute = parseUrl(request.url);
  if (!matchUrl(goToRoute)) {
    return {
      code: 404,
      message: 'not found',
      detail: {
        reason: `${request.url} is not found on server`,
      },
    };
  }

  const store = createStore({
    ...(isObject(extra.initState) ? extra.initState : {}),
  });
  const beforeRenderInitState = cloneDeep({
    ...store.getState(),
  });

  const ssrContext = {
    cookies,
    userAgent,
    extra,
  };
  const reactApp = createApp({
    store,
    initUrl: goToRoute,
    ssrContext,
    Router: StaticRouter,
  });
  const app = await renderToString(reactApp);
  const stateToTransport = strictInitState
    ? beforeRenderInitState
    : store.getState();

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

  const preloadLinks = '';
  const html = template === '' ? '' : fillSsrTemplate({
    app,
    template,
    preloadLinks,
    html: '',
  }, {
    ...newExtra,
  });

  return {
    extra: newExtra,
    app,
    preloadLinks,
    template,
    html,
  };
}

/*
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
*/
