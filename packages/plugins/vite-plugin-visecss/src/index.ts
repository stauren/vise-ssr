import type { UserConfig, Plugin } from 'vite';
import * as Postcss from 'postcss';
import PostcssPxToVp, { PostcssPxToVpArgs } from 'postcss-px-to-viewport';
import PostcssPxToRem, { TPxToRemOptions } from 'postcss-pxtorem';

type ViteCssConfig = {
  // pxtovp 的配置
  pxtovp?: null | PostcssPxToVpArgs
  // pxtorem 的配置
  pxtorem?: boolean | null | TPxToRemOptions
};

// 默认的 pxtorem 插件配置
const DEFAULT_PXTOEM_CONFIG: TPxToRemOptions = {
  rootValue: 37.5,
  propList: ['*'],
  unitPrecision: 6,
};

// 默认的pxtovp 插件配置
const DEFAULT_POSTCSSPXTOVP_CONFIG = {
  unitToConvert: 'px', // 要转化的单位
  viewportWidth: 750, // UI设计稿的宽度
  unitPrecision: 6, // 转换后的精度，即小数点位数
  propList: ['*'], // 指定转换的css属性的单位，*代表全部css属性的单位都进行转换
  viewportUnit: 'vw', // 指定需要转换成的视窗单位，默认vw
  fontViewportUnit: 'vw', // 指定字体需要转换成的视窗单位，默认vw
  selectorBlackList: [], // 指定不转换为视窗单位的类名，
  minPixelValue: 1, // 默认值1，小于或等于1px则不进行转换
  mediaQuery: true, // 是否在媒体查询的css代码中也进行转换，默认false
  replace: true, // 是否转换后直接更换属性值
  exclude: [/node_modules/], // 设置忽略文件，用正则做目录名匹配
  landscape: false, // 是否处理横屏情况
};

function getPostcssPxToVpPlugin(postcssPxToVpArgs: PostcssPxToVpArgs): Postcss.Plugin {
  const config: PostcssPxToVpArgs = Object.assign(DEFAULT_POSTCSSPXTOVP_CONFIG, postcssPxToVpArgs);
  return PostcssPxToVp(config);
}

function getPostcssPxToRemPlugin(pxToRemArgs: boolean | TPxToRemOptions): Postcss.Plugin {
  let config = DEFAULT_PXTOEM_CONFIG;
  if (Object.prototype.toString.call(pxToRemArgs) === '[object Object]') {
    config = pxToRemArgs as TPxToRemOptions;
  }
  return PostcssPxToRem(config);
}
function getPostCssPlugins(config: ViteCssConfig): Postcss.Plugin[] {
  const plugins = [];
  if (config.pxtorem) {
    plugins.push(getPostcssPxToRemPlugin(config.pxtorem));
  } else if (config.pxtovp) {
    plugins.push(getPostcssPxToVpPlugin(config.pxtovp));
  }
  return plugins;
}

export default function viteCssPlugin(pluginConfig: ViteCssConfig): Plugin {
  return {
    name: 'vise:css',
    enforce: 'pre',
    config(config: UserConfig) {
      const plugins = getPostCssPlugins(pluginConfig);
      if (plugins.length) {
        if (typeof config?.css?.postcss === 'string') {
          throw new Error('conflict config of vise Css Plugin');
        }
        const newConfig: UserConfig = {
          css: {
            postcss: {
              plugins,
            },
          },
        };
        return newConfig;
      }
    },
  };
}
