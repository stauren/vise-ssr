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
  </div>
  <div class="link">
    <div class="link-btn doc">
      <a
        target="_blank"
        class="link-item doc"
        href="https://vise.com/"
      >项目文档</a>
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
      Vise 读音[vaɪs]，是一个同构 SSR 开发框架，致力于打造开箱即用的同构 Web 页面开发体验。通过插件化方式，支持任意服务端框架与任意前端框架的组合使用。
      使用基于 esm、速度更快的 vite 代替常见 Webpack 作为开发构建工具，提供命令行工具支持一站式的开发、构建、发布 Web 应用，让业务项目可以关注在业务功能实现上。项目基于全方位 ESM 及 TypeScript。
    </p>
    <p>
      Vise 将服务端渲染拆分为多个核心阶段，为每个阶段提供了基于 tapable 的 hooks，不管是服务端实现方、业务 app 实现方还是插件实现方，
      都可以将自己的逻辑通过 hooks 扩展纳入。Vise 同时基于 hooks 提供了可重用的 plugin 插件。
    </p>
    <p>Vise 使用了较多在其开发日期 (2021年) 比较新的概念和技术，尽量面向未来进行开发，have fun.</p>
    <h1>特点</h1>
    <div class="features">
      <section class="feature">
        💡 &nbsp; 底层使用 Vite, 开发服务器秒启, 全面支持 ESM
      </section>
      <section class="feature">
        💻 &nbsp; 已支持 Express 服务器
      </section>
      <section class="feature">
        🛠️ &nbsp; 提供命令行工具，覆盖业务 App 开发全周期
      </section>
      <section class="feature">
        🔩 &nbsp; 基于 tapable 的服务端 hooks，插件化开发
      </section>
      <section class="feature">
        🔤 &nbsp; 全面使用 TypeScript
      </section>
      <section class="feature">
        📃 &nbsp; 已发布 vise-ssr 到 npm
      </section>
    </div>
    <h1>整体设计</h1>
    <p>
      <img
        src="https://cdn.rawgit.com/stauren/vise-ssr/main/packages/app-vue3-intro/public/ssr.drawio.png"
        alt="Vise SSR framework 整体设计"
      >
    </p>
  </div>
</template>
<script lang="ts" setup>
import { reactive, computed, onMounted } from 'vue';
import useCount from '@/composable/use-count';
import { useStore, MutationTypes } from '@/store/';
import { fetchLuckyNumber } from '@/services';

const store = useStore();
const { count, increaseCount } = useCount();

const luckyNumber = computed(() => store.state.luckyNumber);
const fetchLuckyNum = async () => {
  const newLuckyNumber = await fetchLuckyNumber();
  store.commit(MutationTypes.UPDATE_LUCKY_NUM, { newLuckyNumber });
};

onMounted(() => {
  if (luckyNumber.value === -1) {
    fetchLuckyNum();
  }
})

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
