import requestRndNum from './utils/request';
import formatLuckyNumber from './formatters/lucky-number';

export function mockFetchTime(): Promise<number> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(Date.now());
    }, 500);
  });
}

export async function fetchLuckyNumber(): Promise<number> {
  const result = await requestRndNum();

  if (result) {
    return formatLuckyNumber(result);
  }
  return -1;
}
