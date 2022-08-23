import { configureStore } from '@reduxjs/toolkit';
import { mergeConfig } from '@vise-ssr/shared/client';
import viseIntroSlice, { getInitState as getViseIntroInitState } from './slices/vise-intro';

export function createStore(preloadedState: any) {
  const defaultState = {
    viseIntro: getViseIntroInitState(),
  };
  return configureStore({
    preloadedState: mergeConfig(defaultState, preloadedState),
    reducer: {
      viseIntro: viseIntroSlice,
    },
  });
}

type AppStore = ReturnType<typeof createStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
