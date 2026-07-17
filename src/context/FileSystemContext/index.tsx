import React, { createContext, useState, useContext, useCallback, useEffect, useRef } from 'react';
import initialFileSystem from '../../data/filesystem.json';
import recycleBinManifest from '../../data/recycle_bin/index.json';
import { FileNode, ClipboardItem, isContainerNode, isFileContentNode } from '../../types';
import { loadPersistedFileSystem, persistFs, RecycleBinItem } from './utils/persistence';
import type { PersistChanges } from './hooks/useFileOperations';
import { useFileOperations } from './hooks/useFileOperations';
import { getAllCultureShortcutNames } from '../../data/culture';
import { useXPEventBus } from '../EventBusContext';
import { useStorage } from '../StorageContext';
import { useClock } from '../ClockContext';

const CULTURE_SHORTCUT_NAMES = new Set(getAllCultureShortcutNames());

interface RecycleBinManifestEntry {
  file: string;
  originalPath: string[];
  deletedAt?: string;
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
      deletedAt: entry.deletedAt ?? '2003-10-25T12:00:00.000Z',
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

/** How the built-in filesystem combines with injected content (#77). */
export type FileSystemMode = 'merge' | 'replace';

/**
 * Root children kept in `replace` mode: the OS scaffolding the shell needs to
 * function (Recycle Bin + a My Computer navigation root). Everything else —
 * the built-in app shortcuts, My Documents, Network Neighbourhood and any
 * preset content — is dropped so the consumer supplies the whole world (#77).
 */
const REPLACE_MODE_STRUCTURAL_KEYS = ['回收站', '我的电脑'];

/** Build the base filesystem for the active mode (before custom/culture layers). */
const buildBaseFs = (mode: FileSystemMode): { root: FileNode } => {
  if (mode !== 'replace') return fileSystemWithRecycleBin;

  const root: FileNode = JSON.parse(JSON.stringify(fileSystemWithRecycleBin.root));
  if (isContainerNode(root)) {
    const kept: Record<string, FileNode> = {};
    for (const key of REPLACE_MODE_STRUCTURAL_KEYS) {
      const node = root.children[key];
      if (!node) continue;
      // Empty the structural containers: the consumer provides all content.
      if (isContainerNode(node)) node.children = {};
      kept[key] = node;
    }
    root.children = kept;
  }
  return { root };
};

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
  /** Persistently clear a node's `locked` flag (host/scenario-driven unlock). */
  unlockNode: (path: string[]) => void;
  updateFile: (path: string[], updates: Partial<FileNode>) => void;
  createFile: (
    parentPath: string[],
    fileName: string,
    type?: 'file' | 'folder',
    properties?: Partial<FileNode>
  ) => void;
  createFolder: (parentPath: string[], folderName: string) => void;
  renameFile: (parentPath: string[], oldName: string, newName: string) => void;
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
    /** Byte count for files (0 for folders). Format for display in the UI layer. */
    sizeBytes: number;
    /** Child object count for folders; null for files. */
    childCount: number | null;
    icon?: string;
    /** Authored ISO timestamp, or null when the metadata is unknown. */
    created: string | null;
    modified: string | null;
    accessed: string | null;
    locked: boolean;
    broken: boolean;
  } | null;
  saveFsState: () => void;
  resetToDefault: () => void;
  /** Deep clone of the live filesystem tree (with contents) for snapshots (#117). */
  getFsSnapshot: () => { root: FileNode };
  /** Deep clone of the live recycle bin contents (#117). */
  getRecycleBinItems: () => Record<string, RecycleBinItem>;
  /**
   * Replace this instance's persisted filesystem + recycle bin with a snapshot
   * (clears storage first, then writes). Caller reloads to rehydrate (#117).
   */
  loadFsSnapshot: (
    tree: { root: FileNode },
    recycleBin: Record<string, RecycleBinItem>
  ) => Promise<void>;
  /**
   * Replace the live tree in memory (state + persist) WITHOUT a reload (#207).
   * Unlike {@link loadFsSnapshot}, this re-renders synchronously — the rehearsal
   * engine uses it to restore the baseline filesystem when seeking backward.
   */
  applyFsSnapshotInMemory: (tree: { root: FileNode }) => void;
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
  /** 'merge' (default) layers custom content over the built-ins; 'replace'
   * keeps only OS scaffolding so the consumer owns the whole tree (#77). */
  fileSystemMode?: FileSystemMode;
  /** Authored recycle-bin records with stable original paths and timestamps (#282). */
  seededRecycleBin?: Record<string, RecycleBinItem>;
}> = ({
  children,
  customFileSystem,
  cultureFileSystem,
  cultureKey = 'en',
  fileSystemMode = 'merge',
  seededRecycleBin,
}) => {
  const storage = useStorage();
  const clock = useClock();
  const customFsRef = useRef(customFileSystem);
  const cultureFsRef = useRef(cultureFileSystem);
  customFsRef.current = customFileSystem;
  cultureFsRef.current = cultureFileSystem;

  // Base tree for the active mode (kept stable; mode is not meant to flip at runtime).
  const baseFsRef = useRef<{ root: FileNode }>(buildBaseFs(fileSystemMode));

  const withConfiguredLayers = useCallback(
    (base: { root: FileNode }) => {
      const withCustom = mergeCustomFileSystem(base, customFsRef.current);
      // In replace mode the consumer owns the desktop — built-in culture
      // shortcuts (Norton/Winamp/QQ…) are suppressed like the other built-ins.
      if (fileSystemMode === 'replace') return withCustom;
      return mergeCustomFileSystem(withCustom, cultureFsRef.current);
    },
    [fileSystemMode]
  );

  const [fs, setFs] = useState<{ root: FileNode }>(() => withConfiguredLayers(baseFsRef.current));
  const [clipboard, setClipboard] = useState<ClipboardItem | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  // Preset recycle-bin metadata only applies to the full built-in tree.
  const recycleBinRef = useRef<Record<string, RecycleBinItem>>(
    fileSystemMode === 'replace'
      ? { ...(seededRecycleBin ?? {}) }
      : { ...presetRecycleBinRef, ...(seededRecycleBin ?? {}) }
  );

  useEffect(() => {
    const loadPersistedData = async () => {
      try {
        const { root, recycleBinRef: savedRecycleBinRef } = await loadPersistedFileSystem(
          storage,
          baseFsRef.current
        );
        recycleBinRef.current = savedRecycleBinRef;

        // Re-attach preset recycle-bin metadata for any preset items still present.
        // This keeps restore working when no persisted recycle-bin state exists yet.
        const currentRecycleBin = isContainerNode(root) ? root.children['回收站'] : undefined;
        if (currentRecycleBin && isContainerNode(currentRecycleBin)) {
          for (const fileName of Object.keys(presetRecycleBinRef)) {
            if (currentRecycleBin.children?.[fileName] && !recycleBinRef.current[fileName]) {
              recycleBinRef.current[fileName] = presetRecycleBinRef[fileName];
            }
          }
          for (const [key, record] of Object.entries(seededRecycleBin ?? {})) {
            if (!currentRecycleBin.children[key]) currentRecycleBin.children[key] = record.item;
            if (!recycleBinRef.current[key]) recycleBinRef.current[key] = record;
          }
        }

        setFs(withConfiguredLayers({ root }));
      } catch (e) {
        console.error('Failed to load persisted data:', e);
        setFs(withConfiguredLayers(baseFsRef.current));
      } finally {
        setIsLoaded(true);
      }
    };

    loadPersistedData();
  }, [withConfiguredLayers, storage]);

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
          children: {
            ...children,
            ...(fileSystemMode === 'replace' ? {} : cultureFsRef.current),
          },
        },
      };
    });
  }, [cultureKey, isLoaded, fileSystemMode]);

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
    void persistFs(storage, fsToPersist, isLoadedRef.current, {
      defaultFs: baseFsRef.current,
      dirtyContentPaths: dirty ? [...dirty].map(key => key.split('/')) : undefined,
      removedContentPaths: removed.map(key => key.split('/')),
    });
  }, [storage]);

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

  const bus = useXPEventBus();
  const fileOperations = useFileOperations(setFs, doPersistFs, recycleBinRef);

  useEffect(
    () =>
      bus.subscribe(event => {
        if (event.type === 'file:open') {
          fileOperations.updateFile(event.path, { atime: clock.now() });
        }
      }),
    [bus, clock, fileOperations]
  );

  // Event-emitting wrappers (#76): mutations announce themselves on the bus.
  const createFile = useCallback(
    (
      parentPath: string[],
      fileName: string,
      type: 'file' | 'folder' = 'file',
      properties: Partial<FileNode> = {}
    ) => {
      fileOperations.createFile(parentPath, fileName, type, properties);
      bus.emit({
        type: 'file:create',
        path: [...parentPath, fileName],
        name: fileName,
        nodeType: type,
      });
    },
    [fileOperations, bus]
  );

  const createFolderEmitting = useCallback(
    (parentPath: string[], folderName: string) => {
      createFile(parentPath, folderName, 'folder');
    },
    [createFile]
  );

  const deleteFile = useCallback(
    (parentPath: string[], fileName: string) => {
      fileOperations.deleteFile(parentPath, fileName);
      bus.emit({ type: 'file:delete', path: [...parentPath, fileName], name: fileName });
    },
    [fileOperations, bus]
  );

  const renameFile = useCallback(
    (parentPath: string[], oldName: string, newName: string) => {
      fileOperations.renameFile(parentPath, oldName, newName);
      bus.emit({ type: 'file:rename', path: parentPath, oldName, newName });
    },
    [fileOperations, bus]
  );

  const restoreFromRecycleBin = useCallback(
    (binKey: string) => {
      fileOperations.restoreFromRecycleBin(binKey);
      bus.emit({ type: 'file:restore', name: binKey });
    },
    [fileOperations, bus]
  );

  // Event-emitting wrappers for the mutations that were passed through raw
  // (#116). Same layering decision as createFile/deleteFile above: the emit
  // lives in this context, not in useFileOperations, so internal call sites
  // (e.g. unlockNode's force-unlock via updateFile) stay silent by design and
  // only user/host-driven mutations announce themselves on the bus.
  const updateFile = useCallback(
    (path: string[], updates: Partial<FileNode>) => {
      fileOperations.updateFile(path, updates);
      const content = (updates as { content?: unknown }).content;
      bus.emit({
        type: 'file:update',
        path,
        name: path[path.length - 1] ?? '',
        ...(typeof content === 'string' ? { content } : {}),
      });
    },
    [fileOperations, bus]
  );

  const deleteFolder = useCallback(
    (parentPath: string[], folderName: string) => {
      fileOperations.deleteFolder(parentPath, folderName);
      bus.emit({ type: 'folder:delete', path: [...parentPath, folderName], name: folderName });
    },
    [fileOperations, bus]
  );

  const moveFile = useCallback(
    (
      sourcePath: string[],
      fileName: string,
      destinationPath: string[],
      newName: string = fileName
    ) => {
      fileOperations.moveFile(sourcePath, fileName, destinationPath, newName);
      bus.emit({
        type: 'file:move',
        from: [...sourcePath, fileName],
        to: [...destinationPath, newName],
        name: newName,
      });
    },
    [fileOperations, bus]
  );

  const copyFile = useCallback(
    (
      sourcePath: string[],
      fileName: string,
      destinationPath: string[],
      newName: string = fileName
    ) => {
      fileOperations.copyFile(sourcePath, fileName, destinationPath, newName);
      bus.emit({
        type: 'file:copy',
        from: [...sourcePath, fileName],
        to: [...destinationPath, newName],
        name: newName,
      });
    },
    [fileOperations, bus]
  );

  const emptyRecycleBin = useCallback(() => {
    fileOperations.emptyRecycleBin();
    bus.emit({ type: 'recyclebin:empty' });
  }, [fileOperations, bus]);

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

  // Per-node failed-attempt counters for password:fail (#116). Keyed by node
  // name — checkAccess only sees the node, so the emitted path is the single
  // name segment (the authoritative locator here is `name`).
  const passwordAttemptsRef = useRef<Record<string, number>>({});

  const checkAccess = useCallback(
    (node: FileNode, passwordInput: string): boolean => {
      if (!node.locked) return true;
      const granted = node.password === passwordInput;
      if (granted) {
        passwordAttemptsRef.current[node.name] = 0;
        bus.emit({ type: 'file:unlock', name: node.name });
      } else {
        const attempt = (passwordAttemptsRef.current[node.name] ?? 0) + 1;
        passwordAttemptsRef.current[node.name] = attempt;
        bus.emit({ type: 'password:fail', path: [node.name], name: node.name, attempt });
      }
      return granted;
    },
    [bus]
  );

  // Persistently clear `locked` on a node and announce it (#115). Unlike
  // checkAccess this is a host/scenario-driven force-unlock (no password),
  // and it mutates the tree so the unlock survives reload.
  const unlockNode = useCallback(
    (path: string[]) => {
      const node = getFile(path);
      if (!node || !node.locked) return;
      fileOperations.updateFile(path, { locked: false });
      bus.emit({ type: 'file:unlock', name: node.name });
    },
    [getFile, fileOperations, bus]
  );

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
      if (didPaste && clipboard) {
        // Paste is a move (cut) or a copy (copy) — surface it as such (#116) so
        // scenarios can react to the relocation, not just the clipboard action.
        const names = clipboard.fileNames?.length ? clipboard.fileNames : [clipboard.fileName];
        const eventType = clipboard.type === 'cut' ? 'file:move' : 'file:copy';
        names.forEach(name => {
          bus.emit({
            type: eventType,
            from: [...clipboard.sourcePath, name],
            to: [...destinationPath, name],
            name,
          });
        });
        if (clipboard.type === 'cut') {
          setClipboard(null);
        }
      }
      return didPaste;
    },
    [clipboard, fileOperations, fs, bus]
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

      let sizeBytes = 0;
      let childCount: number | null = null;
      if (isContainerNode(node)) {
        childCount = Object.keys(node.children || {}).length;
      } else if (isFileContentNode(node) && node.content) {
        sizeBytes = node.content.length;
      }

      return {
        name: node.name,
        type: node.type,
        sizeBytes,
        childCount,
        icon: node.icon,
        created: node.ctime ?? null,
        modified: node.mtime ?? null,
        accessed: node.atime ?? null,
        locked: !!node.locked,
        broken: !!node.broken,
        hidden: !!node.hidden,
        readOnly: !!node.protected,
      };
    },
    [getFile]
  );

  const saveFsState = useCallback(() => {
    doPersistFs(fs);
  }, [fs, doPersistFs]);

  const resetToDefault = useCallback(() => {
    const next = withConfiguredLayers(baseFsRef.current);
    setFs(next);
    recycleBinRef.current = {};
    storage.saveRecycleBin({});
    doPersistFs(next);
  }, [doPersistFs, withConfiguredLayers, storage]);

  // Snapshot read/write (#117). The live tree already carries file contents
  // (hydrated from IndexedDB at mount), so serializing is a deep clone; loading
  // clears this instance's storage then re-persists against the same default
  // baseline, so a reload reconstructs the snapshot exactly.
  const getFsSnapshot = useCallback(
    (): { root: FileNode } => JSON.parse(JSON.stringify(fs)) as { root: FileNode },
    [fs]
  );

  const getRecycleBinItems = useCallback(
    (): Record<string, RecycleBinItem> =>
      JSON.parse(JSON.stringify(recycleBinRef.current)) as Record<string, RecycleBinItem>,
    []
  );

  const loadFsSnapshot = useCallback(
    async (tree: { root: FileNode }, recycleBin: Record<string, RecycleBinItem>) => {
      await storage.clearAllStorage();
      await persistFs(storage, tree, true, { defaultFs: baseFsRef.current });
      storage.saveRecycleBin(recycleBin ?? {});
    },
    [storage]
  );

  // In-memory tree replacement for rehearsal/seek (#207): re-render now, persist,
  // no reload. A deep clone keeps the caller's baseline immutable across seeks.
  const applyFsSnapshotInMemory = useCallback(
    (tree: { root: FileNode }) => {
      const cloned = JSON.parse(JSON.stringify(tree)) as { root: FileNode };
      setFs(cloned);
      doPersistFs(cloned);
    },
    [doPersistFs]
  );

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
    unlockNode,
    updateFile,
    createFile,
    createFolder: createFolderEmitting,
    renameFile,
    deleteFile,
    deleteFolder,
    copyFile,
    copyToClipboard,
    cutFile,
    pasteFile,
    emptyRecycleBin,
    restoreFromRecycleBin,
    searchFiles,
    getFileProperties,
    moveFile,
    saveFsState,
    resetToDefault,
    getFsSnapshot,
    getRecycleBinItems,
    loadFsSnapshot,
    applyFsSnapshotInMemory,
    uploadTextFile,
    downloadTextFile,
  };

  return <FileSystemContext.Provider value={contextValue}>{children}</FileSystemContext.Provider>;
};
