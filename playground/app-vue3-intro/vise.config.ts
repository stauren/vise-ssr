import type { ViseConfig } from 'vise-ssr';

const config: ViseConfig = {
  // scaffold of current app, such as 'vue3-app' or 'react-app'
  scaffold: 'vue3-app',

  /**
   * https://vitejs.dev/guide/build.html#public-base-path
   * overwrite viteConfig.base
   * Base public path, can be a path or a url, must end with '/'
   * if config as a url, server will ignore assets in bundle
   * if config as a relative path start with '/', server will serve assets with that path
   */
  base: '/',

  // allow mutation of store during SSR, see more:
  // https://stauren.github.io/vise-ssr/data-fetch.html#the-risk-of-disable-strictinitstate
  strictInitState: false,

  // default page title to be used if the page do not set it with SSRContext
  defaultTitle: 'Vise Powered App',

  // custom favicon url
  faviconLink: '',

  // embed lib-flexible into head tag
  useFlexible: false,

  // path of custom HTML template
  customTemplate: '',

  // vite user config
  viteConfig: {},

  // the http port used when runs `vise dev`
  devPort: 3000,

  // class names added to server-generated <html> tag's class attribute
  htmlClass: 'light',

  /**
   * HTML fragments appended to the <head> tag.
   * In certain scenarios <script> tag may need to be appended to the
   * start or end of the <head> tag, because SSR may change the contents
   * of the customTemplate <head>, this insert happens after render
   */
  htmlFixedPositionFragments: [],

  /**
   * pages in src/pages dir will be build as async chunks
   * pages in routerSyncPages will be load with eager config
   * https://vitejs.dev/guide/features.html#glob-import
   */
  routerSyncPages: [],

  /**
   * minify generated html with html-minifier-terser
   * pass bool or html-minifier-terser Options
   */
  htmlMinify: true,

  /**
   * routerBase of html pages, RegExp[] or string allowed
   * 1. for string type config, all request with base url will be processed with the render bundle
   * 2. for RegExp type config, multiple entries can be configured to access the same page
   * eg: [/(\/[\w-]+)?\/vise\/vue3-intro\//], (\/[\w-]+) is a variable part,
   * url.match(regExp)[0] is the dynamic routerBase。
   */
  routerBase: '/',

  // directive transform of Vue3
  directiveTransforms: {},
};
export default config;
