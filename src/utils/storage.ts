/**
 * Storage utilities for Windows XP Simulator
 * Uses IndexedDB for file content and localStorage for metadata
 *
 * All keys are prefixed with a configurable namespace so multiple instances
 * embedded on the same origin do not clobber each other.
 */

import { FileNode } from '../types';

let storagePrefix = 'xp_';
let prefixAssigned = false;
let warnedPrefixConflict = false;

/**
 * Set the namespace used for all localStorage / IndexedDB keys.
 *
 * Limitation: the prefix is currently process-wide. Two <WindowsXP/> instances
 * with different prefixes on the same page will share the most recently
 * mounted prefix; full per-instance isolation is tracked in issue #73.
 */
export const setStoragePrefix = (prefix: string): void => {
  const normalized = prefix.endsWith('_') ? prefix : `${prefix}_`;
  if (prefixAssigned && normalized !== storagePrefix && !warnedPrefixConflict) {
    warnedPrefixConflict = true;
    console.warn(
      '[windows-xp] Multiple WindowsXP instances with different storagePrefix values detected. ' +
        'Storage is currently process-wide, so instances will share the most recently mounted prefix.'
    );
  }
  if (normalized !== storagePrefix) {
    resetDBConnection();
  }
  storagePrefix = normalized;
  prefixAssigned = true;
};

/** @internal */
export const getStoragePrefix = (): string => storagePrefix;

/** Build a fully-qualified storage key from a short key constant. */
export const getStorageKey = (key: string): string => `${storagePrefix}${key}`;

const DB_VERSION = 1;
const STORE_NAME = 'fileContents';

const getDBName = (): string => `${storagePrefix}WindowsXP_FS`;

const getMetadataKey = (): string => `${storagePrefix}fs_metadata`;
const getRecycleBinKey = (): string => `${storagePrefix}fs_recycle_bin`;

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

/** SSR-safe localStorage wrapper. No-ops in Node / non-browser envs. */
export const safeLocalStorage = {
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
};

// IndexedDB may be undefined in non-browser environments (e.g. jsdom, SSR)
const idb = typeof indexedDB !== 'undefined' ? indexedDB : null;

// One connection per (prefix) lifetime instead of one per operation (#81).
let dbPromise: Promise<IDBDatabase | null> | null = null;
let dbPromisePrefix: string | null = null;

/** @internal Reset the cached connection (used when the prefix changes). */
export const resetDBConnection = (): void => {
  dbPromise = null;
  dbPromisePrefix = null;
};

// Initialize (or reuse) the IndexedDB connection
function initDB(): Promise<IDBDatabase | null> {
  if (dbPromise && dbPromisePrefix === storagePrefix) return dbPromise;
  dbPromisePrefix = storagePrefix;
  dbPromise = new Promise((resolve, reject) => {
    if (!idb) {
      resolve(null);
      return;
    }
    const request = idb.open(getDBName(), DB_VERSION);

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
}

// Save file content to IndexedDB
export async function saveFileContent(path: string[], content: string): Promise<void> {
  const db = await initDB();
  if (!db) return;

  const transaction = db.transaction([STORE_NAME], 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  const pathKey = path.join('/');

  return new Promise((resolve, reject) => {
    const request = store.put({ path: pathKey, content, modifiedAt: Date.now() });
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Get file content from IndexedDB
export async function getFileContent(path: string[]): Promise<string | null> {
  const db = await initDB();
  if (!db) return null;

  const transaction = db.transaction([STORE_NAME], 'readonly');
  const store = transaction.objectStore(STORE_NAME);

  const pathKey = path.join('/');

  return new Promise((resolve, reject) => {
    const request = store.get(pathKey);
    request.onsuccess = () => {
      const result = request.result;
      resolve(result ? result.content : null);
    };
    request.onerror = () => reject(request.error);
  });
}

// Delete file content from IndexedDB
export async function deleteFileContent(path: string[]): Promise<void> {
  const db = await initDB();
  if (!db) return;

  const transaction = db.transaction([STORE_NAME], 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  const pathKey = path.join('/');

  return new Promise((resolve, reject) => {
    const request = store.delete(pathKey);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Save metadata to localStorage
export function saveMetadata(metadata: FileSystemMetadata): void {
  safeLocalStorage.setItem(getMetadataKey(), JSON.stringify(metadata));
}

// Get metadata from localStorage
export function getMetadata(): FileSystemMetadata | null {
  const data = safeLocalStorage.getItem(getMetadataKey());
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error('Failed to parse metadata:', e);
    return null;
  }
}

// Clear all stored data
export async function clearAllStorage(): Promise<void> {
  safeLocalStorage.removeItem(getMetadataKey());
  safeLocalStorage.removeItem(getRecycleBinKey());

  const db = await initDB();
  if (!db) return;

  const transaction = db.transaction([STORE_NAME], 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Save recycle bin to localStorage
export function saveRecycleBin(items: Record<string, RecycleBinItem>): void {
  safeLocalStorage.setItem(getRecycleBinKey(), JSON.stringify(items));
}

// Get recycle bin from localStorage
export function getRecycleBin(): Record<string, RecycleBinItem> | null {
  const data = safeLocalStorage.getItem(getRecycleBinKey());
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error('Failed to parse recycle bin:', e);
    return null;
  }
}

// Export types
export type { FileMetadata, FileSystemMetadata, RecycleBinItem };
