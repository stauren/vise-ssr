<template>
  <div
    v-if="$props.depth <= 0"
    :id="`${$props.depth}-${$props.breadth}-${$props.layer}`"
  >
    abcdefghij
  </div>
  <div
    v-else
    :id="`${$props.depth}-${$props.breadth}-${$props.layer}`"
  >
    <RecursiveDivsFn
      v-for="n in $props.breadth"
      :key="n"
      :layer="n"
      :depth="$props.depth - 1"
      :breadth="$props.breadth - 1"
    />
  </div>
</template>

<script lang="ts" setup>
interface Props {
  depth: number
  breadth: number
  layer: number
}

withDefaults(defineProps<Props>(), {
  depth: 1,
  breadth: 1,
  layer: 1,
});
</script>
