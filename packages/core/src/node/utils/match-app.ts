import type { HookRouterBase } from '../../hooks/hook-manager';

export default function matchAppForUrl(
  routerBaseConfigs: Record<string, HookRouterBase>,
  url: string,
) {
  let routerBase = '/';
  const projectName = Object.keys(routerBaseConfigs)
    // 按长度倒序，以优先匹配更精确的匹配
    .sort((a, b) => routerBaseConfigs[b].length - routerBaseConfigs[a].length)
    .find((appName) => {
      const appRouterBase = routerBaseConfigs[appName];
      // 当config配置文件中的 routerBase 为字符串时, 直接看是否能匹配
      if (typeof appRouterBase === 'string' && url.indexOf(appRouterBase) !== -1) {
        routerBase = appRouterBase;
        return true;
      }
      if (typeof appRouterBase !== 'string') {
        // 当配置的 routerBase 为 RegExp[], 在动态替换时 调用了 RegExp.prototype.toString(), 因此要首先转换为 RegExp
        return appRouterBase.some((regStr: string) => {
          let str = regStr;
          if (str.startsWith('/')) {
            str = str.substring(1);
          }
          if (str.endsWith('/')) {
            str = str.substring(0, str.length - 1);
          }
          const regRule = new RegExp(str);
          const [regRes] = url.match(regRule) ?? [];
          if (regRes) {
            routerBase = regRes;
            return true;
          }
          return false;
        });
      }
      return false;
    }) ?? '';
  return {
    projectName,
    routerBase,
  };
}
