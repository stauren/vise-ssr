import serialize from 'serialize-javascript';
import {
  replaceContentBetweenMarks,
  replacePlaceholderWithValue,
  mergeConfig,
} from '@vise-ssr/shared';
import type {
  JSONObject,
  RenderContextExtra,
  SsrBundleSuccess,
} from '../../';
import type {
  SuccessRenderResult,
} from '../../hooks/';

function getInitStateScript(initState: JSONObject) {
  return `<script>try { window.Vise.initState = ${serialize(initState)}; } catch (err) { console.error('[Vise] fail to read initState.'); }</script>`;
}

type PureSsrBundleResult = Omit<SsrBundleSuccess, 'extra'>;

export {
  replaceContentBetweenMarks,
  replacePlaceholderWithValue,
};
export function fillSsrTemplate(
  ssrResult: PureSsrBundleResult,
  extra: RenderContextExtra,
): string {
  let html = ssrResult.template;
  // 使用 vue 中通过 useSSRContext 传出的变量控制页面，可以通过 RenderContext.extra 取回
  // 目前暂时只处理 title 和 initState
  if (extra.title) {
    // true 的含义是把 marks 换掉，避免输出内容出现不明注释
    const replacement = extra.title
      ? `<title>${String(extra.title)}</title>`
      : true;
    // <title> 已经使用 vise config 中的配置在 html 模板中替换了一次，
    // 但依旧带着 mark 注释，为了这里使用动态数据再次替换
    html = replaceContentBetweenMarks({
      source: html,
      mark: 'TITLE',
      replacement,
      mode: 'html',
    });
  }

  html = replacePlaceholderWithValue(
    html,
    'initState',
    getInitStateScript(extra.initState || {}),
  );

  type BundleKeys = (keyof PureSsrBundleResult)[];
  return (Object.keys(ssrResult) as BundleKeys)
    .reduce((lastValue, key) => {
      const value = ssrResult[key] ?? '';
      return replacePlaceholderWithValue(lastValue, key, value);
    }, html);
}

export function refillRenderResult(renderResult: SuccessRenderResult): SuccessRenderResult {
  return mergeConfig(renderResult, {
    ssrResult: {
      html: fillSsrTemplate(renderResult.ssrResult, renderResult.context.extra),
    },
  });
}
