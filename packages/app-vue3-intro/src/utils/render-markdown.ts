import MarkdownIt from 'markdown-it';
import MarkdownItAnchor from 'markdown-it-anchor';
import MarkdownItToc from 'markdown-it-toc-done-right';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import css from 'highlight.js/lib/languages/css';
import shell from 'highlight.js/lib/languages/shell';
import { MarkdownRenderResult } from '../../types';

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('css', css);
hljs.registerLanguage('shell', shell);

const md: MarkdownIt = new MarkdownIt({
  highlight(str: string, lang: string) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return `<pre class="hljs"><code>${hljs.highlight(str, { language: lang, ignoreIllegals: true }).value}</code></pre>`;
      } catch (__) {
        // ignore
      }
    }

    return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`;
  },
});

md.use(MarkdownItAnchor);
md.use(MarkdownItToc, {
  listType: 'ul',
  listClass: 'sidebar-sub-items',
  linkClass: 'nav-link sidebar-item',
});

function extractToc(fullHtml: string) {
  const startTag = '<nav class="table-of-contents">';
  const endTag = '</nav>';
  const startPos = fullHtml.indexOf(startTag);
  const htmlStartWithToc = fullHtml.substr(startPos);
  const endPos = htmlStartWithToc.indexOf(endTag);

  if (startPos < 0 || endPos < 0) {
    return {
      toc: '',
      content: fullHtml,
    };
  }

  return {
    toc: htmlStartWithToc.substring(0, endPos + endTag.length),
    content: `${fullHtml.substring(0, startPos)}${fullHtml.substring(endPos)}`,
  };
}

function getHash(str: string) {
  let hash = 0;
  if (str.length === 0) return hash;
  for (let i = 0; i < str.length; i += 1) {
    const chr = str.charCodeAt(i);
    /* eslint-disable no-bitwise */
    hash = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
    /* eslint-enable no-bitwise */
  }
  return hash;
}

const cache: Record<number, MarkdownRenderResult> = {};
export default function renderMarkdown(markdownContent: string): MarkdownRenderResult {
  const hash = getHash(markdownContent);
  if (cache[hash]) {
    return cache[hash];
  }
  const fullHtml = md.render(markdownContent);
  const result = extractToc(fullHtml);
  cache[hash] = result;
  return result;
}
