import { useState } from 'react';
import type { RenderContext } from 'vise-ssr';
import '@/styles/page-index.scss';
import { useAppDispatch, useAppSelector } from '@/hooks/store';
import {
  selectCount,
  selectLuckyNumber,
  increaseCount,
  setLuckyNumber,
} from '@/store/slices/vise-intro';
import { fetchLuckyNumber } from '@/services';

type PageIndexAttr = {
  ssrContext: {
    context: Pick<RenderContext, 'meta' | 'extra'>,
    updateContext: (context: Pick<RenderContext, 'meta' | 'extra'>) => void,
  }
};
function PageIndex({ ssrContext: { context, updateContext } }: PageIndexAttr) {
  const dispatch = useAppDispatch();

  const [localCount, setCount] = useState(0);

  const luckyNumber = useAppSelector(selectLuckyNumber);
  const [luckyNumberToDisplay, setLuckyNumberToDisplay] = useState(String(luckyNumber));
  const updateLuckyNumber = () => {
    setLuckyNumberToDisplay('--');
    setTimeout(() => {
      // avoid @typescript-eslint/no-misused-promises error
      (async () => {
        const num = await fetchLuckyNumber();
        dispatch(setLuckyNumber(num));
        setLuckyNumberToDisplay(String(num));
      })();
    }, 100);
  };

  const countInStore = useAppSelector(selectCount);
  const title = 'Vise: SSR with Vite + TypeScript + Server Hooks';
  updateContext({
    ...context,
    meta: {
      ...context.meta,
      title,
    },
  });

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
          Lucky Number from API:
          { luckyNumberToDisplay }
        </div>
        <button type="button" onClick={() => setCount((localCountVar) => localCountVar + 1)}>
          local count is:
          { localCount }
        </button>
        &nbsp;
        <button type="button" onClick={() => dispatch(increaseCount())}>
          store count is:
          { countInStore }
        </button>
        &nbsp;
        <button type="button" onClick={() => updateLuckyNumber()}>
          fetch again
        </button>
      </div>
      <div className="link">
        <div className="link-btn doc">
          <a
            target="_blank"
            className="link-item doc"
            rel="noreferrer"
            href="https://stauren.github.io/vise-ssr/"
          >
            Documents
          </a>
        </div>
        &nbsp;&nbsp;&nbsp;
        <div className="link-btn">
          <a
            target="_blank"
            className="link-item"
            rel="noreferrer"
            href="https://github.com/stauren/vise-ssr"
          >
            Git Source
          </a>
        </div>
      </div>
      <div className="desc">
        <p>
          Vise (pronounced [vaɪs]) is an isomorphic Web SSR framework based on
          <a href="https://vitejs.dev/" rel="noreferrer" target="_blank">Vite</a>
          , dedicated to provide an out of the box SSR develop experience as easy as SPA.
          It can work with multiple web user interface libraries such as React, Vue.
          By abstract app specific logic into server hooks, multiple apps could be deployed
          onto the same server and multiple hooks could be combined
          as special purpose hooks plugins.
        </p>
        <h1>Features</h1>
        <div className="features">
          <section className="feature">
            💡 &nbsp; Vite based dev server, start in a blink, full ESM support
          </section>
          <section className="feature">
            💻 &nbsp; Express Server supported
          </section>
          <section className="feature">
            🛠️ &nbsp; vise command-line tool, whole dev life cycle support
          </section>
          <section className="feature">
            🔩 &nbsp; tapable based server hooks and plugin for hooks
          </section>
          <section className="feature">
            🔤 &nbsp; 100% TypeScript
          </section>
          <section className="feature">
            📃 &nbsp; vise-ssr on npm
          </section>
        </div>
      </div>
    </div>
  );
}

export default PageIndex;
