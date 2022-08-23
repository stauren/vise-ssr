import {
  VisePlugin,
  RenderContext,
  RenderResult,
} from 'vise-ssr';
import type { PluginOpts } from '../types/half-ssr-plugin';

function toKebab(camelString: string) {
  return camelString.replace(/([A-Z])/g, match => `-${match.toLowerCase()}`);
}
function  renderHalfSSRhtml(template: string, initData: any) {
  const dataKey = 'csrHomeData';

  // 拼接html script数据
  return template.replace(`<!--${toKebab(dataKey)}-->`, globalDataTemplate(dataKey, initData));
}
/**
   * 拼接global data数据模板
   * @param globalKey
   * @param data
   * @returns  {string}
   */
function globalDataTemplate(globalKey: string, data: any): string {
  if (!data) return '';
  return `<script>
      ;(function(){
      try {
          window.Vise.${globalKey} = ${typeof data === 'string' ? data : JSON.stringify(data)};
        } catch (e) {
          console.error("[global data error]", e);
          window.Vise.${globalKey} = null;
        }
      })();
    </script>`;
}

const HALF_SSR_RENDER = 'vise:plugin-half-ssr';
function ubtoa(str: string) {
  const buffer = new Buffer(str.toString(), 'binary');

  return buffer.toString('base64');
}

function halfSSRPlugin({
  templates,
  appConfig,
}: PluginOpts): VisePlugin {
  // @ts-ignore
  async function render(renderContext: RenderContext): Promise<RenderResult>  {
    const { projectName, initData } = renderContext.extra;
    if (appConfig[(projectName as string)].renderType === 'halfSSR') {
      return {
        type: 'render',
        context: renderContext,
        // @ts-ignore
        ssrResult: {
          html: renderHalfSSRhtml(
            templates[(projectName as string)],
            initData,
          ),
          // @ts-ignore
          ssrContext: {
            noCache: true,
          },
        },
      };
    }
  }
  async function afterRender(renderResult: RenderResult): Promise<RenderResult> {
    // halfSSR渲染模式
    const { context: { extra: { startTime } } } = renderResult;
    const costTime = `cost ${new Date().getTime() - (startTime as number)} ms`;
    if (renderResult.renderBy === HALF_SSR_RENDER) {
      const footStr = ['halfSSR', costTime].join(',');
      return {
        ...renderResult,
        // @ts-ignore
        ssrResult: {
          // @ts-ignore
          ...renderResult.ssrResult,
          // @ts-ignore
          html: `${renderResult.ssrResult.html}<!-- ${ubtoa(footStr)} -->`,
        },
      };
    }
    return renderResult;
  }
  return {
    name: 'vise-plugin-half-ssr',
    hooks: {
      render,
      afterRender,
    },
  };
}

export default halfSSRPlugin;
export type { PluginOpts } from '../types/half-ssr-plugin';
