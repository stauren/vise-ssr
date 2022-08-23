import { computed } from 'vue';
import { useStore, MutationTypes } from '@/store/';

export default function useCount() {
  const store = useStore();
  function increaseCount() {
    store.commit(MutationTypes.INCRE_COUNT);
  }
  return {
    count: computed(() => store.state.count),
    increaseCount,
  };
}
