import {
  describe, it, expect, vi,
} from 'vitest';
import useCount from '../use-count';

vi.mock('@/data/env', () => ({
  IS_SSR: false,
}));

vi.mock('@/store/index', async () => {
  const originModule = await vi.importActual<typeof import('@/store/')>('@/store/');

  return {
    ...originModule,
    useStore: () => originModule.createStore(),
  };
});

describe('app-vue3-intro-useCount', () => {
  it('useCount 功能', () => {
    const { count, increaseCount } = useCount();
    expect(count.value).toBe(0);
    increaseCount();
    expect(count.value).toBe(1);
  });
});
