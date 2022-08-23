export const IS_SSR = import.meta.env.SSR;
export const ENV = import.meta.env;

// Auto generates routes from vue files under ./pages
// https://vitejs.dev/guide/features.html#glob-import

// 默认异步模式
// eslint-disable-next-line operator-linebreak
export const appPages =
  // <!--START_APP_PAGES
  // 内容会被替换，url 只为示意
  import.meta.glob('src/pages/*.vue');
  // END_APP_PAGES-->

// 同步模式
// eslint-disable-next-line operator-linebreak
export const syncAppPages =
  // <!--START_SYNC_APP_PAGES
  // 内容会被替换，url 只为示意
  import.meta.globEager('src/pages/*.vue');
  // END_SYNC_APP_PAGES-->
