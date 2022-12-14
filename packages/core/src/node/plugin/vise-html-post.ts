import path from 'path';
import type { Plugin } from 'vite';
import type { NormalizedOutputOptions, OutputBundle, OutputAsset } from 'rollup';
import { minify } from 'html-minifier-terser';
import type { Options } from 'html-minifier-terser';
import { toKebab } from '@vise-ssr/shared';
import { HtmlFixedPositionFragment } from '../app-config';

type HtmlPostConfig = {
  isProduction: boolean;
  htmlFixedPositionFragments: HtmlFixedPositionFragment[];
  minifyOption: Options | boolean;
};

const defaultMinifyOption = {
  minifyCSS: true,
  minifyJS: true,
  collapseBooleanAttributes: true,
  collapseInlineTagWhitespace: true,
  collapseWhitespace: true,
  conservativeCollapse: true,
  decodeEntities: true,
  removeAttributeQuotes: true,
  removeScriptTypeAttributes: true,
  removeStyleLinkTypeAttributes: true,
};

function insertFragment(html: string, { position, content }: HtmlFixedPositionFragment) {
  // 若之前已经插入过，则直接返回
  const insertedComment = `<!--comment-${toKebab(position)}-inserted-->`;
  if (html.indexOf(insertedComment) >= 0) {
    return html;
  }

  const realFragmentContent = (typeof content === 'function' ? content() : content) || '';
  // 否则进行插入，并附带插入完成标识
  if (position === 'headEnd') {
    // 加入 insertedComment 的原因是为了避免有多次被插入的可能性
    return html.replace(/<\/head>/, `${realFragmentContent}${insertedComment}</head>`);
  }
  return html.replace(/<head>/, `<head>${realFragmentContent}${insertedComment}`);
}

function getFixedPositionFragmentInsertedHtml(
  html: string,
  fragments: HtmlFixedPositionFragment[],
) {
  if (!html) return '';
  if (fragments.length === 0) return html;

  // 迭代要插入到固定位置的用户配置
  return fragments.reduce(insertFragment, html);
}

function isTemplateBundle(bundle: OutputBundle[string]): bundle is OutputAsset {
  return bundle.type === 'asset' && path.basename(bundle.fileName) === 'index.html';
}

async function minifyHtml(html: string, option: Options | boolean) {
  if (option === false) {
    return html;
  }
  return minify(
    html,
    option === true ? defaultMinifyOption : option,
  );
}

function getGenerateBundleCallback(
  fragments: HtmlFixedPositionFragment[],
  minifyOption: Options | boolean,
) {
  return async function generateBundle(
    outputOpts: NormalizedOutputOptions,
    outBundle: OutputBundle,
  ) {
    if (!outputOpts) return;

    // 在这里注入是为了满足生产环境的构建场景
    await Promise.all(Object.values(outBundle).map(async (bundle) => {
      if (!isTemplateBundle(bundle)) return;
      const insertedHTML = getFixedPositionFragmentInsertedHtml(
        bundle.source as string,
        fragments,
      );
      // API 如此，需要修改参数
      // eslint-disable-next-line no-param-reassign
      bundle.source = await minifyHtml(insertedHTML, minifyOption);
    }));
  };
}

/**
 * html 后置插件
 *
 * @export
 * @param {HtmlPostConfig} config
 * @return {*}  {Plugin}
 */
export default function viseHtmlPost(config: HtmlPostConfig): Plugin {
  const {
    minifyOption,
    isProduction = false,
    htmlFixedPositionFragments = [],
  } = config || {};

  return {
    name: 'vise:scaffold-post',
    enforce: 'post',

    transformIndexHtml(html) {
      if (isProduction || !html) return html;
      // 在这里注入是为了兼容开发环境场景
      return getFixedPositionFragmentInsertedHtml(html, htmlFixedPositionFragments);
    },

    generateBundle: getGenerateBundleCallback(
      htmlFixedPositionFragments,
      minifyOption,
    ),
  };
}
