import type { LuckNumFetchResult } from '../types';
import request from './utils/request';
import formatLuckyNumber from './formatters/lucky-number';

export function mockFetchTime(): Promise<number> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(Date.now());
    }, 500);
  });
}

export async function fetchLuckyNumber(): Promise<number> {
  const result = await request(
    'https://www.randomnumberapi.com/api/v1.0/random?min=1000&max=9999&count=1',
  ) as LuckNumFetchResult;

  if (result?.code === 0) {
    return formatLuckyNumber(result);
  }
  return -1;
}
