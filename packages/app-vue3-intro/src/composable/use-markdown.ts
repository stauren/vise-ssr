import { defineComponent, h } from 'vue';
import MarkdownViewer from '@/components/markdown-viewer.vue';
import useTitle from '@/composable/use-title';

const defaultTitle = 'Vise: SSR with Vite + TypeScript + Server Hooks';
// const toKebab = (id: string) => id.replace(/([A-Z])/g, (char) => `-${char.toLowerCase()}`);

export default function useMarkdown(
  name: string,
  title: string,
  mdContent: string,
) {
  const { setTitle } = useTitle();
  return {
    FilledMarkdownViewer: defineComponent({
      render() {
        return h(
          'div',
          {
            class: 'theme-default-content',
          },
          h(MarkdownViewer, {
            name,
            title,
            markdown: mdContent,
          }),
        );
      },
    }),
    setTitle() {
      if (title) {
        setTitle(`Vise: ${title}`);
      } else {
        setTitle(defaultTitle);
      }
    },
  };
}
