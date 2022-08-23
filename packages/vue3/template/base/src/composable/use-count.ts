import { computed } from 'vue';
import { useStore } from '@/store/';

export default function useCount() {
  const store = useStore();
  function increaseCount() {
    store.dispatch('increaseCount');
  }
  return {
    count: computed(() => store.state.count),
    increaseCount,
  };
}
