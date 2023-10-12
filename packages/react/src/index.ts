import type { PluginOption } from 'vite';
import reactPlugin from '@vitejs/plugin-react-swc';
import type {
  ParsedViseConfig,
} from '@vise-ssr/shared';
import { viseScaffold } from '@vise-ssr/shared';
import { SCAFFOLD_FILES, getScaffoldModules } from './scaffold-generator';
import creator from './creator';

function getScaffoldPlugins(appRoot: string, isProduction: boolean, userConfig: ParsedViseConfig) {
  return [
    viseScaffold({
      modules: getScaffoldModules(appRoot, isProduction, userConfig),
    }) as PluginOption,
    reactPlugin(),
  ];
}

export {
  SCAFFOLD_FILES,
  getScaffoldPlugins,
  creator,
};
