import requestRndNum from '@/utils/request';
import formatLuckyNumber from './formatters/lucky-number';

export default async function fetchLuckyNumber(): Promise<number> {
  const result = await requestRndNum();

  if (typeof result === 'number') {
    return formatLuckyNumber(result);
  }
  return -1;
}
