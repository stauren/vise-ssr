import serialize from 'serialize-javascript';
import {
  replaceContentBetweenMarks,
  replacePlaceholderWithValue,
  mergeConfig,
} from '@vise-ssr/shared';
import type {
  JSONObject,
  RenderContext,
} from '../../';
import type {
  SuccessRenderResult,
} from '../../hooks/';

function getInitStateScript(initState: JSONObject) {
  return `<script>try { window.Vise.initState = ${serialize(initState)}; } catch (err) { console.error('[Vise] fail to read initState.'); }</script>`;
}

export {
  replaceContentBetweenMarks,
  replacePlaceholderWithValue,
};

const fieldsToFill = <const>[
  'app',
  'preloadLinks',
];
export function fillSsrTemplate({ meta }: RenderContext): string {
  let html = meta.template!;
  // 使用 vue 中通过 useSSRContext 传出的变量控制页面，可以通过 RenderContext.extra 取回
  // 目前暂时只处理 title 和 initState
  if (meta.title) {
    // true 的含义是把 marks 换掉，避免输出内容出现不明注释
    const replacement = meta.title
      ? `<title>${String(meta.title)}</title>`
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
    getInitStateScript(meta.initState || {}),
  );

  return fieldsToFill
    .reduce((lastValue, key) => {
      const value = meta[key] ?? '';
      return replacePlaceholderWithValue(lastValue, key, value);
    }, html);
}

export function refillRenderResult(renderResult: SuccessRenderResult): SuccessRenderResult {
  return mergeConfig(renderResult, {
    html: fillSsrTemplate(renderResult.context),
  });
}
