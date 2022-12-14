import { MutationTree } from 'vuex';
import MutationTypes from './mutation-types';
import { State } from './state';

/* eslint-disable no-param-reassign */
const mutations: MutationTree<State> = {
  [MutationTypes.SET_START_TIME](state, { newTime }: { newTime: number }) {
    state.startTime = newTime;
  },
  [MutationTypes.INCRE_COUNT](state) {
    state.count += 1;
  },
  [MutationTypes.UPDATE_LUCKY_NUM](state, { newLuckyNumber }: { newLuckyNumber: number }) {
    state.luckyNumber = Math.round(newLuckyNumber);
  },
  [MutationTypes.SET_TOC](state, { name, toc }: { name: string, toc: string }) {
    state.sidebarToc = { [name]: toc };
  },
};
/* eslint-enable no-param-reassign */
export default mutations;
