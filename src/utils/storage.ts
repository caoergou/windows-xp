/**
 * Storage utilities for Windows XP Simulator
 * Uses IndexedDB for file content and localStorage for metadata
 */

const DB_NAME = 'WindowsXP_FS';
const DB_VERSION = 1;
const STORE_NAME = 'fileContents';

const METADATA_KEY = 'xp_fs_metadata';
const RECYCLE_BIN_KEY = 'xp_fs_recycle_bin';

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
  item: Record<string, unknown>;
  originalPath: string[];
  deletedAt: number;
}

// Initialize IndexedDB
function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

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
  try {
    localStorage.setItem(METADATA_KEY, JSON.stringify(metadata));
  } catch (e) {
    console.error('Failed to save metadata:', e);
  }
}

// Get metadata from localStorage
export function getMetadata(): FileSystemMetadata | null {
  try {
    const data = localStorage.getItem(METADATA_KEY);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error('Failed to get metadata:', e);
    return null;
  }
}

// Clear all stored data
export async function clearAllStorage(): Promise<void> {
  try {
    localStorage.removeItem(METADATA_KEY);
    localStorage.removeItem(RECYCLE_BIN_KEY);

    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error('Failed to clear storage:', e);
  }
}

// Save recycle bin to localStorage
export function saveRecycleBin(items: Record<string, RecycleBinItem>): void {
  try {
    localStorage.setItem(RECYCLE_BIN_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save recycle bin:', e);
  }
}

// Get recycle bin from localStorage
export function getRecycleBin(): Record<string, RecycleBinItem> | null {
  try {
    const data = localStorage.getItem(RECYCLE_BIN_KEY);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error('Failed to get recycle bin:', e);
    return null;
  }
}

// Export types
export type { FileMetadata, FileSystemMetadata, RecycleBinItem };
