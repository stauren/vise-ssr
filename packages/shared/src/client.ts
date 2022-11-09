import type { UserConfig } from 'vite';
import type { CompilerOptions } from '@vue/compiler-core';
import type { Options as HtmlMinifierTerserOptions } from 'html-minifier-terser';

type SupportedScaffold = 'vue3-app' | 'react-app';

// Basic types
type Primitive =
  | bigint
  | boolean
  | null
  | number
  | string
  | symbol
  | undefined;
type PlainObject = Record<string, Primitive>;
type JSONValue = Primitive | JSONObject | JSONArray;
type JSONArray = Array<JSONValue>;
type JSONObject = {
  [key: string]: JSONValue;
};
type HttpHeaders = Record<string, string | string[] | undefined>;

export interface HtmlFixedPositionFragment {
  position: 'headEnd' | 'headStart';
  content: string | (() => string);
}

type ViseConfigVue3 = {
  directiveTransforms: CompilerOptions['directiveTransforms'],
};

type ParsedViseConfig = ViseConfigVue3 & {
  // scaffold of current app, such as 'vue3-app' or 'react-app'
  scaffold: SupportedScaffold,

  /**
   * https://vitejs.dev/guide/build.html#public-base-path
   * overwrite viteConfig.base
   * Base public path, can be a path or a url, must end with '/'
   * if config as a url, server will ignore assets in bundle
   * if config as a relative path start with '/', server will serve assets with that path
   */
  base: string,

  // allow mutation of store during SSR, see more:
  // https://stauren.github.io/vise-ssr/data-fetch.html#the-risk-of-disable-strictinitstate
  strictInitState: boolean,

  // default page title to be used if the page do not set it with SSRContext
  defaultTitle: string,

  // custom favicon url
  faviconLink: string,

  // embed lib-flexible into head tag
  useFlexible: boolean,

  // path of custom HTML template
  customTemplate: string,

  // vite user config
  viteConfig: UserConfig,

  // the http port used when runs `vise dev`
  devPort: number,

  // class names added to server-generated <html> tag's class attribute
  htmlClass: string | (() => string),

  /**
   * HTML fragments appended to the <head> tag.
   * In certain scenarios <script> tag may need to be appended to the
   * start or end of the <head> tag, because SSR may change the contents
   * of the customTemplate <head>, this insert happens after render
   */
  htmlFixedPositionFragments: HtmlFixedPositionFragment[],

  /**
   * pages in src/pages dir will be build as async chunks
   * pages in routerSyncPages will be load with eager config
   * https://vitejs.dev/guide/features.html#glob-import
   */
  routerSyncPages: string[],

  /**
   * minify generated html with html-minifier-terser
   * pass bool or html-minifier-terser Options
   */
  htmlMinify: HtmlMinifierTerserOptions | boolean,

  /**
   * routerBase of html pages, RegExp[] or string allowed
   * 1. for string type config, all request with base url will be processed with the render bundle
   * 2. for RegExp type config, multiple entries can be configured to access the same page
   * eg: [/(\/[\w-]+)?\/vise\/vue3-intro\//], (\/[\w-]+) is a variable part,
   * url.match(regExp)[0] is the dynamic routerBase。
   */
  routerBase: RegExp[] | string,
};

export type {
  PlainObject,
  JSONValue,
  JSONArray,
  JSONObject,
  SupportedScaffold,
  HttpHeaders,
  ParsedViseConfig,
};

export {
  toKebab,
  replaceContentBetweenMarks,
  replacePlaceholderWithValue,
  getPlaceholderOf,
} from './strings';

export { default as mergeConfig } from './merge-config';
