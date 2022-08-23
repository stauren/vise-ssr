import { IS_SSR } from '@/data/env';
import { useSSRContext } from 'vue';

let title = '';
export default function useTitle() {
  const setTitle = (newTitle: string) => {
    title = newTitle;
    if (IS_SSR) {
      const ssrContext = useSSRContext()!;
      ssrContext.title = newTitle;
      return;
    }
    document.title = newTitle;
  };

  return {
    title,
    setTitle,
  };
}
