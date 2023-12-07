import { ActionTree } from 'vuex';
import * as services from '@/services';
import { State } from './state';
import MutationTypes from './mutation-types';

const actions: ActionTree<State, State> = {
  async getNewTime({ commit }) {
    const newTime = await services.mockFetchTime();
    commit(MutationTypes.SET_START_TIME, { newTime });
  },
};

export default actions;
