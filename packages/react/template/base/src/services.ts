import requestRndNum from '@/utils/request';
import { formatLuckyNumber } from './formatters';

export async function fetchLuckyNumber(): Promise<number> {
  const result = await requestRndNum();

  if (typeof result === 'number') {
    return formatLuckyNumber(result);
  }
  return -1;
}

export function otherService() {}
