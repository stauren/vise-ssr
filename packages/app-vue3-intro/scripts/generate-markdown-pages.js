#!/usr/bin/env node
import { promises as fsPromise } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

function generateAllPages() {
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
