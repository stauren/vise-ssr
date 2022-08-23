import { defineComponent, h } from 'vue';
import MarkdownViewer from '@/components/markdown-viewer.vue';
import useTitle from '@/composable/use-title';
import SIDEBAR_ITEMS from '@/data/sidebar-items.json';

const toKebab = (id: string) => id.replace(/([A-Z])/g, char => `-${char.toLowerCase()}`);
export default function useMarkdown(name: string, mdContent: string) {
  const { setTitle } = useTitle();
  return {
    FilledMarkdownViewer: defineComponent({
      render() {
        return h(
          'div', {
            class: 'theme-default-content',
          },
          h(MarkdownViewer, {
            name,
            markdown: mdContent,
          }),
        );
      },
    }),
    setTitle() {
      const itemId = toKebab(name);
      const matchItem = SIDEBAR_ITEMS.find(item => item.id === itemId);
      let title = 'Vise: SSR with Vite + TypeScript + Server Hooks';
      if (matchItem) {
        title = `Vise: ${matchItem.title}`;
      }
      setTitle(title);
    },
  };
}
