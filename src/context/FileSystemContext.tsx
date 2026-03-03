import React, { createContext, useState, useContext, useCallback } from 'react';
import initialFileSystem from '../data/filesystem.json';
import { FileNode, ClipboardItem } from '../types';

// Load all JSON files from src/data/recycle_bin
const recycleBinFiles = import.meta.glob('../data/recycle_bin/*.json', { eager: true });

// Merge all recycle bin items
const recycleBinItems: Record<string, FileNode> = {};
for (const path in recycleBinFiles) {
  const module = recycleBinFiles[path];
  const content = module.default || module;
  Object.assign(recycleBinItems, content);
}

// Deep clone initialFileSystem to avoid mutating the original import
const fileSystemWithRecycleBin = JSON.parse(JSON.stringify(initialFileSystem));

// Inject items into Recycle Bin
if (
  fileSystemWithRecycleBin.root &&
  fileSystemWithRecycleBin.root.children &&
  fileSystemWithRecycleBin.root.children['回收站']
) {
  fileSystemWithRecycleBin.root.children['回收站'].children = {
    ...fileSystemWithRecycleBin.root.children['回收站'].children,
    ...recycleBinItems
  };
}

interface FileSystemContextType {
  fs: { root: FileNode };
  clipboard: ClipboardItem | null;
  getFile: (path: string[]) => FileNode | null;
  checkAccess: (node: FileNode, passwordInput: string) => boolean;
  updateFile: (path: string[], updates: Partial<FileNode>) => void;
  createFile: (parentPath: string[], fileName: string, type?: 'file' | 'folder', properties?: Partial<FileNode>) => void;
  renameFile: (parentPath: string[], oldName: string, newName: string) => void;
  deleteFile: (parentPath: string[], fileName: string) => void;
  moveFile: (sourcePath: string[], fileName: string, destinationPath: string[], newName?: string) => void;
  copyFile: (sourcePath: string[], fileName: string, destinationPath: string[], newName?: string) => void;
  cutFile: (sourcePath: string[], fileName: string) => void;
  pasteFile: (destinationPath: string[]) => boolean;
  emptyRecycleBin: () => void;
  restoreFromRecycleBin: (fileName: string) => void;
  searchFiles: (query: string, startPath?: string[]) => Array<{ path: string[]; name: string; type: string; icon?: string }>;
  getFileProperties: (path: string[], fileName: string) => {
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
}

const FileSystemContext = createContext<FileSystemContextType | undefined>(undefined);

export const useFileSystem = (): FileSystemContextType => {
  const context = useContext(FileSystemContext);
  if (context === undefined) {
    throw new Error('useFileSystem must be used within a FileSystemProvider');
  }
  return context;
};

export const FileSystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [fs, setFs] = useState<{ root: FileNode }>(fileSystemWithRecycleBin);
  const [clipboard, setClipboard] = useState<ClipboardItem | null>(null);

  const getFile = useCallback((path: string[]): FileNode | null => {
    let current = fs.root;
    for (let part of path) {
      if (current.children && current.children[part]) {
        current = current.children[part];
      } else {
        return null;
      }
    }
    return current;
  }, [fs]);

  const checkAccess = useCallback((node: FileNode, passwordInput: string): boolean => {
    if (!node.locked) return true;
    return node.password === passwordInput;
  }, []);

  const updateFile = useCallback((path: string[], updates: Partial<FileNode>) => {
    setFs(prevFs => {
      const newFs = JSON.parse(JSON.stringify(prevFs));
      let current = newFs.root;
      for (let part of path) {
        if (current.children && current.children[part]) {
          current = current.children[part];
        } else {
          return prevFs;
        }
      }
      Object.assign(current, updates);
      return newFs;
    });
  }, []);

