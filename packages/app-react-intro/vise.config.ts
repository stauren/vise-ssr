import type { ViseConfig } from 'vise-ssr';

const config: ViseConfig = {
  base: '/react/',
  routerBase: '/react/',
  strictInitState: false,
  scaffold: 'react-app',
  customTemplate: './index.html',
  ssr: {
    external: ['axios'],
    noExternal: [],
  },
};
export default config;
