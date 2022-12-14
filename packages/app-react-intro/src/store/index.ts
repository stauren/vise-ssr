import { configureStore } from '@reduxjs/toolkit';
import type { ViseIntroState } from './slices/vise-intro';
import viseIntroSliceReducer, { getInitState as getViseIntroInitState } from './slices/vise-intro';

type MyState = {
  viseIntro: ViseIntroState,
};
export function createStore(preloadedState: MyState) {
  return configureStore({
    preloadedState: {
      viseIntro: Object.assign(getViseIntroInitState(), preloadedState.viseIntro),
    },
    reducer: {
      viseIntro: viseIntroSliceReducer,
    },
  });
}

type AppStore = ReturnType<typeof createStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
