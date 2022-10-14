import { SsrFetchResult } from 'vise-ssr';
import { IS_SSR } from '@/data/env';

export default async function getRandom({ url }: { url: string}): Promise<SsrFetchResult> {
  let result: SsrFetchResult;
  // IS_SSR 代表服务端执行阶段
  if (IS_SSR) {
    result = await fetchDataForSsrRender();
  } else {
    result = await getRandomNum();
  }
  if (result.code === 0) {
    return result;
  }
  throw `fetch fail: ${JSON.stringify(result)}`;
}

export function fetchDataForSsrRender() {
  return getRandomNum();
};

export function getRandomNum() {
  return Promise.resolve({ code: 0, msg: 'ok', data: { value: Math.floor(Math.random() * 10000) + 1 } });
}
