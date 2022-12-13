import { LuckNumFetchResult } from '../../types';

export default function formatLuckyNumber(result: LuckNumFetchResult) {
  return parseInt(String(result.data.value), 10);
}