  const createFile = useCallback((parentPath: string[], fileName: string, type: 'file' | 'folder' = 'file', properties: Partial<FileNode> = {}) => {
    setFs(prevFs => {
      const newFs = JSON.parse(JSON.stringify(prevFs));
      let current = newFs.root;
      for (let part of parentPath) {
        if (current.children && current.children[part]) {
          current = current.children[part];
        } else {
          return prevFs;
        }
      }
      if (!current.children) {
        current.children = {};
      }
      current.children[fileName] = {
        type,
        name: fileName,
        ...(type === 'folder' ? { children: {} } : {}),
        ...properties
      };
      return newFs;
    });
  }, []);

  const renameFile = useCallback((parentPath: string[], oldName: string, newName: string) => {
    setFs(prevFs => {
      const newFs = JSON.parse(JSON.stringify(prevFs));
      let current = newFs.root;
      for (let part of parentPath) {
        if (current.children && current.children[part]) {
          current = current.children[part];
        } else {
          return prevFs;
        }
      }
      if (current.children && current.children[oldName]) {
        const file = current.children[oldName];
        delete current.children[oldName];
        current.children[newName] = {
          ...file,
          name: newName
        };
      }
      return newFs;
    });
  }, []);

  const deleteFile = useCallback((parentPath: string[], fileName: string) => {
    setFs(prevFs => {
      const newFs = JSON.parse(JSON.stringify(prevFs));
      let current = newFs.root;
      for (let part of parentPath) {
        if (current.children && current.children[part]) {
          current = current.children[part];
        } else {
          return prevFs;
        }
      }
      if (current.children && current.children[fileName]) {
        const file = current.children[fileName];
        delete current.children[fileName];

        const recycleBin = newFs.root.children['回收站'];
        if (recycleBin && !recycleBin.children) {
          recycleBin.children = {};
        }
        if (recycleBin && recycleBin.children) {
          recycleBin.children[fileName] = file;
        }
      }
      return newFs;
    });
  }, []);

  const moveFile = useCallback((sourcePath: string[], fileName: string, destinationPath: string[], newName: string = fileName) => {
    setFs(prevFs => {
      const newFs = JSON.parse(JSON.stringify(prevFs));

      let sourceParent = newFs.root;
      for (let part of sourcePath) {
        if (sourceParent.children && sourceParent.children[part]) {
          sourceParent = sourceParent.children[part];
        } else {
          return prevFs;
        }
      }

      if (!sourceParent.children || !sourceParent.children[fileName]) {
        return prevFs;
      }

      let destinationParent = newFs.root;
      for (let part of destinationPath) {
        if (destinationParent.children && destinationParent.children[part]) {
          destinationParent = destinationParent.children[part];
        } else {
          return prevFs;
        }
      }

      if (!destinationParent.children) {
        destinationParent.children = {};
      }

      destinationParent.children[newName] = JSON.parse(JSON.stringify(sourceParent.children[fileName]));
      destinationParent.children[newName].name = newName;
      delete sourceParent.children[fileName];

      return newFs;
    });
  }, []);

  const copyFile = useCallback((sourcePath: string[], fileName: string, destinationPath: string[], newName: string = fileName) => {
    setFs(prevFs => {
      const newFs = JSON.parse(JSON.stringify(prevFs));

      let sourceParent = newFs.root;
      for (let part of sourcePath) {
        if (sourceParent.children && sourceParent.children[part]) {
          sourceParent = sourceParent.children[part];
        } else {
          return prevFs;
        }
      }

      if (!sourceParent.children || !sourceParent.children[fileName]) {
        return prevFs;
      }

      let destinationParent = newFs.root;
      for (let part of destinationPath) {
        if (destinationParent.children && destinationParent.children[part]) {
          destinationParent = destinationParent.children[part];
        } else {
          return prevFs;
        }
      }

      if (!destinationParent.children) {
        destinationParent.children = {};
      }

      destinationParent.children[newName] = JSON.parse(JSON.stringify(sourceParent.children[fileName]));
      destinationParent.children[newName].name = newName;

      return newFs;
    });
  }, []);

