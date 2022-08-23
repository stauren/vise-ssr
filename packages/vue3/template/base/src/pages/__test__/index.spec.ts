import { mount } from '@vue/test-utils';
import IndexPage from '../index.vue';

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

jest.mock('@/services', () => ({
  fetchLuckyNumber: () => 100,
}));

describe('index', () => {
  const wrapper = mount(IndexPage);
  it('UI render correct', () => {
    expect(wrapper.html()).toContain('top-title');
  });

  it('luckynumber 正确显示', () => {
    const el = wrapper.find('.lucky-num');
    expect(el.text()).toBe('Lucky Number from API: 100');
  });
});
