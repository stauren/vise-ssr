<template>
  hook 测试中转页
</template>
<script lang="ts">
import { defineComponent } from 'vue';
export default defineComponent({
  mounted() {
    setTimeout(() => {
      this.$router.push('/');
    }, 1000);
  },
});
</script>
