/**
 * Storage utilities for Windows XP Simulator
 * Uses IndexedDB for file content and localStorage for metadata
 *
 * All keys are prefixed with a configurable namespace so multiple instances
 * embedded on the same origin do not clobber each other.
 */

import { FileNode } from '../types';

let storagePrefix = 'xp_';

/** Set the namespace used for all localStorage / IndexedDB keys. */
export const setStoragePrefix = (prefix: string): void => {
  storagePrefix = prefix.endsWith('_') ? prefix : `${prefix}_`;
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
  type: 'file' | 'folder';
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
  version: number;
  lastModified: number;
}

interface RecycleBinItem {
  item: FileNode;
  originalPath: string[];
  deletedAt: number;
}

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

// Initialize IndexedDB
function initDB(): Promise<IDBDatabase | null> {
  return new Promise((resolve, reject) => {
    if (!idb) {
      resolve(null);
      return;
    }
    const request = idb.open(getDBName(), DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'path' });
      }
    };
  });
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
