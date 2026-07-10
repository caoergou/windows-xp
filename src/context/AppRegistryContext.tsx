import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { APP_REGISTRY } from '../registry/apps';
import { AppRegistryEntry } from '../types';

export interface AppRegistryContextType {
  /** 当前合并后的应用注册表 */
  registry: Record<string, AppRegistryEntry>;
  /** 注册一个新应用；同 id 会覆盖 */
  registerApp: (entry: AppRegistryEntry) => void;
}

const AppRegistryContext = createContext<AppRegistryContextType | undefined>(undefined);

const defaultRegistryContext: AppRegistryContextType = {
  registry: APP_REGISTRY,
  registerApp: () => { /* no-op: used when rendered outside AppRegistryProvider */ },
};

export const useAppRegistry = (): AppRegistryContextType => {
  const context = useContext(AppRegistryContext);
  return context ?? defaultRegistryContext;
};

const mergeRegistry = (
  userApps: AppRegistryEntry[]
): Record<string, AppRegistryEntry> => {
  const merged: Record<string, AppRegistryEntry> = { ...APP_REGISTRY };
  userApps.forEach(entry => {
    merged[entry.id] = entry;
  });
  return merged;
};

export interface AppRegistryProviderProps {
  children: React.ReactNode;
  /** 自定义应用，会与内置 APP_REGISTRY 合并 */
  apps?: AppRegistryEntry[];
}

export const AppRegistryProvider: React.FC<AppRegistryProviderProps> = ({
  children,
  apps: userApps = [],
}) => {
  const [registry, setRegistry] = useState<Record<string, AppRegistryEntry>>(() =>
    mergeRegistry(userApps)
  );

  const registerApp = useCallback((entry: AppRegistryEntry) => {
    setRegistry(prev => ({ ...prev, [entry.id]: entry }));
  }, []);

  const value = useMemo<AppRegistryContextType>(
    () => ({ registry, registerApp }),
    [registry, registerApp]
  );

  return (
    <AppRegistryContext.Provider value={value}>
      {children}
    </AppRegistryContext.Provider>
  );
};
