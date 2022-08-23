<template>
  <li :id="`sidebar-${$props.id}`">
    <a
      v-if="$props.type === 'link'"
      class="nav-link sidebar-item"
      :href="$props.to"
    >{{ $props.title }}</a>
    <router-link
      v-else
      class="nav-link sidebar-item"
      active-class="active"
      :to="$props.to"
    >
      {{ $props.title }}
    </router-link>
  </li>
  <!-- eslint-disable-next-line vue/no-v-html -->
  <div v-html="$props.toc" />
</template>
<script lang="ts" setup>
interface Props {
  id: string
  to: string
  title: string
  toc: string
  type: 'link' | ''
}

withDefaults(defineProps<Props>(), {
  id: '',
  to: '/',
  title: '首页',
  toc: '',
});
</script>
