<template>
  <aside class="sidebar">
    <ul class="sidebar-links">
      <p class="sidebar-heading sidebar-item active">
        使用向导
      </p>
      <ul class="item-ctn">
        <sidebar-item
          v-for="item in sidebarItems"
          :id="item.id"
          :key="item.to"
          :to="item.to"
          :type="item.type === 'link' ? 'link' : ''"
          :title="item.title"
          :toc="item.toc.value"
        />
      </ul>
    </ul>
  </aside>
</template>
<script lang="ts" setup>
import { computed } from 'vue';
import { useStore } from '@/store/';
import SidebarItem from '@/components/sidebar-item.vue';
import SIDEBAR_ITEMS from '@/data/sidebar-items.json';

const store = useStore();
const toCamel = (id: string) => id.replace(/-([a-z])/g, (whole, match) => match.toUpperCase());
const sidebarItems = SIDEBAR_ITEMS.map((item) => ({
  id: item.id,
  to: item.to || `/${item.id}.html`,
  title: item.title,
  type: item.type ?? '',
  toc: computed(() => store.state.sidebarToc[toCamel(item.id)] || ''),
}));
</script>
