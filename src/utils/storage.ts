/**
 * Storage utilities for Windows XP Simulator
 * Uses IndexedDB for file content and localStorage for metadata
 *
 * All keys are namespaced with a per-instance prefix so multiple <WindowsXP/>
 * instances embedded on the same origin stay isolated (#95). Each instance owns
 * a {@link Storage} handle (prefix + its own IndexedDB connection), created by
 * `createStorage(prefix)` and distributed through `StorageContext`. The
 * module-level functions below delegate to a process-wide default instance so
 * the single-instance path and any non-React caller keep working unchanged.
 */

import { FileNode } from '../types';

const DB_VERSION = 1;
const STORE_NAME = 'fileContents';

interface FileMetadata {
  path: string[];
  name: string;
  type: 'file' | 'folder' | string;
  icon?: string;
  locked?: boolean;
  password?: string;
  broken?: boolean;
  hint?: string;
  app?: string;
  readOnly?: boolean;
  description?: string;
  modifiedAt: number;
}

interface FileSystemMetadata {
  files: Record<string, FileMetadata>;
  /** Tombstoned path keys: built-in nodes the user deleted or renamed away. */
  deleted?: string[];
  version: number;
  lastModified: number;
}

interface RecycleBinItem {
  item: FileNode;
  originalPath: string[];
  /** Display name at deletion time; the bin key may be suffixed for uniqueness (#81). */
  originalName?: string;
  deletedAt: number;
}

/**
 * Name of the DOM event dispatched (once per session) when persistent storage
 * writes fail, e.g. the localStorage quota is exceeded. The desktop listens
 * and surfaces an XP-style dialog (issue #81).
 */
export const STORAGE_ERROR_EVENT = 'windows-xp:storage-error';

let storageErrorNotified = false;
const notifyStorageError = (error: unknown): void => {
  if (storageErrorNotified || typeof window === 'undefined') return;
  storageErrorNotified = true;
  window.dispatchEvent(new CustomEvent(STORAGE_ERROR_EVENT, { detail: { error } }));
};

/** True when running in a browser-like environment. */
export const canUseDOM =
  typeof window !== 'undefined' && typeof document !== 'undefined';

// IndexedDB may be undefined in non-browser environments (e.g. jsdom, SSR)
const idb = typeof indexedDB !== 'undefined' ? indexedDB : null;

/** SSR-safe localStorage wrapper. No-ops in Node / non-browser envs. */
export interface SafeLocalStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

const makeSafeLocalStorage = (): SafeLocalStorage => ({
  getItem: (key: string): string | null => {
    if (!canUseDOM) return null;
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.error('Failed to read localStorage:', e);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    if (!canUseDOM) return;
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.error('Failed to write localStorage:', e);
      notifyStorageError(e);
    }
  },
  removeItem: (key: string): void => {
    if (!canUseDOM) return;
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error('Failed to remove localStorage:', e);
    }
  },
});

/**
 * A fully isolated storage handle bound to one prefix. All methods read and
 * write only under that prefix, and the IndexedDB connection is private to the
 * handle — two handles with different prefixes never touch each other.
 */
export interface Storage {
  readonly prefix: string;
  /** SSR-safe localStorage wrapper (keys are NOT auto-prefixed — pass full keys via `key()`). */
  readonly local: SafeLocalStorage;
  /** Build a fully-qualified storage key from a short key constant. */
  key: (shortKey: string) => string;
  saveFileContent: (path: string[], content: string) => Promise<void>;
  getFileContent: (path: string[]) => Promise<string | null>;
  deleteFileContent: (path: string[]) => Promise<void>;
  saveMetadata: (metadata: FileSystemMetadata) => void;
  getMetadata: () => FileSystemMetadata | null;
  clearAllStorage: () => Promise<void>;
  /** Remove every localStorage key under this instance's prefix (SSR-safe). */
  clearPrefixedLocal: () => void;
  saveRecycleBin: (items: Record<string, RecycleBinItem>) => void;
  getRecycleBin: () => Record<string, RecycleBinItem> | null;
  /** @internal Drop the cached IndexedDB connection. */
  resetConnection: () => void;
}

/**
 * Create an isolated storage handle for a prefix. Each handle keeps its own
 * IndexedDB connection promise, so instances never share state (#95).
 */
