
declare module 'esbuild-plugin-alias' {
  import type { Plugin } from 'esbuild';

  const aliasTyped: (opts: Record<string, string>) => Plugin;

  export default aliasTyped;
}
