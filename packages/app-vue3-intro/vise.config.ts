import type { ViseConfig } from 'vise-ssr';

const config: ViseConfig = {
  htmlClass: 'light',
  devPort: 3000,
  base: '/',
  strictInitState: false,
  // 1）routerBase 为字符串时，只能唯一的路径访问该项目，routerBase 固定
  // routerBase: '/vise/vue3-intro/',
  // 2）routerBase 可选的为 RegExp[], 以支持特殊的多路径访问同一项目的诉求,其中 (\/[\w-]+) 部分为个人环境前缀,其中 (\/[\w-]+) 部分为个人环境前缀
  // 此时url.match(regExp)[0] 即为此时匹配到的routerBase。
  routerBase: '/',
};
export default config;
