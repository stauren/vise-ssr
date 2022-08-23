import request from '@/utils/request';
import { LuckNumFetchResult } from '../types';
import { formatLuckyNumber } from './formatters/lucky-number';

export function mockFetchTime(): Promise<number> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(Date.now());
    }, 500);
  });
}

export async function fetchLuckyNumber(): Promise<number> {
  const result = await request({
    url: 'https://vise.com/random-num',
  }) as LuckNumFetchResult ;

  if (result?.code === 0) {
    return formatLuckyNumber(result);
  }
  return -1;
}
