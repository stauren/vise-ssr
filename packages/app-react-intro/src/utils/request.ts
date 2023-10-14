import { IS_SSR } from '@/data/env';

function genRandomNum() {
  return Math.floor(Math.random() * 10000) + 1;
}

export default async function requestRndNum(): Promise<number | undefined> {
  let result: number;
  if (IS_SSR) {
    // different data fetch method could be use in node.js server
    result = genRandomNum();
  } else {
    result = genRandomNum();
  }
  return result;
}
