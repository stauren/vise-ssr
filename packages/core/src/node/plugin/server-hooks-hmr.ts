import type { PluginOption, ModuleNode } from 'vite';
import { getActiveServer } from '@vise-ssr/shared';
import { log } from '../utils/log';
import type { ViseDevServer } from '../dev-server';

const SERVER_HOOK_URL = '/src/server-hooks.ts';

function modUpdateServerHooks(modules: ModuleNode[]): ModuleNode | undefined {
  return modules.find((module) => {
    if (module.url === SERVER_HOOK_URL) {
      return true;
    }
    if (module.importers.size === 0) {
      return false;
    }
    return modUpdateServerHooks(Array.from(module.importers)) !== undefined;
  });
}

export default function serverHooksHmr(): PluginOption {
  return {
    name: 'vise:server-hooks-hmr',

    // eslint-disable-next-line consistent-return
    async handleHotUpdate({ modules: mods, read }) {
      const modRelatedToServerHooks = modUpdateServerHooks(mods);
      if (modRelatedToServerHooks) {
        // server-hooks.ts updated, dev server will reimport hooks
        const viseServer = getActiveServer<ViseDevServer>();
        // wait file is written to fs
        await read();
        log('change related to server-hooks detected, reinstall server hooks');
        await viseServer.setupHookLifeCycle();
        log('init a full-page reload');
        viseServer.viteServer?.ws.send({ type: 'full-reload' });
        // no other HMR action needed, server will reload
        return [] as ModuleNode[];
      }
    },
  };
}
