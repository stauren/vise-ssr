import request from '@/utils/request';
import type { LuckNumFetchResult } from './formatters';
import { formatLuckyNumber } from './formatters';

export async function fetchLuckyNumber(): Promise<number> {
  const result = await request({
    url: 'https://vise.com/random-num',
  }) as LuckNumFetchResult ;

  if (result?.code === 0) {
    return formatLuckyNumber(result);
  }
  return -1;
}
