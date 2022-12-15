import axios from 'axios';
import { IS_SSR } from '@/data/env';

function genRandomNum() {
  return Math.floor(Math.random() * 10000) + 1;
}

export default async function requestRndNum(): Promise<number | undefined> {
  let result;
  try {
    const num = (await axios({
      url: 'https://www.randomnumberapi.com/api/v1.0/random?min=1&max=10000',
      timeout: IS_SSR ? 1500 : 5000,
    })).data;
    if (num && typeof num[0] === 'number') {
      result = num[0] as number;
    }
  } catch {
    // ignore
  }

  if (!result && IS_SSR) {
    result = genRandomNum();
  }
  return result;
}
