import { describe, it, expect, vi } from 'vitest';
import ReactTestRenderer from 'react-test-renderer';
import { renderWithProviders, findByClassName } from '@/utils/test-utils';
import IndexPage from '../index';

vi.mock('@/data/env', () => ({
  IS_SSR: false,
}));

function toJSON(component: ReactTestRenderer.ReactTestRenderer) {
  const result = component.toJSON();
  expect(result).toBeDefined();
  expect(result).not.toBeInstanceOf(Array);
  return result as ReactTestRenderer.ReactTestRendererJSON;
}

describe('index', () => {
  const renderer = renderWithProviders(<IndexPage />, {
    preloadedState: {
      viseIntro: {
        startTime: -1,
        renderEndTime: -1,
        count: 0,
        luckyNumber: 100,
      },
    },
  });

  const tree = toJSON(renderer);

  it('UI render correct', () => {
    expect(tree.props.className).toMatch('page-index');;
  });

  it('luckynumber 正确显示', () => {
    const el = findByClassName(tree, 'lucky-num');
    expect(el!.children!.join('')).toBe('Lucky Number from API: 100');
  });
});

