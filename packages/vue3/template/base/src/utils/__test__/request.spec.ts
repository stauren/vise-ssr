import {
  describe, it, expect, vi,
} from 'vitest';
import requestRndNum from '../request';

vi.mock('@/data/env', () => ({
  IS_SSR: true,
}));

describe('getRandom 功能测试', () => {
  it('返回一个1-10000的随机数', async () => {
    const result = await requestRndNum();
    expect(result).toBeGreaterThanOrEqual(1);
    expect(result).toBeLessThanOrEqual(10000);
  });
});
