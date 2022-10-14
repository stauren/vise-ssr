import type { SSROptions } from 'vite';

// 基础类型声明
type Primitive =
  | bigint
  | boolean
  | null
  | number
  | string
  | symbol
  | undefined;
type JSONValue = Primitive | JSONObject | JSONArray;
type JSONArray = Array<JSONValue>;
type JSONObject = {
  [key: string]: JSONValue;
};
type HttpHeaders = Record<string, string | string[] | undefined>;

// 渲染上下文中描述 HTTP 请求类型对象
export type HTTPRequest = {
  // 注意 url 不是完整 url，是去除前缀之后的 pathname 部分
  // 如线上路径是 https://example.com/path/to/app-name/page-a/ 对的 url 是 /page-a/
  readonly url: string,
  readonly headers: HttpHeaders,
  readonly body?: string,
};

// 钩子拦截的时候，返回的人造 HTTP 响应对象
type HTTPResponse = {
  code: number,
  headers: HttpHeaders,
  body?: string,
};

// 供渲染期间传递参数使用
type RenderContextExtra = JSONObject & Partial<{
  title: string,
  noCache: boolean,
  initState: JSONObject,
  routerBase: string,
}>;

// HTTP 渲染上下文，主要用来传递 HTTP 请求内容和在 extra 中存储各个钩子的额外数据
type RenderContext = {
  request: HTTPRequest,
  response: HTTPResponse,
  extra: RenderContextExtra,
  error?: Error, // 当各个钩子发生异常时，可以在渲染上下文携带该error信息
};

type ViseConfig = {
  // 开发时 vite 使用的 http 服务端口
  devPort: number,
  // 构建时生成在 <html> 标签上的 className
  htmlClass: string | (() => string),
  // 自定义页面的默认标题
  defaultTitle: string,
  // 自定义 favicon 的地址
  faviconLink: string,
  // hmr 端口
  hmrPort: number,
  // 是否需要加上 amfe-flexible 脚本
  useFlexible: boolean,
  // ssr 选项
  ssr: SSROptions,
  /**
   * 对应于vite的base配置，页面资源 base，可以是相对路径或者 http 开头的 url，结尾需要是 /
   * 如果是 http 开头的绝对路径，则 express-server 等服务器不会处理构建包中的静态资源
   * 如果是 / 开头的相对路径，express-server 将以此配置提供静态文件服务
   */
  base: string,
  /**
   * 页面路由同步模式配置
   * 页面路由默认是异步模式，默认不需要使用该配置；
   * 如果需要配置为同步模式，可以将 pages/xxx.vue 文件名中的 xxx 添加到这里；
   * 例如：将 pages/index.vue 页面配置为路由同步模式，则只需设置：`routerSyncPages: ['index']`，其他页面路由会保持异步模式
   */
  routerSyncPages: string[],
};

export type {
  ViseConfig,
  RenderContext,
};
