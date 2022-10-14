#!/usr/bin/env node
import { promises as fsPromise } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { $ } from 'zx';

const DIR_NAME = path.dirname(fileURLToPath(import.meta.url));

const SIDEBAR_ITEMS = JSON.parse(await fsPromise.readFile(
  path.resolve(DIR_NAME, '../src/data/sidebar-items.json'),
  'utf8',
));

const toCamel = id => id.replace(/-([a-z])/g, (whole, match) => match.toUpperCase());
function getPage(name) {
  const camelVersionName = toCamel(name);
  return `<template>
  <div class="${name}">
    <filled-markdown-viewer />
  </div>
</template>
<script lang="ts">
import { defineComponent } from 'vue';
import useMarkdown from '@/composable/use-markdown';
import mdContent from '@/data/markdown/${name}.md?raw';

const { FilledMarkdownViewer, setTitle } = useMarkdown('${camelVersionName}', mdContent);
export default defineComponent({
  components: {
    FilledMarkdownViewer,
  },
  setup() {
    setTitle();
  },
});
</script>
`;
}

function removeQuote(str) {
  if (str.startsWith('"') && str.endsWith('"')) {
    return str.substring(0, str.length - 1).substring(1);
  }
  return str;
}

function parseFrontMatter(content) {
  // match following strings at the start of file:
  // '---\nlayout: page\ntitle: "SSR 缓存及唯一 key"\npermalink: /cache-key.html\n---\n'
  const [wholeHeader, kvPairString] = content.match(/^---\n((?:[\w]+: [^\n]+\n)*)---\n/m);
  return kvPairString.split('\n').reduce((accu, onePairString) => {
    if (!onePairString) return accu;
    const [key, value] = onePairString
      .split(':')
      .map(str => str.trim())
      .map(removeQuote);

    if (!key) return accu;
    return {
      ...accu,
      [key]: value,
    };
  }, {
    body: content.substring(wholeHeader.length),
  });
}

async function generateMarkdown() {
  // use markdown from github-pages directory with modification
  $.verbose = false;
  const sourceDir = path.resolve(DIR_NAME, '../../../docs/');
  const destDir = path.resolve(DIR_NAME, '../src/data/markdown');
  try {
    await $`rm -f ${destDir}/*.md`;
    const writeJobs = (await $`ls -1 ${sourceDir}/*.md`).stdout.split('\n')
      .map(async (filePath) => {
        if (!filePath) return;
        // strange zx cat bug, content with random symbol
        // const content = (await ($`cat ${filePath}`)).stdout;
        const content = await fsPromise.readFile(filePath, 'utf8');
        const contentInfo = parseFrontMatter(content);
        const destPath = `${destDir}${filePath.substring(filePath.lastIndexOf('/'))}`;
        const result = `[[toc]]
# ${contentInfo.title}
${contentInfo.body}`;
        return fsPromise.writeFile(destPath, result, 'utf8');
      });
    await Promise.all(writeJobs);
  } catch (po) {
    console.log(po);
    console.log(`Exit code: ${p.exitCode}`);
    console.log(`Error: ${p.stderr}`);
  }
}

async function generateAllPages() {
  await generateMarkdown();
  SIDEBAR_ITEMS.forEach(({ id, type }) => {
    if (id !== 'introduction' && type !== 'link') {
      fsPromise.writeFile(
        path.resolve(DIR_NAME, `../src/pages/${id}.vue`),
        getPage(id),
      );
    }
  });
}
export function cleanAllPages() {
  SIDEBAR_ITEMS.forEach(({ id, type }) => {
    if (id !== 'introduction' && type !== 'link') {
      fsPromise.unlink(path.resolve(DIR_NAME, `../src/pages/${id}.vue`));
    }
  });
}

generateAllPages();
