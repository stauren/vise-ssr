import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import SiteSidebar from '../site-sidebar.vue';
import SIDEBAR_ITEMS from '@/data/sidebar-items.json';

const sidebarToc: Record<string, string> = {
  introduction: '<p>intro content</p>',
  startDevelop: '<p>start develop content</p>',
  dataFetch: '<p>data fetch content</p>',
  unitTest: '<p>unit test content</p>',
  serverApi: '<p>server api content</p>',
  cacheKey: '<p>ssr cache</p>',
  viseConfig: '<p>vise config</p>',
  docResource: '<p>doc resource</p>',
  tapableHooks: '<p>tapable hooks</p>',
  commandlineTool: '<p>commandline tool</p>',
  keyDataTypes: '<p>key data types</p>',
  viseReact: '<p>vise react</p>',
};

vi.mock('@/store/index', () => ({
  useStore: () => ({
    state: {
      sidebarToc,
    },
  }),
}));

describe('site-sidebar', () => {
  const wrapper = mount(SiteSidebar, {
    global: {
      mocks: {
      },
      stubs: {
        RouterLink: true,
      },
    },
  });
  it('UI render correct', () => {
    // const toKebab = (id: string) => id.replace(/([A-Z])/g, char => `-${char.toLowerCase()}`);
    const toCamel = (id: string) => id.replace(/-([a-z])/g, (whole, match) => match.toUpperCase());
    SIDEBAR_ITEMS.forEach((item) => {
      const contentCtn = wrapper.find(`#sidebar-${item.id} + div`);
      expect(contentCtn.html()).toContain(sidebarToc[toCamel(item.id)]);
    });
  });
});
