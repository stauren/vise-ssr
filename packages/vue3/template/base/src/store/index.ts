import { InjectionKey } from 'vue';
import {
  createStore as baseCreateStore,
  useStore as baseUseStore,
  Store,
} from 'vuex';
import type { State } from './state';
import state from './state';
import mutations from './mutations';
import actions from './actions';

import MutationTypes from './mutation-types';

type MyStore = Store<State>;
const key: InjectionKey<MyStore> = Symbol();

function useStore() {
  return baseUseStore(key);
}

function createStore() {
  return baseCreateStore<State>({
    state,
    actions,
    mutations,
  });
}

export {
  key,
  State,
  MyStore,
  useStore,
  createStore,
  MutationTypes,
};
