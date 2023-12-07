<template>
  <div class="benchmark-page">
    <h1>Render with Vue3 {{ renderDesc }}</h1>
    <p>Plan to render: {{ countDrawingDivs(depth, breadth) }} divs</p>
    <p>Rendered: {{ renderedCount }} divs</p>
    <SsrTime />
    <BenchmarkNav :active="isFunctional ? 'Vue3 FC' : 'Vue3'" />
    <div class="benchmark-container">
      <RecursiveDivsFn
        v-if="isFunctional"
        :depth="depth"
        :breadth="breadth"
        :layer="1"
      />
      <RecursiveDivs
        v-else
        :depth="depth"
        :breadth="breadth"
        :layer="1"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import RecursiveDivs from '@/components/recursive-divs.vue';
import RecursiveDivsFn from '@/components/recursive-divs-fn.vue';
import BenchmarkNav from '@/components/benchmark-nav.vue';
import SsrTime from '@/components/ssr-time.vue';
import countDrawingDivs from '@/utils/count-drawing-divs';

const depth = 5;
const breadth = 11;

const route = useRoute();
const isFunctional = ref(route.query.functional === 'true');
const renderDesc = computed(() => (isFunctional.value ? 'functional component' : 'plain component'));

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
