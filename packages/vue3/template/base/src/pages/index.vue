<template>
  <div class="top-title">
    <h1>Vise: SSR with Vite + TypeScript + Server Hooks</h1>
    <p>
      <img
        class="main-logo"
        src="/logo.svg"
        alt="logo"
      >
    </p>
    <div class="lucky-num">
      Lucky Number from API: {{ loading ? '--' : luckyNumber }}
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
  </div>
  <div class="link">
    <div class="link-btn doc">
      <a
        target="_blank"
        class="link-item doc"
        href="https://stauren.github.io/vise-ssr/"
      >Documents</a>
    </div>&nbsp;&nbsp;&nbsp;
    <div class="link-btn">
      <a
        target="_blank"
        class="link-item"
        href="https://github.com/stauren/vise-ssr"
      >Git Soure</a>
    </div>
  </div>
  <div class="desc">
    <p>
      Vise (pronounced [vaɪs]) is an isomorphic Web SSR framework based on
      <a
        href="https://vitejs.dev/"
        rel="noreferrer"
        target="_blank"
      >Vite</a>
      , dedicated to provide an out of the box SSR develop experience as easy as SPA.
      It can work with multiple web user interface libraries such as React, Vue.
      By abstract app specific logic into server hooks, multiple apps could be deployed
      onto the same server and multiple hooks could be combined
      as special purpose hooks plugins.
    </p>
    <h1>Features</h1>
    <div class="features">
      <section class="feature">
        💡 &nbsp; Vite based dev server, start in a blink, full ESM support
      </section>
      <section class="feature">
        💻 &nbsp; Express Server supported
      </section>
      <section class="feature">
        🛠️ &nbsp; vise command-line tool, whole dev life cycle support
      </section>
      <section class="feature">
        🔩 &nbsp; tapable based server hooks and plugin for hooks
      </section>
      <section class="feature">
        🔤 &nbsp; 100% TypeScript
      </section>
      <section class="feature">
        📃 &nbsp; vise-ssr on npm
      </section>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { reactive, computed, onMounted } from 'vue';
import useCount from '@/composable/use-count';
import useTitle from '@/composable/use-title';
import { useStore, MutationTypes } from '@/store/';
import { fetchLuckyNumber } from '@/services';

const { setTitle } = useTitle();
const title = 'Vise: SSR with Vite + TypeScript + Server Hooks';
setTitle(title);

const store = useStore();
const { count, increaseCount } = useCount();

const luckyNumber = computed(() => store.state.luckyNumber);
const loading = computed(() => store.state.loading);
const fetchLuckyNum = async () => {
  store.commit(MutationTypes.UPDATE_LOADING, { loading: true });
  const newLuckyNumber = await fetchLuckyNumber();
  store.commit(MutationTypes.UPDATE_LUCKY_NUM, { newLuckyNumber });
  store.commit(MutationTypes.UPDATE_LOADING, { loading: false });
};

onMounted(() => {
  if (luckyNumber.value === -1) {
    fetchLuckyNum();
  }
});

const state = reactive({
  count: 0,
});

</script>

<style lang="scss">
.top-title {
  text-align: center;
}
.lucky-num {
  margin: 0.5rem;
}
.main-logo {
  width: 20vw;
}
.link {
  display: flex;
  justify-content: center;
  margin: 1.5rem 0 1.5rem 0;
  .link-btn {
  display: inline-block;
  border-radius: 0.3rem;
  padding: 0 1rem;
  line-height: 54px;
  font-size: 1rem;
  font-weight: 500;
  border: 2px solid #3eaf7c;
  transition: background-color .1s ease;
  &.doc {
    color: #ffffff;
    background-color: #3eaf7c;
  }
}
  .link-item {
    text-decoration: none;
    color: #3eaf7c;
    &.doc {
      color: #ffffff;
    }
  }
}
.desc {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 2.5rem;
  img {
    max-width: 100%;
  }
  .features {
    display: flex;
    flex-wrap: wrap;
    box-sizing: border-box;
    border-bottom: 1px solid #eaecef;
    .feature {
      width: 28%;
      flex-shrink: 0;
      padding: 20px 24px;
      color: #3a5169;
      font-weight: 400;
      font-size: 13px;
    }
  }
}
a{
  color: #3eaf7c;
  text-decoration: none;
}
</style>
