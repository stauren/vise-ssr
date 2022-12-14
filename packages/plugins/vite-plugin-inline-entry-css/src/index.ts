import fs from 'fs';
import path from 'path';
import cheerio from 'cheerio';
import type { OutputAsset } from 'rollup';
import type { Plugin, ResolvedConfig } from 'vite';

// 构建入口 index.html
const ENTRY_INDEX_HTML_FILENAME = 'index.html';
// manifest 清单文件名
const MANIFEST_FILENAME = 'manifest.json';
// 本插件名称
const PLUGIN_NAME = 'vise:inline-entry-css';

// 输出警告的方法
const warn = Function.prototype.bind.call(console.warn, console, `[${PLUGIN_NAME}] WARNINGS:`);

/**
 * 将构建入口 index.html 文件依赖的 css 文件均内敛到 html 中
 * - 要求手动配置生成 mainifest.json 文件，因为要从中获取 html 其下依赖的 css 列表
 *
 * @export
 * @return {*}  {Plugin}
 */
export default function viseInlineEntryCss(): Plugin {
  let resolvedConfig: ResolvedConfig | undefined;
  return {
    name: PLUGIN_NAME,
    enforce: 'post',
    configResolved(oriResolvedConfig) {
      resolvedConfig = oriResolvedConfig;
    },
    writeBundle(outputOpts, outBundle) {
      if (!resolvedConfig?.build.manifest) return;

      // 找到 vite 生成的 manifest.json 文件
      const manifestBundle = Object.values(outBundle).find((bundle) => bundle.type === 'asset'
        && bundle.fileName === MANIFEST_FILENAME);
      if (!manifestBundle) return;

      // 解析并读取其中的 json 内容
      let manifestJson: Record<string, any> = {};
      try {
        manifestJson = JSON.parse((manifestBundle as OutputAsset).source as string);
      } catch (err) {
        warn('构建产物中的 mainifest bundle 解析失败，无法执行 css 内联操作', err);
        return;
      }

      // 找到里面 index.html 中相关的信息及其所依赖的 css 资源列表
      const indexHtmlManifestInfo = manifestJson[ENTRY_INDEX_HTML_FILENAME];
      if (indexHtmlManifestInfo?.isEntry !== true) return;
      const outDir = resolvedConfig?.build.outDir || '';
      const oriCssArr: string[] = indexHtmlManifestInfo.css;
      if (!(oriCssArr?.length > 0)) return;

      // 遍历所依赖的 css 列表，将它们的内容汇总并构建成 style 块
      const cssFileAbsPathArr: string[] = oriCssArr.map((cssFilePath: string) => {
        const arr = path.resolve(outDir, cssFilePath);
        return arr;
      });
      const totalCssContent = cssFileAbsPathArr.map((cssFileAbsPath) => {
        try {
          return fs.readFileSync(cssFileAbsPath);
        } catch (err) {
          return '';
        }
      }).join('');
      if (!totalCssContent) return;
      const styleTag = `<style>${totalCssContent}</style>`;

      // 读取 html 内容
      const indexHtmlAbsPath = path.resolve(outDir, ENTRY_INDEX_HTML_FILENAME);
      let indexHtmlContent = '';
      try {
        indexHtmlContent = fs.readFileSync(indexHtmlAbsPath, 'utf-8');
      } catch (err) {
        warn(`html 文件不存在，无法执行内联 css 操作：${indexHtmlAbsPath}`);
      }
      if (!indexHtmlContent) return;

      // 将 html 内容载入到 cheerio 并查找到相关 css 的 link 元素
      const $ = cheerio.load(indexHtmlContent);
      const linkElems = [...$('link[rel="stylesheet"]')].filter((elem) => {
        const href = $(elem).attr('href');
        if (!href) return false;
        return oriCssArr.some((css) => href.indexOf(css) >= 0);
      });
      const linkElemsLen = linkElems.length;
      if (linkElemsLen <= 0) return;

      // 将 css 代码块插入到 index.html 的 head 中
      const lastLinkElem = linkElems[linkElemsLen - 1];
      $(styleTag).insertBefore($(lastLinkElem));

      // 接着将 index.html 原依赖的 css links 元素全部干掉
      linkElems.forEach((link) => $(link).remove());

      // 最后将新替换的内容重新写回 index.html
      fs.writeFileSync(indexHtmlAbsPath, $.html());
    },
  };
}
