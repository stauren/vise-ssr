<template>
  hook 测试中转页
</template>
<script lang="ts" setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
onMounted(() => {
  setTimeout(() => {
    router.push('/');
  }, 1000);
});
</script>
