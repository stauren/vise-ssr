import { useState } from 'react';
import type { RenderContext } from 'vise-ssr';
import '@/styles/pages/index.scss';
import { useAppDispatch, useAppSelector } from '@/hooks/store';
import {
  selectCount,
  selectLuckyNumber,
  increaseCount,
  setLuckyNumber,
} from '@/store/slices/vise-intro';
import { fetchLuckyNumber } from '@/services';
import BenchmarkNav from '@/components/benchmark-nav';

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
  updateContext({
    ...context,
    meta: {
      ...context.meta,
      title,
    },
  });

  return (
    <div className="theme-default-content">
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
      <BenchmarkNav/>
    </div>
  );
}

export default PageIndex;
