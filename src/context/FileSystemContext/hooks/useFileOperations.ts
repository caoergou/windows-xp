/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback } from 'react';
import { produce } from 'immer';
import { FileNode, isContainerNode, ClipboardItem } from '../../../types';
import { saveRecycleBin, RecycleBinItem } from '../utils/persistence';

export const useFileOperations = (
  setFs: React.Dispatch<React.SetStateAction<{ root: FileNode }>>,
  doPersistFs: (fs: { root: FileNode }) => Promise<void>,
  recycleBinRef: React.MutableRefObject<Record<string, RecycleBinItem>>
) => {
  const updateFile = useCallback(
    (path: string[], updates: Partial<FileNode>) => {
      setFs(prevFs => {
        const newFs = produce(prevFs, draft => {
          if (!isContainerNode(draft.root)) return;
          let current: any = draft.root;
          for (const part of path) {
            if (isContainerNode(current) && current.children?.[part]) {
              current = current.children[part];
            } else {
              return;
            }
          }
          Object.assign(current, updates);
        });
        doPersistFs(newFs);
        return newFs;
      });
    },
    [setFs, doPersistFs]
  );

  const createFile = useCallback(
    (
      parentPath: string[],
      fileName: string,
      type: 'file' | 'folder' = 'file',
      properties: Partial<FileNode> = {}
    ) => {
      setFs(prevFs => {
        const newFs = produce(prevFs, draft => {
          if (!isContainerNode(draft.root)) return;
          let current: any = draft.root;
          for (const part of parentPath) {
            if (isContainerNode(current) && current.children?.[part]) {
              current = current.children[part];
            } else {
              return;
            }
          }
          if (!isContainerNode(current)) return;
          if (!current.children) {
            current.children = {};
          }
          current.children[fileName] = {
            type,
            name: fileName,
            ...(type === 'folder' ? { children: {} } : {}),
            ...properties,
          } as FileNode;
        });
        doPersistFs(newFs);
        return newFs;
      });
    },
    [setFs, doPersistFs]
  );

  const renameFile = useCallback(
    (parentPath: string[], oldName: string, newName: string) => {
      setFs(prevFs => {
        const newFs = produce(prevFs, draft => {
          if (!isContainerNode(draft.root)) return;
          let current: any = draft.root;
          for (const part of parentPath) {
            if (isContainerNode(current) && current.children?.[part]) {
              current = current.children[part];
            } else {
              return;
            }
          }
          if (!isContainerNode(current) || !current.children?.[oldName]) return;
          const file = current.children[oldName];
          delete current.children[oldName];
          current.children[newName] = { ...file, name: newName } as FileNode;
        });
        doPersistFs(newFs);
        return newFs;
      });
    },
    [setFs, doPersistFs]
  );

  const createFolder = useCallback(
    (parentPath: string[], folderName: string) => {
      createFile(parentPath, folderName, 'folder');
    },
    [createFile]
  );

  const deleteFolder = useCallback(
    (parentPath: string[], folderName: string) => {
      setFs(prevFs => {
        const newFs = produce(prevFs, draft => {
          if (!isContainerNode(draft.root)) return;
          let current: any = draft.root;
          for (const part of parentPath) {
            if (isContainerNode(current) && current.children?.[part]) {
              current = current.children[part];
            } else {
              return;
            }
          }
          if (!isContainerNode(current) || !current.children?.[folderName]) return;
          const folder = current.children[folderName];
          if (!isContainerNode(folder) || Object.keys(folder.children || {}).length > 0) return;
          delete current.children[folderName];
        });
        doPersistFs(newFs);
        return newFs;
      });
    },
    [setFs, doPersistFs]
  );

  const renameNode = useCallback(
    (parentPath: string[], oldName: string, newName: string) => {
      renameFile(parentPath, oldName, newName);
    },
    [renameFile]
  );

  const deleteFile = useCallback(
    (parentPath: string[], fileName: string) => {
      setFs(prevFs => {
        const newFs = produce(prevFs, draft => {
          if (!isContainerNode(draft.root)) return;
          let current: any = draft.root;
          for (const part of parentPath) {
            if (isContainerNode(current) && current.children?.[part]) {
              current = current.children[part];
            } else {
              return;
            }
          }
          if (!isContainerNode(current) || !current.children?.[fileName]) return;
          const file = current.children[fileName];
          delete current.children[fileName];

          const recycleBin = (draft.root as any).children?.['回收站'];
          if (recycleBin && isContainerNode(recycleBin)) {
            if (!recycleBin.children) {
              recycleBin.children = {};
            }
            recycleBin.children[fileName] = file;
          }
        });

        const movedFile = (() => {
          let current = newFs.root;
          const path = ['回收站', fileName];
          for (const part of path) {
            if (isContainerNode(current) && current.children?.[part]) {
              current = current.children[part];
            } else {
              return null;
            }
          }
          return current;
        })();

        if (movedFile) {
          recycleBinRef.current[fileName] = {
            item: movedFile,
            originalPath: parentPath,
            deletedAt: Date.now(),
          };
          saveRecycleBin(recycleBinRef.current);
        }
        doPersistFs(newFs);
        return newFs;
      });
    },
    [setFs, doPersistFs, recycleBinRef]
  );

  const moveFile = useCallback(
    (
      sourcePath: string[],
      fileName: string,
      destinationPath: string[],
      newName: string = fileName
    ) => {
      setFs(prevFs => {
        const newFs = produce(prevFs, draft => {
          if (!isContainerNode(draft.root)) return;
          let sourceParent: any = draft.root;
          for (const part of sourcePath) {
            if (isContainerNode(sourceParent) && sourceParent.children?.[part]) {
              sourceParent = sourceParent.children[part];
            } else {
              return;
            }
          }

          if (!isContainerNode(sourceParent) || !sourceParent.children?.[fileName]) return;

          let destinationParent: any = draft.root;
          for (const part of destinationPath) {
            if (isContainerNode(destinationParent) && destinationParent.children?.[part]) {
              destinationParent = destinationParent.children[part];
            } else {
              return;
            }
          }

          if (!isContainerNode(destinationParent)) return;
          if (!destinationParent.children) {
            destinationParent.children = {};
          }

          destinationParent.children[newName] = JSON.parse(
            JSON.stringify(sourceParent.children[fileName])
          );
          destinationParent.children[newName].name = newName;
          delete sourceParent.children[fileName];
        });
        doPersistFs(newFs);
        return newFs;
      });
    },
    [setFs, doPersistFs]
  );

  const copyFile = useCallback(
    (
      sourcePath: string[],
      fileName: string,
      destinationPath: string[],
      newName: string = fileName
    ) => {
      setFs(prevFs => {
        const newFs = produce(prevFs, draft => {
          if (!isContainerNode(draft.root)) return;
          let sourceParent: any = draft.root;
          for (const part of sourcePath) {
            if (isContainerNode(sourceParent) && sourceParent.children?.[part]) {
              sourceParent = sourceParent.children[part];
            } else {
              return;
            }
          }

          if (!isContainerNode(sourceParent) || !sourceParent.children?.[fileName]) return;

          let destinationParent: any = draft.root;
          for (const part of destinationPath) {
            if (isContainerNode(destinationParent) && destinationParent.children?.[part]) {
              destinationParent = destinationParent.children[part];
            } else {
              return;
            }
          }

          if (!isContainerNode(destinationParent)) return;
          if (!destinationParent.children) {
            destinationParent.children = {};
          }

          destinationParent.children[newName] = JSON.parse(
            JSON.stringify(sourceParent.children[fileName])
          );
          destinationParent.children[newName].name = newName;
        });
        doPersistFs(newFs);
        return newFs;
      });
    },
    [setFs, doPersistFs]
  );

  const getClipboardFileNames = (item: ClipboardItem): string[] =>
    item.fileNames?.length ? item.fileNames : [item.fileName];

  const pasteFile = useCallback(
    (destinationPath: string[], clipboard: ClipboardItem | null): boolean => {
      if (!clipboard) return false;

      const names = getClipboardFileNames(clipboard);

      if (clipboard.type === 'cut') {
        const { sourcePath } = clipboard;
        setFs(prevFs => {
          const newFs = produce(prevFs, draft => {
            if (!isContainerNode(draft.root)) return;
            let sourceParent: any = draft.root;
            for (const part of sourcePath) {
              if (isContainerNode(sourceParent) && sourceParent.children?.[part]) {
                sourceParent = sourceParent.children[part];
              } else {
                return;
              }
            }

            let destinationParent: any = draft.root;
            for (const part of destinationPath) {
              if (isContainerNode(destinationParent) && destinationParent.children?.[part]) {
                destinationParent = destinationParent.children[part];
              } else {
                return;
              }
            }

            if (!isContainerNode(sourceParent) || !isContainerNode(destinationParent)) return;
            if (!destinationParent.children) {
              destinationParent.children = {};
            }

            for (const fileName of names) {
              if (!sourceParent.children?.[fileName]) continue;
              destinationParent.children[fileName] = JSON.parse(
                JSON.stringify(sourceParent.children[fileName])
              );
              delete sourceParent.children[fileName];
            }
          });
          doPersistFs(newFs);
          return newFs;
        });
        return true;
      } else if (clipboard.type === 'copy') {
        const { sourcePath } = clipboard;
        for (const fileName of names) {
          copyFile(sourcePath, fileName, destinationPath);
        }
        return true;
      }

      return false;
    },
    [setFs, doPersistFs, copyFile]
  );

  const emptyRecycleBin = useCallback(() => {
    setFs(prevFs => {
      const newFs = produce(prevFs, draft => {
        if (!isContainerNode(draft.root)) return;
        const recycleBin = (draft.root as any).children?.['回收站'];
        if (recycleBin && isContainerNode(recycleBin)) {
          recycleBin.children = {};
        }
      });
      doPersistFs(newFs);
      return newFs;
    });
    recycleBinRef.current = {};
    saveRecycleBin({});
  }, [setFs, doPersistFs, recycleBinRef]);

  const restoreFromRecycleBin = useCallback(
    (fileName: string) => {
      setFs(prevFs => {
        const binItem = recycleBinRef.current[fileName];
        const newFs = produce(prevFs, draft => {
          if (!isContainerNode(draft.root)) return;
          const recycleBin = (draft.root as any).children?.['回收站'];
          if (!recycleBin || !isContainerNode(recycleBin) || !recycleBin.children?.[fileName])
            return;

          let targetParent: any = draft.root;
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
        });
        delete recycleBinRef.current[fileName];
        saveRecycleBin(recycleBinRef.current);
        doPersistFs(newFs);
        return newFs;
      });
    },
    [setFs, doPersistFs, recycleBinRef]
  );

  return {
    updateFile,
    createFile,
    createFolder,
    renameFile,
    renameNode,
    deleteFile,
    deleteFolder,
    moveFile,
    copyFile,
    pasteFile,
    emptyRecycleBin,
    restoreFromRecycleBin,
  };
};
