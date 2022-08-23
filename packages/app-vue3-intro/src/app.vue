<template>
  <div class="theme-container">
    <router-view v-slot="{ Component, route }">
      <site-header />
      <main class="page">
        <component
          :is="Component"
          :key="route.path"
        />
        <footer>
          Proudly served with Vise express server.
        </footer>
      </main>
      <site-sidebar />
    </router-view>
  </div>
</template>
<script lang="ts" setup>
import SiteHeader from '@/components/site-header.vue';
import SiteSidebar from '@/components/site-sidebar.vue';
</script>
<style lang="scss">
@import 'highlight.js/styles/github-dark.css';
@import './styles/index'
</style>
