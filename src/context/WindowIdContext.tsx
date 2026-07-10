import React, { createContext, useContext } from 'react';

const WindowIdContext = createContext<string | undefined>(undefined);

/**
 * Read the id of the window that wraps the current app component.
 *
 * This is preferred over the `windowId` prop because it works through
 * Suspense, memo, and HOC wrappers.
 */
export const useWindowId = (): string | undefined => useContext(WindowIdContext);

export interface WindowIdProviderProps {
  windowId: string;
  children: React.ReactNode;
}

export const WindowIdProvider: React.FC<WindowIdProviderProps> = ({ windowId, children }) => (
  <WindowIdContext.Provider value={windowId}>{children}</WindowIdContext.Provider>
);
