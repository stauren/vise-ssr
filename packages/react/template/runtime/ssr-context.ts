import { createContext, useContext } from 'react';
import type { RenderContext } from 'vise-ssr';

type ContextDataValue = Pick<RenderContext, 'meta'|'extra'>;

export type ContextValue = {
  context: ContextDataValue,
  updateContext: (context: ContextDataValue) => void,
};

const defaultContext: ContextValue = {
  context: {
    meta: {},
    extra: {},
  },
  updateContext: () => {},
};

export const SSRContext = createContext(defaultContext);
export const useSSRContext = () => useContext(SSRContext);
