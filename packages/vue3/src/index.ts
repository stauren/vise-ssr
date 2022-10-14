
import type { PluginOption } from 'vite';
import vuePlugin from '@vitejs/plugin-vue';
import type { RouteComponent, Router, RouteLocationNormalized } from 'vue-router';
import type {
  ParsedViseConfig,
  HttpHeaders,
} from '@vise-ssr/shared';
import { viseScaffold } from '@vise-ssr/shared';

import { SCAFFOLD_FILES, getScaffoldModules } from './scaffold-generator';
import creator from './creator';

type FetchSuccess<T> = (store: T) => void;
type FetchFail = Error;
type FetchResult<T> = Promise<FetchSuccess<T> | FetchFail>;

type ViseRouteComponent<T> = RouteComponent & {
  setup: (...args: any[]) => any; // 只是为重载使用，不关心具体参数类型
  fetch: ({ to, headers }: {
    to: RouteLocationNormalized,
    headers: HttpHeaders,
  }) => FetchResult<T>
};

interface ViseRouter extends Router {
  $ssrContext?: {
    // fetcher?: SsrServerFetcher,
    headers: HttpHeaders,
  },
}

function getScaffoldPlugins(appRoot: string, isProduction: boolean, userConfig: ParsedViseConfig) {
  return [
    viseScaffold({
      modules: getScaffoldModules(appRoot, isProduction, userConfig),
    }) as PluginOption,
    vuePlugin({
      // ssr: true,
      template: {
        compilerOptions: {
          directiveTransforms: userConfig.directiveTransforms,
          whitespace: 'condense',
          comments: false,
        },
      },
    }),
  ];
}

export type {
  ViseRouteComponent,
  ViseRouter,
};

export {
  SCAFFOLD_FILES,
  getScaffoldPlugins,
  creator,
};
