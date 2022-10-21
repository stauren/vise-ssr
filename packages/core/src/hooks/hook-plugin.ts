import type {
  HookNames,
  HookCallbackConfig,
  StdHookCallbackConfig,
  ArrayOrSingle,
  HookCallback,
  CacheInfo,
  RenderContext,
  RenderResult,
  ResolvedRequest,
  FindCacheResult,
  ViseHooks,
} from './hook-manager';
import { ALL_HOOKS, HOOK_TO_INNER } from './hook-manager';
import { cloneDeep } from '../node/utils/object';
import isEqual from '../node/utils/is-equal';

const LEGAL_PLUGIN_NAME = /^(vise-plugin-|app-|vise:)[a-z]([a-z0-9-]*[a-z0-9])?$/;

type DetailHookCallback = { callback: Function, enforce?: 'pre' | 'post' };
type DetailCallbackConfig = {
  [K in HookNames]?: Array<DetailHookCallback>;
};

export type VisePlugin = {
  // 插件名应该与 npm 包名一致，满足约定：
  // vise core：vise:${componentName}
  // 插件：vise-plugin-${myPluginName}
  // app: app-${myAppName}
  // 其中自定义名应该只由以字母开头的只包含小写字母、数字、连接线(-)，并以小写字母开头
  name: string,
  hooks: HookCallbackConfig,
};

// 封装用户输入的函数，创建高阶函数以便统一处理
// 这个函数的圈复杂度很高，但没关系，逻辑其实是分散在各个不相干的 switch 简单子语句里面的，不会混淆
function getHighOrderFunction(pluginName: string, hookName: HookNames, callback: Function) {
  switch (hookName) {
    case 'receiveRequest':
    case 'render':
      return async function (...args: any) {
        // 2个 hooks 的返回值是一致的
        const renderResult = (await callback(...args)) as RenderResult;
        if (renderResult) {
          // 强制固定 renderBy，以便追查渲染来源
          renderResult.renderBy = pluginName;
        }
        return renderResult;
      };
    case 'afterRender':
      return async function (renderResult: RenderResult) {
        const finalRenderResult = await callback({ ...renderResult });
        if (!isEqual(renderResult, finalRenderResult)) {
          // 强制固定 renderBy，以便追查渲染来源
          finalRenderResult.renderBy = pluginName;
        }
        return finalRenderResult;
      };
    case 'requestResolved':
      // 确保用户不会修改 ResolvedRequest.original 内容
      return async function (resolvedRequest: ResolvedRequest) {
        const cbWithType = callback as HookCallback['requestResolved'];
        const original = cloneDeep(resolvedRequest.original) as RenderContext;
        const { resolved } = await cbWithType(resolvedRequest);
        return {
          original,
          resolved,
        };
      };
    case 'findCache':
      // 这里只是简单的传递参数，不关心具体类型
      return async function (cacheInfo: CacheInfo): Promise<FindCacheResult | void> {
        const content = await callback(cacheInfo) as string | void;
        if (content) {
          return {
            content,
            renderBy: pluginName,
          };
        }
      };
  }
  return callback;
}

function mergeCallbacksOfOneHook(
  pluginName: string,
  hookName: HookNames,
  oldCallbacks: Array<DetailHookCallback> | undefined,
  configsOfOneHook: ArrayOrSingle<DetailHookCallback| Function>,
) {
  // 标准化 hooks 为数组模式
  const configs = Array.isArray(configsOfOneHook) ? configsOfOneHook : [configsOfOneHook];

  return configs
    // 标准化 config
    .map(conf => (
      'callback' in conf ? conf : {
        callback: conf,
      }))
    .reduce((callbackAry, conf) => [...callbackAry, {
      ...conf,
      callback: getHighOrderFunction(pluginName, hookName, conf.callback),
    }], oldCallbacks ?? [] as Array<DetailHookCallback>);
}

function wrapAppAsPlugin(viseHooks: ViseHooks): Array<VisePlugin> {
  const appHooks = ALL_HOOKS
    .reduce((prev, hookName) => (
      viseHooks[hookName] ? {
        ...prev,
        [hookName]: viseHooks[hookName],
      } : prev
    ), {});
  return [
    ...viseHooks.plugins ?? [],
    {
      name: `app-${viseHooks.appName}`,
      hooks: appHooks,
    },
  ];
}

const filterAndStandardize = (callbacks: Array<DetailHookCallback>, filterType: string | undefined) => callbacks
  .filter(item => item.enforce === filterType)
  .map(item => item.callback);

function getOrderedStdHookConfig(mergedConfig: DetailCallbackConfig) {
  return (Object.keys(mergedConfig) as Array<HookNames>)
    .reduce<StdHookCallbackConfig>((prev, hookName) => ({
    ...prev,
    [hookName]: [
      // 用 filter 而不用 sort，避免改变同一 enforce 下的顺序
      ...filterAndStandardize(mergedConfig[hookName]!, 'pre'),
      ...filterAndStandardize(mergedConfig[hookName]!, undefined),
      ...filterAndStandardize(mergedConfig[hookName]!, 'post'),
    ],
  }), {});
}

function mergePluginConfigs(plugins: VisePlugin[]) {
  return plugins.reduce((hookConfig: HookCallbackConfig, plugin: VisePlugin) => {
    const { name: pluginName, hooks } = plugin;
    return (Object.keys(hooks) as Array<HookNames>).reduce((hookConfigAfterPartialMerge, hookName) => {
      const rawConf = hooks[hookName];
      if (!rawConf) {
        return hookConfigAfterPartialMerge;
      }

      const newCallbacks = mergeCallbacksOfOneHook(
        pluginName,
        hookName,
        // @ts-ignore hookConfigAfterPartialMerge 是从头新建的
        // 可以确保 hookConfigAfterPartialMerge[hookName] 是数组 | undefined
        hookConfigAfterPartialMerge[hookName],
        rawConf,
      );

      // 部分 hooks 因为返回值封装 hof 后改变，改用 inner hook
      const outputHookName = Object.prototype.hasOwnProperty.call(HOOK_TO_INNER, hookName)
        ? HOOK_TO_INNER[hookName as keyof typeof HOOK_TO_INNER]
        : hookName;
      return {
        ...hookConfigAfterPartialMerge,
        [outputHookName]: newCallbacks,
      };
    }, hookConfig);
  }, {}) as DetailCallbackConfig;
}

export function parseHooksWithPlugins(viseHooks: ViseHooks): StdHookCallbackConfig {
  const plugins = wrapAppAsPlugin(viseHooks);

  plugins.forEach(({ name }) => {
    if (!name.match(LEGAL_PLUGIN_NAME)) {
      throw `illegal vise plugin name: ${name}`;
    }
  });

  // 逐个处理 plugin，生成合并 hookConfig
  const mergedConfig = mergePluginConfigs(plugins);

  const orderedConfig = getOrderedStdHookConfig(mergedConfig);

  return orderedConfig;
}
