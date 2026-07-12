import React, { createContext, useContext, useMemo } from 'react';
import {
  createStorage,
  getDefaultStorage,
  setStoragePrefix,
  type Storage,
  type PersistenceMode,
} from '../utils/storage';

/**
 * Per-instance storage isolation (#95).
 *
 * `StorageProvider` builds one {@link Storage} handle from the instance's
 * `storagePrefix` and hands it down; consumers read it with `useStorage()`
 * instead of the process-wide module functions. Two `<WindowsXP/>` instances
 * with different prefixes therefore keep fully separate file systems, windows,
 * and login state on the same page.
 */

const StorageContext = createContext<Storage | null>(null);

export const StorageProvider: React.FC<{
  prefix?: string;
  /** Persistence backend for this instance (#138). Defaults to `'local'`. */
  persistence?: PersistenceMode;
  children: React.ReactNode;
}> = ({ prefix = 'xp_', persistence = 'local', children }) => {
  const storage = useMemo(() => createStorage(prefix, persistence), [prefix, persistence]);

  // Keep the process-wide default aligned so any non-migrated module-level
  // caller in a single-instance app still targets the right namespace.
  useMemo(() => setStoragePrefix(prefix), [prefix]);

  return <StorageContext.Provider value={storage}>{children}</StorageContext.Provider>;
};

/**
 * Access the current instance's isolated storage handle. Without a
 * `StorageProvider` (single-instance apps, tests rendering a provider directly)
 * it falls back to the process-wide default handle, so behaviour is unchanged.
 */
export const useStorage = (): Storage => useContext(StorageContext) ?? getDefaultStorage();
