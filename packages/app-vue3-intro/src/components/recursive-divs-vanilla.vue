<template>
  <!-- divs are safe -->
  <!-- eslint-disable-next-line vue/no-v-html -->
  <div v-html="divs" />
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'RecursiveDivsVanilla',
  props: {
    depth: {
      type: Number,
      default: 0,
    },
    breadth: {
      type: Number,
      default: 0,
    },
  },
  data() {
    return {
      divs: '',
    };
  },
  created() {
    function recursiveDivs(depth = 1, breadth = 1, layer = 1): string {
      if (depth <= 0) {
        return `<div id="${depth}-${breadth}-${layer}">abcdefghij</div>`;
      }

      const children = [];

      for (let i = 1; i <= breadth; i += 1) {
        children.push(recursiveDivs(depth - 1, breadth - 1, i));
      }

      return `<div id="${depth}-${breadth}-${layer}">${children.join('')}</div>`;
    }
    this.divs = recursiveDivs(this.depth, this.breadth);
  },
});
</script>
<style lang="scss">
.container-div div {
  padding: 1px;
  display: inline-block;
  border: 1px solid #ccc;
}
</style>
