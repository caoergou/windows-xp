/**
 * Provider context (#148/#149).
 *
 * Threads the host-supplied `providers` prop through the React tree so any
 * component (QQ chat, IE content view) can access the chat / moderation /
 * webContent backends without prop-drilling.
 */
import React, { createContext, useContext, useMemo } from 'react';
import type { XPProviders } from './types';

const EMPTY: XPProviders = {};

const ProviderCtx = createContext<XPProviders>(EMPTY);

export interface ProviderContextProps {
  providers?: XPProviders;
  children: React.ReactNode;
}

export const ProviderProvider: React.FC<ProviderContextProps> = ({ providers, children }) => {
  const value = useMemo(() => providers ?? EMPTY, [providers]);
  return <ProviderCtx.Provider value={value}>{children}</ProviderCtx.Provider>;
};

export function useProviders(): XPProviders {
  return useContext(ProviderCtx);
}
