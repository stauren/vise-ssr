import type { ViseConfig } from 'vise-ssr';

const config: ViseConfig = {
  // 开发时 vite 使用的 http 服务端口
  devPort: <!--ssr-dev-port-->,
  // 构建时生成在 <html> 标签上的 className
  htmlClass: '',
  // 构建时需要保证插入到 html 中固定位置的片段内容
  // 注意：这是补充 customTemplate 无法满足的场景，因为构建后的静态资源是后面才插入的
  htmlFixedPositionFragments: [],
  // 自定义页面的默认标题
  defaultTitle: '<!--ssr-default-title-->',
  // 自定义 favicon 的地址
  faviconLink: '',
  // hmr 端口
  hmrPort: 3008,
  // 是否需要加上 amfe-flexible 脚本
  useFlexible: false,
  // ssr 选项
  ssr: {},
  /**
   * 对应于vite的base配置，页面资源 base，可以是相对路径或者 http 开头的 url，结尾需要是 /
   * 如果是 http 开头的绝对路径，则 express-server 等服务器不会处理构建包中的静态资源
   * 如果是 / 开头的相对路径，express-server 将以此配置提供静态文件服务
   */
  base: '/',
  /**
   * 页面路由同步模式配置
   * 页面路由默认是异步模式，默认不需要使用该配置；
   * 如果需要配置为同步模式，可以将 pages/xxx.vue 文件名中的 xxx 添加到这里；
   * 例如：将 pages/index.vue 页面配置为路由同步模式，则只需设置：`routerSyncPages: ['index']`，其他页面路由会保持异步模式
   */
  routerSyncPages: [],
  // resolve 配置，对应文档入口：https://vitejs.dev/config/#resolve-alias
  resolve: {},
  // plugins 配置，对应文档入口：https://vitejs.dev/config/#plugins
  plugins: [],
  // build 配置，对应文档入口：https://vitejs.dev/config/#build-target
  build: {
    // 构建时传给 rollup 的选项，文档可参见：https://rollupjs.org/guide/en/#big-list-of-options
    rollupOptions: {},
    // 小于此阈值的导入或引用资源将内联为 base64 编码，以避免额外的 http 请求。设置为 0 可以完全禁用此项
    assetsInlineLimit: 5000,
  },
  /**
   * ssr 生成的 HTML 通常需要在服务端缓存，HTML 内容通常依赖特定 request headers，
   * 由于 headers 的复杂性，服务端无从得知如何根据 headers 创建缓存 key。
   * app 可以通过 generateCacheKey 将此信息告知服务端，服务端可以通过 key 缓存页面
   * generateCacheKey?: SsrCacheKeyGenerator,
   * 自定义模板路径， 支持相对/绝对路径
   */
  customTemplate: '',

  /**
   * 服务端 hooks 预加载的存储在 RenderContext.meta.initState 上的数据
   * 默认会由框架调用 store.commit(INIT_DATA, window.Vise.initState) 存入 store
   * 如果业务 app 需要在 SSR 过程中自行管理并向 store 中 commit 数据
   * 可以将此选项置为 false。最终 store 中的数据会传输到浏览器端 hydration 使用
   */
  strictInitState: false,

  // 项目的页面脚手架模板，即，项目使用的页面框架，如 react18-app，默认值 vue3-app
  scaffold: 'react-app',

  /**
   * vise build 时生成项目 index.html 页面模板后，是否调用 html-minifier-terser
   * 进行 html 压缩，默认 true，使用 vise 内置配置参数，传入 false 禁用 minify
   * 或传入 html-minifier-terser Options 进行自定义压缩
   */
  htmlMinify: true,

  /**
   * routerBase 为必配项，可选的为 RegExp[] | string
   * 1. 若简单的为 string, 会匹配该特定的 string 进行业务分发, 且 routerBase 固定，即不再能支持多路径访问同一项目的诉求
   * ex: '/vise/vue3-intro/'
   * 2. 若为 RegExp[]: 服务端会根据该配置下的路由规则，确定访问的项目，并且根据该正则匹配解析到当前的 routerBase, 以支持特殊的多路径访问同一项目的诉求
   * ex: [/(\/[\w-]+)?\/vise\/vue3-intro\//],其中 (\/[\w-]+) 部分为个人环境前缀, url.match(regExp)[0] 即为此时匹配到的routerBase。
   */
  routerBase: '/',
};

export default config;
