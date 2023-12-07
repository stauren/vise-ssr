<template>
  <p class="inter">
    SSR Render: {{ ssrDuration }}ms
  </p>
  <p class="inter">
    Start render till mounted: {{ toMountedDuration }}ms
    (may be affected if client & server have different time setting)
  </p>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useStore } from '@/store/';

const { state } = useStore();
const ssrDuration = ref<string>('--');
const toMountedDuration = ref<number>(0);
onMounted(() => {
  ssrDuration.value = (state.startTime > 0
    ? `${state.renderEndTime - state.startTime}`
    : '--');
  toMountedDuration.value = Date.now() - state.startTime;
});
</script>
