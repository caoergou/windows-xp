import React, { createContext, useState, useContext, useCallback, useEffect, useRef } from 'react';
import initialFileSystem from '../../data/filesystem.json';
import { FileNode, ClipboardItem, isContainerNode, isFileContentNode } from '../../types';
import {
  loadPersistedFileSystem,
  persistFs,
  saveRecycleBin,
  RecycleBinItem,
} from './utils/persistence';
import { useFileOperations } from './hooks/useFileOperations';

// Load all JSON files from src/data/recycle_bin
const recycleBinFiles = import.meta.glob('../../data/recycle_bin/*.json', { eager: true });

// Merge all recycle bin items
const recycleBinItems: Record<string, FileNode> = {};
for (const path in recycleBinFiles) {
  const module = recycleBinFiles[path] as { default?: Record<string, FileNode> };
  const content = module.default || (module as Record<string, FileNode>);
  Object.assign(recycleBinItems, content);
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
  renameFile: (parentPath: string[], oldName: string, newName: string) => void;
  deleteFile: (parentPath: string[], fileName: string) => void;
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
  copyToClipboard: (sourcePath: string[], fileName: string) => void;
  cutFile: (sourcePath: string[], fileName: string) => void;
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
}> = ({ children, customFileSystem }) => {
  const customFsRef = useRef(customFileSystem);

  const [fs, setFs] = useState<{ root: FileNode }>(
    mergeCustomFileSystem(fileSystemWithRecycleBin, customFileSystem)
  );
  const [clipboard, setClipboard] = useState<ClipboardItem | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const recycleBinRef = useRef<Record<string, RecycleBinItem>>({});

  useEffect(() => {
    const loadPersistedData = async () => {
      try {
        const { root, recycleBinRef: savedRecycleBinRef } = await loadPersistedFileSystem(
          fileSystemWithRecycleBin
        );
        recycleBinRef.current = savedRecycleBinRef;
        setFs(mergeCustomFileSystem({ root }, customFsRef.current));
      } catch (e) {
        console.error('Failed to load persisted data:', e);
        setFs(mergeCustomFileSystem(fileSystemWithRecycleBin, customFsRef.current));
      } finally {
        setIsLoaded(true);
      }
    };

    loadPersistedData();
  }, []);

  const doPersistFs = useCallback(
    async (newFs: { root: FileNode }) => {
      await persistFs(newFs, isLoaded);
    },
    [isLoaded]
  );

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

  const copyToClipboard = useCallback((sourcePath: string[], fileName: string) => {
    setClipboard({ type: 'copy', sourcePath, fileName });
  }, []);

  const cutFile = useCallback((sourcePath: string[], fileName: string) => {
    setClipboard({ type: 'cut', sourcePath, fileName });
  }, []);

  const pasteFile = useCallback(
    (destinationPath: string[]): boolean => {
      const didPaste = fileOperations.pasteFile(destinationPath, clipboard);
      if (didPaste && clipboard?.type === 'cut') {
        setClipboard(null);
      }
      return didPaste;
    },
    [clipboard, fileOperations]
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
    setFs(fileSystemWithRecycleBin);
    recycleBinRef.current = {};
    saveRecycleBin({});
    doPersistFs(fileSystemWithRecycleBin);
  }, [doPersistFs]);

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
    renameFile: fileOperations.renameFile,
    deleteFile: fileOperations.deleteFile,
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