export const createStorage = (rawPrefix: string): Storage => {
  const prefix = rawPrefix.endsWith('_') ? rawPrefix : `${rawPrefix}_`;
  const local = makeSafeLocalStorage();

  const dbName = `${prefix}WindowsXP_FS`;
  const metadataKey = `${prefix}fs_metadata`;
  const recycleBinKey = `${prefix}fs_recycle_bin`;

  // One connection per handle lifetime instead of one per operation (#81).
  let dbPromise: Promise<IDBDatabase | null> | null = null;

  const initDB = (): Promise<IDBDatabase | null> => {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      if (!idb) {
        resolve(null);
        return;
      }
      const request = idb.open(dbName, DB_VERSION);
      request.onerror = () => {
        dbPromise = null;
        reject(request.error);
      };
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'path' });
        }
      };
    });
    return dbPromise;
  };

  return {
    prefix,
    local,
    key: (shortKey: string) => `${prefix}${shortKey}`,

    async saveFileContent(path, content) {
      const db = await initDB();
      if (!db) return;
      const store = db.transaction([STORE_NAME], 'readwrite').objectStore(STORE_NAME);
      const pathKey = path.join('/');
      return new Promise((resolve, reject) => {
        const request = store.put({ path: pathKey, content, modifiedAt: Date.now() });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    },

    async getFileContent(path) {
      const db = await initDB();
      if (!db) return null;
      const store = db.transaction([STORE_NAME], 'readonly').objectStore(STORE_NAME);
      const pathKey = path.join('/');
      return new Promise((resolve, reject) => {
        const request = store.get(pathKey);
        request.onsuccess = () => resolve(request.result ? request.result.content : null);
        request.onerror = () => reject(request.error);
      });
    },

    async deleteFileContent(path) {
      const db = await initDB();
      if (!db) return;
      const store = db.transaction([STORE_NAME], 'readwrite').objectStore(STORE_NAME);
      const pathKey = path.join('/');
      return new Promise((resolve, reject) => {
        const request = store.delete(pathKey);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    },

    saveMetadata(metadata) {
      local.setItem(metadataKey, JSON.stringify(metadata));
    },

    getMetadata() {
      const data = local.getItem(metadataKey);
      if (!data) return null;
      try {
        return JSON.parse(data);
      } catch (e) {
        console.error('Failed to parse metadata:', e);
        return null;
      }
    },

    async clearAllStorage() {
      local.removeItem(metadataKey);
      local.removeItem(recycleBinKey);
      const db = await initDB();
      if (!db) return;
      const store = db.transaction([STORE_NAME], 'readwrite').objectStore(STORE_NAME);
      return new Promise((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    },

    clearPrefixedLocal() {
      if (!canUseDOM) return;
      try {
        Object.keys(window.localStorage)
          .filter(k => k.startsWith(prefix))
          .forEach(k => window.localStorage.removeItem(k));
      } catch (e) {
        console.warn('[windows-xp] clearPrefixedLocal failed', e);
      }
    },

    saveRecycleBin(items) {
      local.setItem(recycleBinKey, JSON.stringify(items));
    },

    getRecycleBin() {
      const data = local.getItem(recycleBinKey);
      if (!data) return null;
      try {
        return JSON.parse(data);
      } catch (e) {
        console.error('Failed to parse recycle bin:', e);
        return null;
      }
    },

    resetConnection() {
      dbPromise = null;
    },
  };
};

// ============================================================
// Process-wide default instance (single-instance / non-React callers).
// ============================================================

let defaultStorage = createStorage('xp_');
let prefixAssigned = false;
let warnedPrefixConflict = false;

/**
 * Reconfigure the process-wide default storage namespace.
 *
 * With per-instance isolation (#95) the recommended path is `StorageProvider` +
 * `useStorage()`, which is unaffected by this global. This remains for the
 * single-instance default and non-React callers. A second differing prefix
 * still warns once, since the default instance is shared.
 */
export const setStoragePrefix = (prefix: string): void => {
  const normalized = prefix.endsWith('_') ? prefix : `${prefix}_`;
  if (prefixAssigned && normalized !== defaultStorage.prefix && !warnedPrefixConflict) {
    warnedPrefixConflict = true;
    console.warn(
      '[windows-xp] Multiple WindowsXP instances with different storagePrefix values share the ' +
        'process-wide default storage. Use StorageProvider / useStorage() for full per-instance isolation (#95).'
    );
  }
  if (normalized !== defaultStorage.prefix) {
    defaultStorage = createStorage(normalized);
  }
  prefixAssigned = true;
};

/** @internal */
export const getStoragePrefix = (): string => defaultStorage.prefix;

/** The process-wide default storage handle (used when no StorageProvider is present). */
export const getDefaultStorage = (): Storage => defaultStorage;

/** @internal Reset the default instance's cached connection. */
export const resetDBConnection = (): void => defaultStorage.resetConnection();

/** Build a fully-qualified storage key from a short key constant (default instance). */
export const getStorageKey = (key: string): string => defaultStorage.key(key);

/** SSR-safe localStorage wrapper (default instance). */
export const safeLocalStorage: SafeLocalStorage = {
  getItem: (key) => defaultStorage.local.getItem(key),
  setItem: (key, value) => defaultStorage.local.setItem(key, value),
  removeItem: (key) => defaultStorage.local.removeItem(key),
};

export const saveFileContent = (path: string[], content: string): Promise<void> =>
  defaultStorage.saveFileContent(path, content);
export const getFileContent = (path: string[]): Promise<string | null> =>
  defaultStorage.getFileContent(path);
export const deleteFileContent = (path: string[]): Promise<void> =>
  defaultStorage.deleteFileContent(path);
export const saveMetadata = (metadata: FileSystemMetadata): void =>
  defaultStorage.saveMetadata(metadata);
export const getMetadata = (): FileSystemMetadata | null => defaultStorage.getMetadata();
export const clearAllStorage = (): Promise<void> => defaultStorage.clearAllStorage();
export const saveRecycleBin = (items: Record<string, RecycleBinItem>): void =>
  defaultStorage.saveRecycleBin(items);
export const getRecycleBin = (): Record<string, RecycleBinItem> | null =>
  defaultStorage.getRecycleBin();

// Export types
export type { FileMetadata, FileSystemMetadata, RecycleBinItem };
