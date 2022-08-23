# Vise Express Server
> 同构 SSR 开发框架 - HTTP 服务器

This package provide the HTTP server based on express for [vise-ssr](https://www.npmjs.com/package/vise-ssr).

Vise Express Server 是 Vise 框架中的基于 Express 的 HTTP server，整合并适配了 Vise 的 [Hook API](https://vise.com/tapable-hooks.html#server-%E5%BC%80%E5%8F%91%E8%80%85)，可用作 Vise 的构建产物的 HTTP 服务容器。在 `vise serve` 命令中，依赖本 package 提供 HTTP 服务。

Vise Express Server 提供 `vise-express` 命令行工具，支持如下调用以特定 Vise App 项目目录启动 Express Server：

`$ vise-express start ./path/to/app-my-vise-project`

注意启动之前需要对项目进行 `vise build`

支持的调用参数：
```shell
Usage: vise-express start [options] <viseAppDir>

start http listen

Options:
  -p, --port <port>                 server listen port (default: "3000")
  -b, --bundle-dir                  serve from bundle dir instead of vise app dir
  -c, --enable-cache <trueOrFalse>  enable server cache (default: "true")
  -r, --repeat-render <times>       repeat ssr for benchmark test (default: "0")
  -h, --help                        display help for command
```

注意，在未添加参数 `-b` 的时候，传入的路径应该是一个 Vise App 的根路径，需要有 `vise build` 后创建的 `./dist` 目录，如 `vise-express start ./my-vise-app`：

```shell
my-vise-app
├── dist
│   ├── client
│   └── server
├── package.json
├── src
...
```

在添加参数 `-b` 的时候，传入的路径应该是一个支持多应用的部署路径，如 `vise-express start -b ./vise-app-bundles`：

```shell
vise-app-bundles (该级目录名称随意)
├── my-vise-app-a
│   ├── client
│   ├── server
│   └── package.json
├── my-vise-app-b
│   ├── client
│   ├── server
│   └── package.json
...
```

添加 `-m` 参数的时候，可以将 app 的对外访问 url pathname 重新映射，参数为 JSON.stringify 后的 Object 对象，例如: `vise-express start -b -m '{"vue3-intro":"/"}' ./vise-app-bundles`

在未传入 `-m` 参数的情况下，如果为非 `-b` 模式，会自动使用 `{"${appName}":"/"}` 将访问路径映射到根路径下；如果为 `-b` 模式，将默认使用 `/${appName}/` 作为各个 app 对外访问 url 路径。

Vise 是一个同构 SSR 开发框架，更多信息请参考 [Vise 官网](https://vise.com)
