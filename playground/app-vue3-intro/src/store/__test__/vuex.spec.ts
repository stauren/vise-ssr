import {
  describe, it, expect, vi,
} from 'vitest';
import { createStore, MutationTypes } from '..';

vi.mock('@/data/env', () => ({
  IS_SSR: false,
}));

const store = createStore();

describe('app-vise-intro-store', () => {
  it('count mutation 后正确变动', () => {
    expect(store.state.count).toBe(0);
    store.commit(MutationTypes.INCRE_COUNT);
    expect(store.state.count).toBe(1);
  });
});
