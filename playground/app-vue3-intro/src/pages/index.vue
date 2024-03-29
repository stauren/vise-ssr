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
        {{ subTitle.join(' ') }} {{ luckyNumber }}
      </div>
      <button @click="localState.count++">
        local count is: {{ localState.count }}
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
import {
  reactive, computed, defineComponent, onMounted, ref,
} from 'vue';
import useMarkdown from '@/composable/use-markdown';
import useCount from '@/composable/use-count';
import mdContent from '@/data/markdown/index.md?raw';
import { useStore, MutationTypes } from '@/store/';
import { fetchLuckyNumber } from '@/services';
import BenchmarkNav from '@/components/benchmark-nav.vue';

const title = 'Vise: SSR with Vite + TypeScript + Server Hooks';
const { FilledMarkdownViewer } = useMarkdown('introduction', title, mdContent);

export default defineComponent({
  components: {
    FilledMarkdownViewer,
    BenchmarkNav,
  },
  setup() {
    const store = useStore();
    const { count, increaseCount } = useCount();

    const loadingLuckyNumber = ref(false);
    const luckyNumber = computed(() => (loadingLuckyNumber.value ? '--' : store.state.luckyNumber));
    const fetchLuckyNum = () => {
      loadingLuckyNumber.value = true;
      setTimeout(async () => {
        const newLuckyNumber = await fetchLuckyNumber();
        store.commit(MutationTypes.UPDATE_LUCKY_NUM, { newLuckyNumber });
        loadingLuckyNumber.value = false;
      }, 100);
    };
    onMounted(() => {
      if (luckyNumber.value === -1) {
        fetchLuckyNum();
      }
    });

    const localState = reactive({
      count: 0,
    });

    const subTitle = computed(() => store.state.subTitle);

    return {
      title,

      count,
      increaseCount,

      luckyNumber,
      fetchLuckyNum,

      localState,
      subTitle,
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
.theme-default-content .theme-default-content {
  text-align: left;
}
</style>
