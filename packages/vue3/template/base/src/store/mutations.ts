import { MutationTree } from 'vuex';
import MutationTypes from './mutation-types';
import { State } from './state';

const mutations: MutationTree<State> = {
  [MutationTypes.INCRE_COUNT](state) {
    state.count = state.count + 1;
  },
  [MutationTypes.UPDATE_LUCKY_NUM](state, { newLuckyNumber }: { newLuckyNumber: number}) {
    state.luckyNumber = Math.round(newLuckyNumber);
  },
};
export default mutations;
