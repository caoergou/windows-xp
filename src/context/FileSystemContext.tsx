import React, { createContext, useState, useContext, useCallback, useEffect, useRef } from 'react';
import initialFileSystem from '../data/filesystem.json';
import { FileNode, ClipboardItem, isContainerNode, isFileContentNode } from '../types';
import {
  saveFileContent,
  getFileContent,
  deleteFileContent,
  saveMetadata,
  getMetadata,
  saveRecycleBin,
  getRecycleBin
} from '../utils/storage';

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
  copyToClipboard: (sourcePath: string[], fileName: string) => void;
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
  // New methods for persistence
  saveFsState: () => void;
  resetToDefault: () => void;
  // Upload/download methods
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

export const FileSystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [fs, setFs] = useState<{ root: FileNode }>(fileSystemWithRecycleBin);
  const [clipboard, setClipboard] = useState<ClipboardItem | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const recycleBinRef = useRef<Record<string, { item: FileNode; originalPath: string[] }>>({});

  // Load persisted data on mount
  useEffect(() => {
    const loadPersistedData = async () => {
      try {
        // Load metadata
        const metadata = getMetadata();
        const savedRecycleBin = getRecycleBin();

        // Start with default filesystem
        let mergedFs = JSON.parse(JSON.stringify(initialFileSystem));

        // Merge persisted file contents
        if (metadata?.files) {
          for (const [pathKey, fileMeta] of Object.entries(metadata.files)) {
            const pathParts = pathKey.split('/').filter(Boolean);
            const content = await getFileContent(pathParts);

            if (content !== null) {
              // Navigate to parent and update file
              let current: FileNode = mergedFs.root;
              for (let i = 0; i < pathParts.length - 1; i++) {
                const part = pathParts[i];
                if (isContainerNode(current) && current.children?.[part]) {
                  current = current.children[part];
                }
              }

              const fileName = pathParts[pathParts.length - 1];
              if (isContainerNode(current) && current.children?.[fileName]) {
                current.children[fileName] = {
                  ...current.children[fileName],
                  content,
                  ...fileMeta
                };
              } else if (isContainerNode(current)) {
                // File was created by user, add it
                current.children[fileName] = {
                  type: 'file',
                  name: fileName,
                  content,
                  ...fileMeta
                } as FileNode;
              }
            }
          }
        }

        // Inject recycle bin items from localStorage
        if (savedRecycleBin && mergedFs.root?.children?.['回收站']) {
          mergedFs.root.children['回收站'].children = {};
          for (const [fileName, binItem] of Object.entries(savedRecycleBin)) {
            mergedFs.root.children['回收站'].children[fileName] = binItem.item as FileNode;
          }
          recycleBinRef.current = savedRecycleBin as Record<string, { item: FileNode; originalPath: string[] }>;
        } else {
          // Load from JSON files (original behavior)
          mergedFs.root.children['回收站'].children = recycleBinItems;
        }

        setFs(mergedFs);
      } catch (e) {
        console.error('Failed to load persisted data:', e);
        setFs(fileSystemWithRecycleBin);
      } finally {
        setIsLoaded(true);
      }
    };

    loadPersistedData();
  }, []);

  // Persist filesystem changes
  const persistFs = useCallback(async (newFs: { root: FileNode }) => {
    if (!isLoaded) return;

    try {
      const metadata: Record<string, unknown> = {};

      // Walk the tree and save file contents
      const walkTree = async (node: FileNode, path: string[]) => {
        if (isFileContentNode(node) && node.content !== undefined) {
          const pathKey = path.join('/');
          await saveFileContent(path, node.content);
          metadata[pathKey] = {
            path,
            name: node.name,
            type: 'file',
            icon: node.icon,
            locked: node.locked,
            password: node.password,
            broken: node.broken,
            hint: node.hint,
            app: node.app,
            readOnly: node.readOnly,
            description: node.description,
            modifiedAt: Date.now()
          };
        }

        if (isContainerNode(node) && node.children) {
          for (const [key, child] of Object.entries(node.children)) {
            await walkTree(child, [...path, key]);
          }
        }
      };

      await walkTree(newFs.root, []);
      saveMetadata({ files: metadata, version: 1, lastModified: Date.now() });
    } catch (e) {
      console.error('Failed to persist filesystem:', e);
    }
  }, [isLoaded]);

  const getFile = useCallback((path: string[]): FileNode | null => {
    let current = fs.root;
    for (let part of path) {
      if (isContainerNode(current) && current.children?.[part]) {
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
        if (isContainerNode(current) && current.children?.[part]) {
          current = current.children[part];
        } else {
          return prevFs;
        }
      }
      Object.assign(current, updates);
      persistFs(newFs);
      return newFs;
    });
  }, [persistFs]);

  const createFile = useCallback((parentPath: string[], fileName: string, type: 'file' | 'folder' = 'file', properties: Partial<FileNode> = {}) => {
    setFs(prevFs => {
      const newFs = JSON.parse(JSON.stringify(prevFs));
      let current = newFs.root;
      for (let part of parentPath) {
        if (isContainerNode(current) && current.children?.[part]) {
          current = current.children[part];
        } else {
          return prevFs;
        }
      }
      if (!isContainerNode(current)) {
        return prevFs;
      }
      if (!current.children) {
        current.children = {};
      }
      current.children[fileName] = {
        type,
        name: fileName,
        ...(type === 'folder' ? { children: {} } : {}),
        ...properties
      } as FileNode;
      persistFs(newFs);
      return newFs;
    });
  }, [persistFs]);

  const renameFile = useCallback((parentPath: string[], oldName: string, newName: string) => {
    setFs(prevFs => {
      const newFs = JSON.parse(JSON.stringify(prevFs));
      let current = newFs.root;
      for (let part of parentPath) {
        if (isContainerNode(current) && current.children?.[part]) {
          current = current.children[part];
        } else {
          return prevFs;
        }
      }
      if (isContainerNode(current) && current.children?.[oldName]) {
        const file = current.children[oldName];
        delete current.children[oldName];
        current.children[newName] = {
          ...file,
          name: newName
        };
        persistFs(newFs);
      }
      return newFs;
    });
  }, [persistFs]);

  const deleteFile = useCallback((parentPath: string[], fileName: string) => {
    setFs(prevFs => {
      const newFs = JSON.parse(JSON.stringify(prevFs));
      let current = newFs.root;
      for (let part of parentPath) {
        if (isContainerNode(current) && current.children?.[part]) {
          current = current.children[part];
        } else {
          return prevFs;
        }
      }
      if (isContainerNode(current) && current.children?.[fileName]) {
        const file = current.children[fileName];
        delete current.children[fileName];

        // Move to recycle bin
        const recycleBin = newFs.root.children['回收站'];
        if (recycleBin && !recycleBin.children) {
          recycleBin.children = {};
        }
        if (recycleBin && recycleBin.children) {
          recycleBin.children[fileName] = file;

          // Save to persistent recycle bin
          recycleBinRef.current[fileName] = {
            item: file,
            originalPath: parentPath
          };
          saveRecycleBin(recycleBinRef.current);
        }
      }
      persistFs(newFs);
      return newFs;
    });
  }, [persistFs]);

  const moveFile = useCallback((sourcePath: string[], fileName: string, destinationPath: string[], newName: string = fileName) => {
    setFs(prevFs => {
      const newFs = JSON.parse(JSON.stringify(prevFs));

      let sourceParent = newFs.root;
      for (let part of sourcePath) {
        if (isContainerNode(sourceParent) && sourceParent.children?.[part]) {
          sourceParent = sourceParent.children[part];
        } else {
          return prevFs;
        }
      }

      if (!isContainerNode(sourceParent) || !sourceParent.children?.[fileName]) {
        return prevFs;
      }

      let destinationParent = newFs.root;
      for (let part of destinationPath) {
        if (isContainerNode(destinationParent) && destinationParent.children?.[part]) {
          destinationParent = destinationParent.children[part];
        } else {
          return prevFs;
        }
      }

      if (!isContainerNode(destinationParent)) {
        return prevFs;
      }

      if (!destinationParent.children) {
        destinationParent.children = {};
      }

      destinationParent.children[newName] = JSON.parse(JSON.stringify(sourceParent.children[fileName]));
      destinationParent.children[newName].name = newName;
      delete sourceParent.children[fileName];

      persistFs(newFs);
      return newFs;
    });
  }, [persistFs]);

  const copyFile = useCallback((sourcePath: string[], fileName: string, destinationPath: string[], newName: string = fileName) => {
    setFs(prevFs => {
      const newFs = JSON.parse(JSON.stringify(prevFs));

      let sourceParent = newFs.root;
      for (let part of sourcePath) {
        if (isContainerNode(sourceParent) && sourceParent.children?.[part]) {
          sourceParent = sourceParent.children[part];
        } else {
          return prevFs;
        }
      }

      if (!isContainerNode(sourceParent) || !sourceParent.children?.[fileName]) {
        return prevFs;
      }

      let destinationParent = newFs.root;
      for (let part of destinationPath) {
        if (isContainerNode(destinationParent) && destinationParent.children?.[part]) {
          destinationParent = destinationParent.children[part];
        } else {
          return prevFs;
        }
      }

      if (!isContainerNode(destinationParent)) {
        return prevFs;
      }

      if (!destinationParent.children) {
        destinationParent.children = {};
      }

      destinationParent.children[newName] = JSON.parse(JSON.stringify(sourceParent.children[fileName]));
      destinationParent.children[newName].name = newName;

      persistFs(newFs);
      return newFs;
    });
  }, [persistFs]);

  const copyToClipboard = useCallback((sourcePath: string[], fileName: string) => {
    setClipboard({
      type: 'copy',
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
          if (isContainerNode(sourceParent) && sourceParent.children?.[part]) {
            sourceParent = sourceParent.children[part];
          } else {
            return prevFs;
          }
        }

        let destinationParent = newFs.root;
        for (let part of destinationPath) {
          if (isContainerNode(destinationParent) && destinationParent.children?.[part]) {
            destinationParent = destinationParent.children[part];
          } else {
            return prevFs;
          }
        }

        if (!isContainerNode(sourceParent) || !sourceParent.children?.[fileName]) {
          return prevFs;
        }

        if (!isContainerNode(destinationParent)) {
          return prevFs;
        }

        if (!destinationParent.children) {
          destinationParent.children = {};
        }

        destinationParent.children[fileName] = JSON.parse(JSON.stringify(sourceParent.children[fileName]));
        delete sourceParent.children[fileName];

        persistFs(newFs);
        return newFs;
      });

      setClipboard(null);
    } else if (clipboard.type === 'copy') {
      const { sourcePath, fileName } = clipboard;
      copyFile(sourcePath, fileName, destinationPath);
    }

    return true;
  }, [clipboard, copyFile, persistFs]);

  const emptyRecycleBin = useCallback(() => {
    setFs(prevFs => {
      const newFs = JSON.parse(JSON.stringify(prevFs));
      if (newFs.root.children['回收站']) {
        newFs.root.children['回收站'].children = {};
      }
      persistFs(newFs);
      return newFs;
    });
    recycleBinRef.current = {};
    saveRecycleBin({});
  }, [persistFs]);

  const restoreFromRecycleBin = useCallback((fileName: string) => {
    setFs(prevFs => {
      const newFs = JSON.parse(JSON.stringify(prevFs));
      const recycleBin = newFs.root.children['回收站'];
      if (recycleBin?.children?.[fileName]) {
        // Try to restore to original path if available
        const binItem = recycleBinRef.current[fileName];
        let targetParent = newFs.root;

        if (binItem?.originalPath?.length > 0) {
          for (const part of binItem.originalPath) {
            if (isContainerNode(targetParent) && targetParent.children?.[part]) {
              targetParent = targetParent.children[part];
            }
          }
        }

        if (isContainerNode(targetParent)) {
          if (!targetParent.children) {
            targetParent.children = {};
          }
          targetParent.children[fileName] = recycleBin.children[fileName];
        }
        delete recycleBin.children[fileName];
        delete recycleBinRef.current[fileName];
        saveRecycleBin(recycleBinRef.current);
      }
      persistFs(newFs);
      return newFs;
    });
  }, [persistFs]);

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
  }, [getFile]);

  const getFileProperties = useCallback((path: string[], fileName: string) => {
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
      broken: !!node.broken
    };
  }, [getFile]);

  const saveFsState = useCallback(() => {
    persistFs(fs);
  }, [fs, persistFs]);

  const resetToDefault = useCallback(() => {
    setFs(fileSystemWithRecycleBin);
    recycleBinRef.current = {};
    saveRecycleBin({});
    persistFs(fileSystemWithRecycleBin);
  }, [persistFs]);

  const uploadTextFile = useCallback((parentPath: string[], fileName: string, content: string) => {
    createFile(parentPath, fileName, 'file', {
      content,
      app: 'Notepad'
    });
  }, [createFile]);

  const downloadTextFile = useCallback((path: string[], fileName: string) => {
    const node = getFile([...path, fileName]);
    if (!isFileContentNode(node) || !node.content) return;

    const blob = new Blob([node.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
    uploadTextFile,
    downloadTextFile
  };

  return (
    <FileSystemContext.Provider value={contextValue}>
      {children}
    </FileSystemContext.Provider>
  );
};
