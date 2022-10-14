import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import IndexPage from '../index.vue';

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

vi.mock('@/services', () => ({
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
