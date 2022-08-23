/*
 * @Description: 该插件在本次请求中， HTML 渲染完成后执行，用于增加footNote
 * @usage:
 * @FilePath: /vise/packages/plugins/vise-plugin-foot-note/src/index.ts
 */
import {
  VisePlugin,
  CacheInfo,
  RenderResult,
  RenderResultCategory,
} from 'vise-ssr';

function ubtoa(str: string) {
  const buffer = new Buffer(str.toString(), 'binary');
  return buffer.toString('base64');
}

const footNotePlugin = (): VisePlugin => {
  async function afterRender(renderResult: RenderResult): Promise<RenderResult> {
    const { context: { extra: { startTime } } } = renderResult;
    let footStr = '';
    const costTime = `cost ${new Date().getTime() - (startTime as number)} ms`;
    // 成功渲染页面
    if (renderResult.type === RenderResultCategory.render) {
      const { cacheInfo, ssrResult: { html }, context: { extra } }  = renderResult;
      const { noCache } = extra;
      const key = cacheInfo?.key;
      const cacheFoot = (key && !noCache) ? `newCache,${cacheInfo?.key}` : `abandonCache,noCache:${noCache}`;
      footStr = [cacheFoot, costTime].join(',');
      return {
        ...renderResult,
        ssrResult: {
          ...renderResult.ssrResult,
          html: `${html}<!-- ${ubtoa(footStr)} -->`,
        },
      };
    }
    // 命中htmlCache
    if (renderResult.type === RenderResultCategory.hitCache) {
      const { cacheInfo }  = renderResult;
      footStr = ['hitCache', (cacheInfo as CacheInfo).key, costTime].join(',');
      return {
        ...renderResult,
        content: `${renderResult.content}<!-- ${ubtoa(footStr)} -->`,
      };
    }
    return renderResult;
  };
  return {
    name: 'vise-plugin-foot-note',
    hooks: {
      afterRender: { // 较晚执行脚注的操作
        callback: afterRender,
        enforce: 'post',
      },
    },
  };
};
export default footNotePlugin;