  const cutFile = useCallback((sourcePath: string[], fileName: string) => {
    setClipboard({
      type: 'cut',
      sourcePath,
      fileName
    });
  }, []);

  const pasteFile = useCallback((destinationPath: string[]): boolean => {
    if (!clipboard) return false;

    if (clipboard.type === 'cut') {
      const { sourcePath, fileName } = clipboard;

      setFs(prevFs => {
        const newFs = JSON.parse(JSON.stringify(prevFs));

        let sourceParent = newFs.root;
        for (let part of sourcePath) {
          if (sourceParent.children && sourceParent.children[part]) {
            sourceParent = sourceParent.children[part];
          } else {
            return prevFs;
          }
        }

        let destinationParent = newFs.root;
        for (let part of destinationPath) {
          if (destinationParent.children && destinationParent.children[part]) {
            destinationParent = destinationParent.children[part];
          } else {
            return prevFs;
          }
        }

        if (!sourceParent.children || !sourceParent.children[fileName]) {
          return prevFs;
        }

        if (!destinationParent.children) {
          destinationParent.children = {};
        }

        destinationParent.children[fileName] = JSON.parse(JSON.stringify(sourceParent.children[fileName]));
        delete sourceParent.children[fileName];

        return newFs;
      });

      setClipboard(null);
    } else if (clipboard.type === 'copy') {
      const { sourcePath, fileName } = clipboard;
      copyFile(sourcePath, fileName, destinationPath);
    }

    return true;
  }, [clipboard, copyFile]);

  const emptyRecycleBin = useCallback(() => {
    setFs(prevFs => {
      const newFs = JSON.parse(JSON.stringify(prevFs));
      if (newFs.root.children['回收站']) {
        newFs.root.children['回收站'].children = {};
      }
      return newFs;
    });
  }, []);

  const restoreFromRecycleBin = useCallback((fileName: string) => {
    setFs(prevFs => {
      const newFs = JSON.parse(JSON.stringify(prevFs));
      const recycleBin = newFs.root.children['回收站'];
      if (recycleBin?.children?.[fileName]) {
        if (!newFs.root.children) newFs.root.children = {};
        newFs.root.children[fileName] = recycleBin.children[fileName];
        delete recycleBin.children[fileName];
      }
      return newFs;
    });
  }, []);

  const searchFiles = useCallback((query: string, startPath: string[] = []): Array<{ path: string[]; name: string; type: string; icon?: string }> => {
    const results: Array<{ path: string[]; name: string; type: string; icon?: string }> = [];
    const searchNode = (node: FileNode, path: string[]) => {
      if (node.name.toLowerCase().includes(query.toLowerCase())) {
        results.push({
          path: [...path],
          name: node.name,
          type: node.type,
          icon: node.icon
        });
      }

      if (node.children) {
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
  }, [getFile]);

  const getFileProperties = useCallback((path: string[], fileName: string) => {
    const node = getFile([...path, fileName]);
    if (!node) return null;

    const size = node.type === 'folder'
      ? `${Object.keys(node.children || {}).length} 个对象`
      : node.content ? `${node.content.length} 字节` : '0 字节';

    return {
      name: node.name,
      type: node.type,
      size,
      icon: node.icon,
      created: '2003年10月25日',
      modified: '2003年10月25日',
      accessed: '2003年10月25日',
      locked: !!node.locked,
      broken: !!node.broken
    };
  }, [getFile]);

  const contextValue: FileSystemContextType = {
    fs,
    clipboard,
    getFile,
    checkAccess,
    updateFile,
    createFile,
    renameFile,
    deleteFile,
    copyFile,
    cutFile,
    pasteFile,
    emptyRecycleBin,
    restoreFromRecycleBin,
    searchFiles,
    getFileProperties,
    moveFile
  };

  return (
    <FileSystemContext.Provider value={contextValue}>
      {children}
    </FileSystemContext.Provider>
  );
};
