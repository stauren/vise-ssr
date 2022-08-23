import useCount from '../use-count';

jest.mock('@/data/env', () => ({
  IS_SSR: false,
}));
jest.mock('@/store/', () => {
  const originModule = jest.requireActual('@/store/');

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
