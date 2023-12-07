// eslint-disable-next-line import/no-extraneous-dependencies
import 'vite/client';
import { Store } from 'vuex';
import { State } from '../src/store/state';

declare module '@vue/runtime-core' {
  // provide typings for `this.$store`
  interface ComponentCustomProperties {
    $store: Store<State>;
  }
}
declare module '*.json' {
  const value: any;
  export default value;
}

type MarkdownRenderResult = {
  toc: string,
  content: string,
};
