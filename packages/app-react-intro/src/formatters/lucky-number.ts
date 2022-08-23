import { LuckNumFetchResult } from '../../types';

export function formatLuckyNumber(result: LuckNumFetchResult) {
  return parseInt(String(result.data.value), 10);
};
