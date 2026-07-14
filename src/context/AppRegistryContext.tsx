import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from 'react';
import { APP_REGISTRY } from '../registry/apps';
import { AppRegistryEntry } from '../types';

export interface AppRegistryContextType {
  /** Currently merged application registry */
  registry: Record<string, AppRegistryEntry>;
  /** Register a new app; same id will overwrite */
  registerApp: (entry: AppRegistryEntry) => void;
}

const AppRegistryContext = createContext<AppRegistryContextType | undefined>(undefined);

const defaultRegistryContext: AppRegistryContextType = {
  registry: APP_REGISTRY,
  registerApp: () => {
    /* no-op: used when rendered outside AppRegistryProvider */
  },
};

export const useAppRegistry = (): AppRegistryContextType => {
  const context = useContext(AppRegistryContext);
  return context ?? defaultRegistryContext;
};

const mergeRegistry = (userApps: AppRegistryEntry[]): Record<string, AppRegistryEntry> => {
  const merged: Record<string, AppRegistryEntry> = { ...APP_REGISTRY };
  userApps.forEach(entry => {
    merged[entry.id] = entry;
  });
  return merged;
};

export interface AppRegistryProviderProps {
  children: React.ReactNode;
  /** Custom apps, merged with the built-in APP_REGISTRY */
  apps?: AppRegistryEntry[];
}

export const AppRegistryProvider: React.FC<AppRegistryProviderProps> = ({
  children,
  apps: userApps = [],
}) => {
  // Runtime registrations (via registerApp) are tracked separately so they
  // survive a re-merge when the `apps` prop changes (#122).
  const runtimeAppsRef = useRef<Record<string, AppRegistryEntry>>({});

  const rebuild = useCallback((): Record<string, AppRegistryEntry> => {
    // Precedence: built-ins < runtime registrations < `apps` prop (prop wins).
    const merged: Record<string, AppRegistryEntry> = { ...APP_REGISTRY, ...runtimeAppsRef.current };
    (userApps ?? []).forEach(entry => {
      merged[entry.id] = entry;
    });
    return merged;
  }, [userApps]);

  const [registry, setRegistry] = useState<Record<string, AppRegistryEntry>>(() =>
    mergeRegistry(userApps ?? [])
  );

  const registerApp = useCallback((entry: AppRegistryEntry) => {
    runtimeAppsRef.current = { ...runtimeAppsRef.current, [entry.id]: entry };
    setRegistry(prev => ({ ...prev, [entry.id]: entry }));
  }, []);

  // Re-merge when the set of `apps` prop ids changes so apps added/removed
  // after mount take effect (previously mount-only, #122).
  const appsKey = (userApps ?? []).map(a => a.id).join('|');
  useEffect(() => {
    setRegistry(rebuild());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appsKey]);

  const value = useMemo<AppRegistryContextType>(
    () => ({ registry, registerApp }),
    [registry, registerApp]
  );

  return <AppRegistryContext.Provider value={value}>{children}</AppRegistryContext.Provider>;
};
