declare module 'postcss-pxtorem' {
  import { Plugin } from 'postcss';

  export type TPxToRemOptions = {
    rootValue?: number;
    unitPrecision?: number;
    propList?: string[];
    selectorBlackList?: string[];
    replace?: boolean;
    mediaQuery?: boolean;
    minPixelValue?: number;
    exclude?: RegExp;
  };

  interface PxToRem {
    postcss: boolean;
    (options: TPxToRemOptions): Plugin;
  }

  const defaultFunc: PxToRem;
  export default defaultFunc;
}
