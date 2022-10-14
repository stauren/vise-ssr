<template>
  <div class="theme-default-content">
    <div class="top-title">
      <h1>{{ title }}</h1>
      <p>
        <img
          class="main-logo"
          src="/logo.svg"
          alt="logo"
        >
      </p>
      <div class="lucky-num">
        Lucky Number from API: {{ luckyNumber }}
      </div>
      <button @click="state.count++">
        local count is: {{ state.count }}
      </button>&nbsp;
      <button @click="increaseCount()">
        store count is: {{ count }}
      </button>&nbsp;
      <button @click="fetchLuckyNum()">
        fetch again
      </button>
      <filled-markdown-viewer />
    </div>
    <BenchmarkNav />
  </div>
</template>
<script lang="ts">
import { reactive, computed, defineComponent, onMounted, ref } from 'vue';
import useMarkdown from '@/composable/use-markdown';
import useCount from '@/composable/use-count';
import useTitle from '@/composable/use-title';
import mdContent from '@/data/markdown/index.md?raw';
import { useStore, MutationTypes } from '@/store/';
import { fetchLuckyNumber } from '@/services';
import BenchmarkNav from '@/components/benchmark-nav.vue';

const { FilledMarkdownViewer } = useMarkdown('introduction', mdContent);

export default defineComponent({
  components: {
    FilledMarkdownViewer,
    BenchmarkNav,
  },
  setup() {
    const { setTitle } = useTitle();
    const title = 'Vise: SSR with Vite + TypeScript + Server Hooks';
    setTitle(title);

    const store = useStore();
    const { count, increaseCount } = useCount();

    const luckyNumber = computed(() => (loadingLuckyNumber.value ? '--' : store.state.luckyNumber));
    const loadingLuckyNumber = ref(false);
    const fetchLuckyNum = () => {
      loadingLuckyNumber.value = true;
      setTimeout((() => async () => {
        const newLuckyNumber = await fetchLuckyNumber();
        store.commit(MutationTypes.UPDATE_LUCKY_NUM, { newLuckyNumber });
        loadingLuckyNumber.value = false;
      })(), 100);
    };
    onMounted(() => {
      if (luckyNumber.value === -1) {
        fetchLuckyNum();
      }
    });

    const state = reactive({
      count: 0,
    });

    return {
      title,

      count,
      increaseCount,

      luckyNumber,
      fetchLuckyNum,

      state,
    };
  },
});
</script>

<style lang="scss">
.top-title {
  text-align: center;
}
.lucky-num {
  margin: 10px;
}
.main-logo {
  width: 30vw;
}
</style>
