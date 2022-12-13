import type { SsrFetchResultOf } from 'vise-ssr';

export type LuckNumFetchResult = SsrFetchResultOf<{ value: number | string }>;

export function formatLuckyNumber(result: LuckNumFetchResult) {
  return parseInt(String(result.data.value), 10);
}
