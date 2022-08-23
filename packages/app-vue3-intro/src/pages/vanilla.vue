<template>
  <div class="benchmark-page">
    <h1>Vanilla Js</h1>
    <p>Plan to render: {{ countDrawingDivs(depth, breadth) }} divs</p>
    <p>Rendered: {{ renderedCount }} divs</p>
    <SsrTime />
    <BenchmarkNav active="Vanilla JS" />
    <RecursiveDivsVanilla
      class="benchmark-container"
      :depth="depth"
      :breadth="breadth"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import RecursiveDivsVanilla from '@/components/recursive-divs-vanilla.vue';
import BenchmarkNav from '@/components/benchmark-nav.vue';
import SsrTime from '@/components/ssr-time.vue';
import { countDrawingDivs } from '@/utils/count-drawing-divs';
const depth = 5;
const breadth = 11;

const renderedCount = ref(0);
onMounted(() => {
  renderedCount.value = document.querySelectorAll('.benchmark-container div').length;
});
</script>

<style scoped>
h1,
a {
  color: green;
}
</style>
