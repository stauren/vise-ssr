import {
  SsrFetchResultOf,
} from 'vise-ssr';
import getRandom from '@/utils/request';

type LuckNumFetchResult = SsrFetchResultOf<{ value: number | string }>;

export async function fetchLuckyNumber(): Promise<number> {
  const result = await getRandom() as LuckNumFetchResult ;

  if (result?.code === 0) {
    return parseInt(String(result.data.value), 10);
  }
  throw `fetch fail: ${JSON.stringify(result)}`;
}
