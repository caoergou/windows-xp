import React, { createContext, useState, useContext } from 'react';
import initialFileSystem from '../data/filesystem.json';

const FileSystemContext = createContext();

export const useFileSystem = () => useContext(FileSystemContext);

// Load all JSON files from src/data/recycle_bin
const recycleBinFiles = import.meta.glob('../data/recycle_bin/*.json', { eager: true });

// Merge all recycle bin items
const recycleBinItems = {};
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

export const FileSystemProvider = ({ children }) => {
  const [fs, setFs] = useState(fileSystemWithRecycleBin);
  const [clipboard, setClipboard] = useState(null);

  const getFile = (path) => {
    let current = fs.root;
    for (let part of path) {
      if (current.children && current.children[part]) {
        current = current.children[part];
      } else {
        return null;
      }
    }
    return current;
  };

  const checkAccess = (node, passwordInput) => {
    if (!node.locked) return true;
    return node.password === passwordInput;
  };

  const updateFile = (path, updates) => {
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
  };

  const createFile = (parentPath, fileName, type = 'file', properties = {}) => {
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
  };

  const renameFile = (parentPath, oldName, newName) => {
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
  };

  const deleteFile = (parentPath, fileName) => {
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
  };

  const copyFile = (sourcePath, fileName, destinationPath, newName = fileName) => {
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
  };

  const cutFile = (sourcePath, fileName) => {
    setClipboard({
      type: 'cut',
      sourcePath,
      fileName
    });
  };

  const pasteFile = (destinationPath) => {
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
  };

  const searchFiles = (query, startPath = []) => {
    const results = [];
    const searchNode = (node, path) => {
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
  };

  const getFileProperties = (path, fileName) => {
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
  };

  return (
    <FileSystemContext.Provider
      value={{
        fs,
        getFile,
        checkAccess,
        updateFile,
        createFile,
        renameFile,
        deleteFile,
        copyFile,
        cutFile,
        pasteFile,
        searchFiles,
        getFileProperties,
        clipboard
      }}
    >
      {children}
    </FileSystemContext.Provider>
  );
};
