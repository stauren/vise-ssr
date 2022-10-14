import request from '@/utils/request';
import type { LuckNumFetchResult } from './formatters';
import { formatLuckyNumber } from './formatters';

export async function fetchLuckyNumber(): Promise<number> {
  const result = await request({
    url: 'https://www.randomnumberapi.com/api/v1.0/random?min=1000&max=9999&count=1',
  }) as LuckNumFetchResult ;

  if (result?.code === 0) {
    return formatLuckyNumber(result);
  }
  return -1;
}
