import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '..';
import { IS_SSR } from '@/data/env';

// Define a type for the slice state
export interface ViseIntroState {
  startTime: number
  renderEndTime: number
  count: number
  luckyNumber: number
}

// Define the initial state using that type
export function getInitState(): ViseIntroState {
  return {
    startTime: IS_SSR ? Date.now() : -1,
    renderEndTime: -1,
    count: 0,
    luckyNumber: -1,
  };
}

export const viseIntroSlice = createSlice({
  name: 'viseIntro',
  // `createSlice` will infer the state type from the `initialState` argument
  initialState: getInitState(),
  reducers: {
    increaseCount: (state) => {
      state.count += 1;
    },
    // Use the PayloadAction type to declare the contents of `action.payload`
    setLuckyNumber: (state, action: PayloadAction<number>) => {
      state.luckyNumber = action.payload;
    },
  },
});

export const { increaseCount, setLuckyNumber } = viseIntroSlice.actions;

// Other code such as selectors can use the imported `RootState` type
export const selectCount = (state: RootState) => state.viseIntro.count;
export const selectLuckyNumber = (state: RootState) => state.viseIntro.luckyNumber;
export const selectRenderEndTime = (state: RootState) => state.viseIntro.renderEndTime;
export const selectStartTime = (state: RootState) => state.viseIntro.startTime;

export default viseIntroSlice.reducer;
