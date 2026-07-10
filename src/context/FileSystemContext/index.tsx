import React, { createContext, useState, useContext, useCallback, useEffect, useRef } from 'react';
import initialFileSystem from '../../data/filesystem.json';
import recycleBinManifest from '../../data/recycle_bin/index.json';
import { FileNode, ClipboardItem, isContainerNode, isFileContentNode } from '../../types';
import {
  loadPersistedFileSystem,
  persistFs,
  saveRecycleBin,
  RecycleBinItem,
} from './utils/persistence';
import type { PersistChanges } from './hooks/useFileOperations';
import { useFileOperations } from './hooks/useFileOperations';
import { getAllCultureShortcutNames } from '../../data/culture';

const CULTURE_SHORTCUT_NAMES = new Set(getAllCultureShortcutNames());

interface RecycleBinManifestEntry {
  file: string;
  originalPath: string[];
}

// Load all JSON files from src/data/recycle_bin
const recycleBinFiles = import.meta.glob('../../data/recycle_bin/*.json', { eager: true });

// Merge all recycle bin items (skip the manifest index.json)
const recycleBinItems: Record<string, FileNode> = {};
for (const path in recycleBinFiles) {
  if (path.endsWith('index.json')) continue;
  const module = recycleBinFiles[path] as { default?: Record<string, FileNode> };
  const content = module.default || (module as Record<string, FileNode>);
  Object.assign(recycleBinItems, content);
}

// Build preset recycle-bin metadata so restore can return items to their original paths
const manifest = recycleBinManifest as unknown as Record<string, RecycleBinManifestEntry>;
const presetRecycleBinRef: Record<string, RecycleBinItem> = {};
for (const [fileName, entry] of Object.entries(manifest)) {
  const item = recycleBinItems[fileName];
  if (item && entry?.originalPath) {
    presetRecycleBinRef[fileName] = {
      item,
      originalPath: entry.originalPath,
      deletedAt: Date.now() - 1000000000,
    };
  }
}

// Inject items into Recycle Bin
const fileSystemWithRecycleBin: { root: FileNode } = JSON.parse(JSON.stringify(initialFileSystem));
if (
  fileSystemWithRecycleBin.root &&
  isContainerNode(fileSystemWithRecycleBin.root) &&
  fileSystemWithRecycleBin.root.children?.['回收站']
) {
  const recycleBin = fileSystemWithRecycleBin.root.children['回收站'];
  if (isContainerNode(recycleBin)) {
    recycleBin.children = {
      ...recycleBin.children,
      ...recycleBinItems,
    };
  }
}

const mergeCustomFileSystem = (
  base: { root: FileNode },
  custom?: Record<string, FileNode>
): { root: FileNode } => {
  if (!custom || Object.keys(custom).length === 0) return base;

  return {
    root: {
      ...base.root,
      children: {
        ...(isContainerNode(base.root) ? base.root.children : {}),
        ...custom,
      },
    } as FileNode,
  };
};

interface FileSystemContextType {
  fs: { root: FileNode };
  clipboard: ClipboardItem | null;
  getFile: (path: string[]) => FileNode | null;
  checkAccess: (node: FileNode, passwordInput: string) => boolean;
  updateFile: (path: string[], updates: Partial<FileNode>) => void;
  createFile: (
    parentPath: string[],
    fileName: string,
    type?: 'file' | 'folder',
    properties?: Partial<FileNode>
  ) => void;
  createFolder: (parentPath: string[], folderName: string) => void;
  renameFile: (parentPath: string[], oldName: string, newName: string) => void;
  renameNode: (parentPath: string[], oldName: string, newName: string) => void;
  deleteFile: (parentPath: string[], fileName: string) => void;
  deleteFolder: (parentPath: string[], folderName: string) => void;
  moveFile: (
    sourcePath: string[],
    fileName: string,
    destinationPath: string[],
    newName?: string
  ) => void;
  copyFile: (
    sourcePath: string[],
    fileName: string,
    destinationPath: string[],
    newName?: string
  ) => void;
  copyToClipboard: (sourcePath: string[], fileName: string | string[]) => void;
  cutFile: (sourcePath: string[], fileName: string | string[]) => void;
  pasteFile: (destinationPath: string[]) => boolean;
  emptyRecycleBin: () => void;
  restoreFromRecycleBin: (fileName: string) => void;
  searchFiles: (
    query: string,
    startPath?: string[]
  ) => Array<{ path: string[]; name: string; type: string; icon?: string }>;
  getFileProperties: (
    path: string[],
    fileName: string
  ) => {
    name: string;
    type: string;
    size: string;
    icon?: string;
    created: string;
    modified: string;
    accessed: string;
    locked: boolean;
    broken: boolean;
  } | null;
  saveFsState: () => void;
  resetToDefault: () => void;
  uploadTextFile: (parentPath: string[], fileName: string, content: string) => void;
  downloadTextFile: (path: string[], fileName: string) => void;
}

const FileSystemContext = createContext<FileSystemContextType | undefined>(undefined);

