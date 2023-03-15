<template>
  <h1>{{ title }}</h1>
  <!-- eslint-disable vue/no-v-html -->
  <div
    class="markdown-content"
    v-html="markdownHTML"
  />
  <!-- eslint-enable vue/no-v-html -->
</template>
<script lang="ts" setup>
import renderMarkdown from '@/utils/render-markdown';
import { MutationTypes, useStore } from '@/store/';

interface Props {
  name: string
  title: string,
  markdown: string
}

const props = withDefaults(defineProps<Props>(), {
  name: '',
  title: '',
  markdown: '',
});

const store = useStore();

const { toc, content: markdownHTML } = renderMarkdown(props.markdown);
// SSR 期间仍然更新 store，必须是在 strictInitState=false 模式下
store.commit(MutationTypes.SET_TOC, {
  name: props.name,
  toc,
});
</script>

<style lang="scss">
.markdown-content {
  table {
    margin-bottom: 2.5rem;
  }
}
</style>
