import { useState } from 'react';
import '@/styles/page-index.scss';
import { useAppDispatch, useAppSelector } from '@/hooks/store';
import {
  selectCount,
  selectLuckyNumber,
  increaseCount,
  setLuckyNumber,
} from '@/store/slices/vise-intro';
import { fetchLuckyNumber } from '@/services';

function PageIndex() {
  const dispatch = useAppDispatch();

  const [localCount, setCount] = useState(0);

  const luckyNumber = useAppSelector(selectLuckyNumber);
  const [luckyNumberToDisplay, setLuckyNumberToDisplay] = useState(String(luckyNumber));
  const updateLuckyNumber = () => {
    setLuckyNumberToDisplay('--');
    setTimeout(() => {
      // 额外包装一层是为了规避 @typescript-eslint/no-misused-promises 报错
      (async () => {
        const num = await fetchLuckyNumber();
        dispatch(setLuckyNumber(num));
        setLuckyNumberToDisplay(String(num));
      })();
    }, 100);
  };

  const countInStore = useAppSelector(selectCount);
  const title = 'Vise: SSR with Vite + TypeScript + Server Hooks';

  return (
    <div className="theme-default-content page-index">
      <div className="top-title">
        <h1>React Version</h1>
        <h1>{ title }</h1>
        <p>
          <img
            className="main-logo"
            src="./logo.svg"
            alt="logo"
          />
        </p>
        <div className="lucky-num">
          Lucky Number from API: { luckyNumberToDisplay }
        </div>
        <button onClick={() => setCount(localCount => localCount + 1)}>
          local count is: { localCount }
        </button>&nbsp;
        <button onClick={() => dispatch(increaseCount())}>
          store count is: { countInStore }
        </button>&nbsp;
        <button onClick={() => updateLuckyNumber()}>
          fetch again
        </button>
      </div>
      <div style={{ textAlign: 'center', fontSize: '22px', margin: '20px' }}>
        This page is rendered with vise react. More documents coming soon...
      </div>
      <div className="link">
        <div className="link-btn doc">
          <a
            target="_blank"
            className="link-item doc"
            href="https://stauren.github.io/vise-ssr/"
          >项目文档</a>
        </div>&nbsp;&nbsp;&nbsp;
        <div className="link-btn">
          <a
            target="_blank"
            className="link-item"
            href="https://github.com/stauren/vise-ssr"
          >Git Soure</a>
        </div>
      </div>
      <div className="desc">
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
        <div className="features">
          <section className="feature">
            💡 &nbsp; 底层使用 Vite, 开发服务器秒启, 全面支持 ESM
          </section>
          <section className="feature">
            💻 &nbsp; 已支持 Express 服务器
          </section>
          <section className="feature">
            🛠️ &nbsp; 提供命令行工具，覆盖业务 App 开发全周期
          </section>
          <section className="feature">
            🔩 &nbsp; 基于 tapable 的服务端 hooks，插件化开发
          </section>
          <section className="feature">
            🔤 &nbsp; 全面使用 TypeScript
          </section>
          <section className="feature">
            📃 &nbsp; 已发布 vise-ssr 到 npm
          </section>
        </div>
      </div>
    </div>
  );
}

export default PageIndex;
