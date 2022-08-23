import { createContext, useContext } from 'react';

const defaultContext = {
  userAgent: '',
  cookies: '',
  extra: {},
};

export type ContextValue = typeof defaultContext;
export const SSRContext = createContext(defaultContext);
export const useSSRContext = () => useContext(SSRContext);
