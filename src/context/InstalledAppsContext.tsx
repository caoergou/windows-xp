import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useStorage } from './StorageContext';

/** A product registered as "installed" by the SetupWizard flow (#142). */
export interface InstalledProduct {
  /** Registry key / stable id */
  id: string;
  /** i18n key for display name */
  nameKey: string;
  /** XPIcon name */
  icon?: string;
  /** Publisher */
  publisher?: string;
  /** Version string */
  version?: string;
  /** ISO 8601 install date */
  installedAt: string;
  /** Filesystem path where it was installed */
  installPath: string[];
  /** Start menu entry info */
  startMenu?: { nameKey: string; app: string };
  /** Whether a desktop shortcut was created */
  hasDesktopShortcut: boolean;
  /** The original SetupWizard spec for uninstall */
  installedFiles: string[];
}

interface InstalledAppsApi {
  /** All currently installed products */
  products: InstalledProduct[];
  /** Register a newly installed product */
  install: (product: InstalledProduct) => void;
  /** Uninstall by id — removes the product from the registry */
  uninstall: (id: string) => void;
  /** Check if a product is installed */
  isInstalled: (id: string) => boolean;
}

const InstalledAppsContext = createContext<InstalledAppsApi | undefined>(undefined);

export const InstalledAppsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const storage = useStorage();
  const key = storage.key('installed_apps');
  const [products, setProducts] = useState<InstalledProduct[]>(() => {
    try {
      const saved = storage.local.getItem(key);
      if (saved) return JSON.parse(saved) as InstalledProduct[];
    } catch {
      // Ignore malformed persisted state.
    }
    return [];
  });

  useEffect(() => {
    storage.local.setItem(key, JSON.stringify(products));
  }, [products, key, storage]);

  const install = useCallback((product: InstalledProduct) => {
    setProducts(previous => [...previous.filter(item => item.id !== product.id), product]);
  }, []);

  const uninstall = useCallback((id: string) => {
    setProducts(previous => previous.filter(item => item.id !== id));
  }, []);

  const isInstalled = useCallback(
    (id: string) => products.some(item => item.id === id),
    [products]
  );

  const value = useMemo(
    () => ({ products, install, uninstall, isInstalled }),
    [products, install, uninstall, isInstalled]
  );

  return <InstalledAppsContext.Provider value={value}>{children}</InstalledAppsContext.Provider>;
};

export const useInstalledApps = (): InstalledAppsApi => {
  const context = useContext(InstalledAppsContext);
  if (context === undefined) {
    throw new Error('useInstalledApps must be used within an InstalledAppsProvider');
  }
  return context;
};
