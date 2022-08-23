import { getRandomNum } from '../request';

jest.mock('@/data/env', () => ({
  IS_SSR: false,
}));

type GetRandomNumResult = {
  code: number,
  msg: string,
  data: {
    value: number,
  }
};

describe('getRandom 功能测试', () => {
  it('返回一个1-10000的随机数', async () => {
    const result = (await getRandomNum()) as GetRandomNumResult;
    const { value } = result.data;
    expect(value).toBeGreaterThanOrEqual(1);
    expect(value).toBeLessThanOrEqual(10000);
  });
});