export const useFileSystem = (): FileSystemContextType => {
  const context = useContext(FileSystemContext);
  if (context === undefined) {
    throw new Error('useFileSystem must be used within a FileSystemProvider');
  }
  return context;
};

export const FileSystemProvider: React.FC<{
  children: React.ReactNode;
  customFileSystem?: Record<string, FileNode>;
  cultureFileSystem?: Record<string, FileNode>;
  cultureKey?: string;
}> = ({ children, customFileSystem, cultureFileSystem, cultureKey = 'en' }) => {
  const customFsRef = useRef(customFileSystem);
  const cultureFsRef = useRef(cultureFileSystem);
  customFsRef.current = customFileSystem;
  cultureFsRef.current = cultureFileSystem;

  const withConfiguredLayers = useCallback((base: { root: FileNode }) => {
    const withCustom = mergeCustomFileSystem(base, customFsRef.current);
    return mergeCustomFileSystem(withCustom, cultureFsRef.current);
  }, []);

  const [fs, setFs] = useState<{ root: FileNode }>(withConfiguredLayers(fileSystemWithRecycleBin));
  const [clipboard, setClipboard] = useState<ClipboardItem | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const recycleBinRef = useRef<Record<string, RecycleBinItem>>({ ...presetRecycleBinRef });

  useEffect(() => {
    const loadPersistedData = async () => {
      try {
        const { root, recycleBinRef: savedRecycleBinRef } =
          await loadPersistedFileSystem(fileSystemWithRecycleBin);
        recycleBinRef.current = savedRecycleBinRef;

        // Re-attach preset recycle-bin metadata for any preset items still present.
        // This keeps restore working when no persisted recycle-bin state exists yet.
        const currentRecycleBin = isContainerNode(root)
          ? root.children['回收站']
          : undefined;
        if (currentRecycleBin && isContainerNode(currentRecycleBin)) {
          for (const fileName of Object.keys(presetRecycleBinRef)) {
            if (currentRecycleBin.children?.[fileName] && !recycleBinRef.current[fileName]) {
              recycleBinRef.current[fileName] = presetRecycleBinRef[fileName];
            }
          }
        }

        setFs(withConfiguredLayers({ root }));
      } catch (e) {
        console.error('Failed to load persisted data:', e);
        setFs(withConfiguredLayers(fileSystemWithRecycleBin));
      } finally {
        setIsLoaded(true);
      }
    };

    loadPersistedData();
  }, [withConfiguredLayers]);

  useEffect(() => {
    if (!isLoaded) return;
    setFs(current => {
      if (!isContainerNode(current.root)) return current;
      const children = Object.fromEntries(
        Object.entries(current.root.children).filter(
          ([key, node]) => !node.managedByCulture && !CULTURE_SHORTCUT_NAMES.has(key)
        )
      );
      return {
        root: {
          ...current.root,
          children: { ...children, ...cultureFsRef.current },
        },
      };
    });
  }, [cultureKey, isLoaded]);

  // Debounced, diff-aware persistence (#81): operations landing within the
  // window are coalesced into one write; ops report their dirty/removed
  // content paths so only touched files hit IndexedDB.
  const isLoadedRef = useRef(isLoaded);
  isLoadedRef.current = isLoaded;
  const pendingPersistRef = useRef<{
    fs: { root: FileNode } | null;
    dirty: Set<string> | null; // null = an op requested a full content rewrite
    removed: Set<string>;
    timer: ReturnType<typeof setTimeout> | null;
  }>({ fs: null, dirty: new Set(), removed: new Set(), timer: null });

  const flushPersist = useCallback(() => {
    const pending = pendingPersistRef.current;
    if (pending.timer) {
      clearTimeout(pending.timer);
      pending.timer = null;
    }
    if (!pending.fs) return;
    const fsToPersist = pending.fs;
    const dirty = pending.dirty;
    const removed = [...pending.removed];
    pending.fs = null;
    pending.dirty = new Set();
    pending.removed = new Set();
    void persistFs(fsToPersist, isLoadedRef.current, {
      defaultFs: fileSystemWithRecycleBin,
      dirtyContentPaths: dirty ? [...dirty].map(key => key.split('/')) : undefined,
      removedContentPaths: removed.map(key => key.split('/')),
    });
  }, []);

  const doPersistFs = useCallback(
    (newFs: { root: FileNode }, changes?: PersistChanges) => {
      const pending = pendingPersistRef.current;
      pending.fs = newFs;
      if (!changes?.dirty) {
        pending.dirty = null; // full rewrite requested
      } else if (pending.dirty) {
        changes.dirty.forEach(path => pending.dirty?.add(path.join('/')));
      }
      changes?.removed?.forEach(path => pending.removed.add(path.join('/')));
      if (pending.timer) clearTimeout(pending.timer);
      pending.timer = setTimeout(flushPersist, 300);
    },
    [flushPersist]
  );

  // Flush pending writes when the page goes away or the provider unmounts.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.addEventListener('beforeunload', flushPersist);
    return () => {
      window.removeEventListener('beforeunload', flushPersist);
      flushPersist();
    };
  }, [flushPersist]);

  const fileOperations = useFileOperations(setFs, doPersistFs, recycleBinRef);

  const getFile = useCallback(
    (path: string[]): FileNode | null => {
      let current = fs.root;
      for (const part of path) {
        if (isContainerNode(current) && current.children?.[part]) {
          current = current.children[part];
        } else {
          return null;
        }
      }
      return current;
    },
    [fs]
  );

  const checkAccess = useCallback((node: FileNode, passwordInput: string): boolean => {
    if (!node.locked) return true;
    return node.password === passwordInput;
  }, []);

  const copyToClipboard = useCallback((sourcePath: string[], fileName: string | string[]) => {
    const fileNames = Array.isArray(fileName) ? fileName : [fileName];
    setClipboard({
      type: 'copy',
      sourcePath,
      fileName: fileNames[0],
      ...(fileNames.length > 1 ? { fileNames } : {}),
    });
  }, []);

  const cutFile = useCallback((sourcePath: string[], fileName: string | string[]) => {
    const fileNames = Array.isArray(fileName) ? fileName : [fileName];
    setClipboard({
      type: 'cut',
      sourcePath,
      fileName: fileNames[0],
      ...(fileNames.length > 1 ? { fileNames } : {}),
    });
  }, []);

  const pasteFile = useCallback(
    (destinationPath: string[]): boolean => {
      const didPaste = fileOperations.pasteFile(destinationPath, clipboard, fs);
      if (didPaste && clipboard?.type === 'cut') {
        setClipboard(null);
      }
      return didPaste;
    },
    [clipboard, fileOperations, fs]
  );

  const searchFiles = useCallback(
    (
      query: string,
      startPath: string[] = []
    ): Array<{ path: string[]; name: string; type: string; icon?: string }> => {
      const results: Array<{ path: string[]; name: string; type: string; icon?: string }> = [];
      const searchNode = (node: FileNode, path: string[]) => {
        if (node.name.toLowerCase().includes(query.toLowerCase())) {
          results.push({ path: [...path], name: node.name, type: node.type, icon: node.icon });
        }
        if (isContainerNode(node) && node.children) {
          Object.entries(node.children).forEach(([key, child]) => {
            searchNode(child, [...path, key]);
          });
        }
      };

      const startNode = getFile(startPath);
      if (startNode) {
        searchNode(startNode, startPath);
      }
      return results;
    },
    [getFile]
  );

  const getFileProperties = useCallback(
    (path: string[], fileName: string) => {
      const node = getFile([...path, fileName]);
      if (!node) return null;

      let size = '0 字节';
      if (isContainerNode(node)) {
        size = `${Object.keys(node.children || {}).length} 个对象`;
      } else if (isFileContentNode(node) && node.content) {
        size = `${node.content.length} 字节`;
      }

      return {
        name: node.name,
        type: node.type,
        size,
        icon: node.icon,
        created: '2003年10月25日',
        modified: '2003年10月25日',
        accessed: '2003年10月25日',
        locked: !!node.locked,
        broken: !!node.broken,
      };
    },
    [getFile]
  );

  const saveFsState = useCallback(() => {
    doPersistFs(fs);
  }, [fs, doPersistFs]);

  const resetToDefault = useCallback(() => {
    const next = withConfiguredLayers(fileSystemWithRecycleBin);
    setFs(next);
    recycleBinRef.current = {};
    saveRecycleBin({});
    doPersistFs(next);
  }, [doPersistFs, withConfiguredLayers]);

  const uploadTextFile = useCallback(
    (parentPath: string[], fileName: string, content: string) => {
      fileOperations.createFile(parentPath, fileName, 'file', { content, app: 'Notepad' });
    },
    [fileOperations]
  );

  const downloadTextFile = useCallback(
    (path: string[], fileName: string) => {
      const node = getFile([...path, fileName]);
      if (!node || !isFileContentNode(node) || !node.content) return;

      const blob = new Blob([node.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    [getFile]
  );

  const contextValue: FileSystemContextType = {
    fs,
    clipboard,
    getFile,
    checkAccess,
    updateFile: fileOperations.updateFile,
    createFile: fileOperations.createFile,
    createFolder: fileOperations.createFolder,
    renameFile: fileOperations.renameFile,
    renameNode: fileOperations.renameNode,
    deleteFile: fileOperations.deleteFile,
    deleteFolder: fileOperations.deleteFolder,
    copyFile: fileOperations.copyFile,
    copyToClipboard,
    cutFile,
    pasteFile,
    emptyRecycleBin: fileOperations.emptyRecycleBin,
    restoreFromRecycleBin: fileOperations.restoreFromRecycleBin,
    searchFiles,
    getFileProperties,
    moveFile: fileOperations.moveFile,
    saveFsState,
    resetToDefault,
    uploadTextFile,
    downloadTextFile,
  };

  return <FileSystemContext.Provider value={contextValue}>{children}</FileSystemContext.Provider>;
};
