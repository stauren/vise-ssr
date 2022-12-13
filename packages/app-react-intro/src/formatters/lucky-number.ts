import type { SsrFetchResultOf } from 'vise-ssr';

type LuckNumFetchResult = SsrFetchResultOf<{ value: number | string }>;

export default function formatLuckyNumber(result: LuckNumFetchResult) {
  return parseInt(String(result.data.value), 10);
}
