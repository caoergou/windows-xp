import React, { createContext, useState, useContext } from 'react';
import initialFileSystem from '../data/filesystem.json';

const FileSystemContext = createContext();

export const useFileSystem = () => useContext(FileSystemContext);

export const FileSystemProvider = ({ children }) => {
  const [fs, setFs] = useState(initialFileSystem);

  const getFile = (path) => {
    // Path is an array of keys, e.g. ["root", "children", "My Documents", "children", "file.txt"]
    // Or simpler: ["My Documents", "file.txt"] if we assume root children.
    // Let's implement a simple traversal.
    
    // For simplicity, let's assume path starts from root's children
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
