<template>
  <div
    v-if="depth <= 0"
    :id="`${depth}-${breadth}-${layer}`"
  >
    abcdefghij
  </div>
  <div
    v-else
    :id="`${depth}-${breadth}-${layer}`"
  >
    <RecursiveDivs
      v-for="n in breadth"
      :key="n"
      :layer="n"
      :depth="depthMinus1"
      :breadth="breadthMinus1"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

interface Props {
  depth: number
  breadth: number
  layer: number
}

const props = withDefaults(defineProps<Props>(), {
  depth: 1,
  breadth: 1,
  layer: 1,
});

const depthMinus1 = computed(() => props.depth - 1);
const breadthMinus1 = computed(() => props.breadth - 1);
</script>
