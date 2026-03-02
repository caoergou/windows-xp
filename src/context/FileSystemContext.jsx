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

  return (
    <FileSystemContext.Provider value={{ fs, getFile, checkAccess }}>
      {children}
    </FileSystemContext.Provider>
  );
};
