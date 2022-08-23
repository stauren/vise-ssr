<template>
  <router-view v-slot="{ Component, route }">
    <main class="page">
      <component
        :is="Component"
        :key="route.path"
      />
      <footer>
        Proudly served with Vise express server.
      </footer>
    </main>
  </router-view>
</template>
<script lang="ts" setup>
</script>
<style lang="scss">
@import './styles/index'
</style>
