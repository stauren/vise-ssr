import { ActionTree } from 'vuex';
import { State } from './state';
import MutationTypes from './mutation-types';

const actions: ActionTree<State, State> = {
  async increaseCount({ commit }) {
    commit(MutationTypes.INCRE_COUNT);
  },
};

export default actions;
