import path from 'node:path';
import { getAppVisePath } from './path';

type InjectorConfig = {
  placeholder: string,
  isProduction: boolean,
};

async function titlePlaceholderInjector(rootElement: Document, { placeholder }: InjectorConfig) {
  // 删除自带title标签
  const titleDom = rootElement.querySelector('title');
  if (titleDom) {
    titleDom.parentElement?.removeChild(titleDom);
  }
  const titlePlaceholder = rootElement.createComment(placeholder);
  rootElement.head.appendChild(titlePlaceholder);
}

async function htmlClassPropertyPlaceholderInjector(
  rootElement: Document,
  { placeholder }: InjectorConfig,
) {
  rootElement.documentElement.setAttribute(placeholder, '');
}

async function faviconLinkPropertyPlaceholderInjector(
  rootElement: Document,
  { placeholder }: InjectorConfig,
) {
  const linkDoms = rootElement.querySelectorAll('link');
  const favIconLink = Array.from(linkDoms).find((link) => link.getAttribute('rel') === 'icon');
  // 存在favIconLink， 直接在里面加属性
  if (favIconLink) {
    favIconLink.setAttribute(placeholder, '');
  } else {
    const faviconLinkDom = rootElement.createElement('link');
    faviconLinkDom.setAttribute('rel', 'icon');
    faviconLinkDom.setAttribute(placeholder, '');
    rootElement.head.appendChild(faviconLinkDom);
  }
}

async function partialFlexiblePlaceholderInjector(
  rootElement: Document,
  { placeholder }: InjectorConfig,
) {
  const partialFlexiblePlaceholder = rootElement.createComment(placeholder);
  rootElement.head.appendChild(partialFlexiblePlaceholder);
}

async function preloadLinksPlaceholderInjector(
  rootElement: Document,
  { placeholder }: InjectorConfig,
) {
  const preloadLinksPlaceholder = rootElement.createComment(placeholder);
  rootElement.head.appendChild(preloadLinksPlaceholder);
}

async function initStatePlaceholderInjector(
  rootElement: Document,
  { placeholder }: InjectorConfig,
) {
  const initStatePlaceholder = rootElement.createComment(placeholder);
  const appDOM = rootElement.querySelector('#app');
  if (appDOM) {
    appDOM.after(initStatePlaceholder);
  } else {
    rootElement.head.appendChild(initStatePlaceholder);
  }
}

async function appPlaceholderInjector(rootElement: Document, { placeholder }: InjectorConfig) {
  let rootDom = rootElement.querySelector('#app');
  if (rootDom) {
    rootDom.innerHTML = `<!--${placeholder}-->`;
  } else {
    rootDom = rootElement.createElement('div');
    rootDom.id = 'app';
    rootDom.innerHTML = `<!--${placeholder}-->`;
    rootElement.body.appendChild(rootDom);
  }
}

async function entryScriptInjector(rootElement: Document) {
  const entryScript = rootElement.createElement('script');
  entryScript.type = 'module';
  entryScript.src = path.join(
    getAppVisePath({ isUrlPath: true }),
    'entry-client.ts',
  );
  rootElement.body.appendChild(entryScript);
}

async function startingViseInjector(rootElement: Document) {
  const startingScript = rootElement.createElement('script');
  const textNode = rootElement.createTextNode('window.Vise = {};');
  startingScript.appendChild(textNode);
  rootElement.head.insertBefore(startingScript, rootElement.head.firstChild);
}

export default [
  {
    injector: htmlClassPropertyPlaceholderInjector,
    placeholder: 'ssr-html-class',
  },
  {
    injector: faviconLinkPropertyPlaceholderInjector,
    placeholder: 'ssr-favicon-link',
  },
  {
    injector: titlePlaceholderInjector,
    placeholder: 'ssr-title',
  },
  {
    injector: partialFlexiblePlaceholderInjector,
    placeholder: 'ssr-partial-flexible',
  },
  {
    injector: preloadLinksPlaceholderInjector,
    placeholder: 'ssr-preload-links',
  },
  {
    injector: initStatePlaceholderInjector,
    placeholder: 'ssr-init-state',
  },
  {
    injector: appPlaceholderInjector,
    placeholder: 'ssr-app',
  },
  {
    injector: entryScriptInjector,
    placeholder: '',
  },
  {
    injector: startingViseInjector,
    placeholder: '',
  },
];
