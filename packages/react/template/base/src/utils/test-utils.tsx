import React from 'react';
import type { PreloadedState } from '@reduxjs/toolkit';
// eslint-disable-next-line import/no-extraneous-dependencies
import ReactTestRenderer from 'react-test-renderer';
import { Provider } from 'react-redux';

import { createStore } from '@/store/';
import type { AppStore, RootState } from '@/store/';

// This type interface extends the default options for render from RTL, as well
// as allows the user to specify other things such as initialState, store.
interface ExtendedRenderOptions {
  preloadedState?: PreloadedState<RootState>
  store?: AppStore
}

export function renderWithProviders(
  component: React.ReactElement,
  {
    preloadedState,
    // Automatically create a store instance if no store was passed in
    store = createStore(preloadedState),
  }: ExtendedRenderOptions = {},
) {
  function Wrapper(): JSX.Element {
    return <Provider store={store}>{ component }</Provider>;
  }

  return ReactTestRenderer.create(<Wrapper />);
}

export function findByClassName(root: ReactTestRenderer.ReactTestRendererJSON, className: string) {
  let nextNodes: ReactTestRenderer.ReactTestRendererNode[] | undefined;
  const waitingChildren: ReactTestRenderer.ReactTestRendererNode[][] = [[root]];
  const regClassName = new RegExp(`\\b${className}\\b`);
  do {
    nextNodes = waitingChildren.shift();
    /* eslint-disable no-continue */
    if (!nextNodes) continue;
    // eslint-disable-next-line no-restricted-syntax
    for (const node of nextNodes) {
      if (typeof node === 'string') continue;
      /* eslint-enable no-continue */
      if (node.props?.className?.match(regClassName)) return node;
      if (node.children) {
        waitingChildren.push(node.children);
      }
    }
  } while (waitingChildren.length > 0);
  return null;
}

