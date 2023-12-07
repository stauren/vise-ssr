<template>
  <nav className="benchmark-nav">
    All Benchmarks:
    <span class="benchmark-list">
      <template
        v-for="(item, idx) in list"
        :key="item.name"
      >
        <span v-if="item.name === active">{{ item.name }}</span>
        <template v-else>
          <a
            :href="item.link"
            target="_blank"
            rel="noreferrer"
          >
            {{ item.name }}
          </a>
        </template>{{ idx === list.length - 1 ? undefined : '|' }}
      </template>
    </span>
  </nav>
</template>

<script setup lang="ts">
type BenchmarkNavProps = {
  active?: string,
};

defineProps<BenchmarkNavProps>();

const list = [{
  link: '/vanilla',
  name: 'Vanilla JS',
}, {
  link: '/benchmark?functional=true',
  name: 'Vue3 FC',
}, {
  link: '/benchmark',
  name: 'Vue3',
}, {
  link: '/react/benchmark',
  name: 'React',
}];
</script>
<style lang="scss">
.benchmark-nav {
  margin-top: 1rem;
  margin-bottom: 1rem;
  .benchmark-list {
    a, span {
      padding: 0 10px;
      text-align: center;
    }
  }
}
</style>
