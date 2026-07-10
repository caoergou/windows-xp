/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback } from 'react';
import { produce } from 'immer';
import { sounds } from '../../../utils/soundManager';
import { FileNode, isContainerNode, ClipboardItem } from '../../../types';
import { saveRecycleBin, RecycleBinItem } from '../utils/persistence';

/**
 * Content paths touched by an operation. `dirty` limits IndexedDB writes to
 * the listed files; omitting `changes` entirely requests a full content
 * rewrite (used by subtree operations like move/copy). See persistFs (#81).
 */
export interface PersistChanges {
  dirty?: string[][];
  removed?: string[][];
}

/**
 * DOM event dispatched for user-facing filesystem notices (e.g. a recycle-bin
 * item restored to the desktop because its original folder is gone). The App
 * shell listens and shows an XP dialog.
 */
export const FS_NOTICE_EVENT = 'windows-xp:fs-notice';

export interface FsNoticeDetail {
  type: 'restore-fallback';
  name: string;
}

const dispatchFsNotice = (detail: FsNoticeDetail): void => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(FS_NOTICE_EVENT, { detail }));
};

export const useFileOperations = (
  setFs: React.Dispatch<React.SetStateAction<{ root: FileNode }>>,
  doPersistFs: (fs: { root: FileNode }, changes?: PersistChanges) => void,
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
        const contentChanged =
          (updates as Partial<FileNode> & { content?: string }).content !== undefined;
        doPersistFs(newFs, { dirty: contentChanged ? [path] : [] });
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
        doPersistFs(newFs, { dirty: [[...parentPath, fileName]] });
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
        doPersistFs(newFs, {
          dirty: [[...parentPath, newName]],
          removed: [[...parentPath, oldName]],
        });
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
        doPersistFs(newFs, { dirty: [], removed: [[...parentPath, folderName]] });
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
      sounds.recycle();
      setFs(prevFs => {
        let deletedBinKey: string | null = null;
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
            // Unique bin key so deleting a/f.txt then b/f.txt keeps BOTH
            // entries and their original paths (#81).
            let binKey = fileName;
            let suffix = 2;
            while (recycleBin.children[binKey] || recycleBinRef.current[binKey]) {
              binKey = `${fileName} (${suffix++})`;
            }
            recycleBin.children[binKey] = file;
            deletedBinKey = binKey;
          }
        });

        const movedFile = (() => {
          if (!deletedBinKey) return null;
          let current = newFs.root;
          const path = ['回收站', deletedBinKey];
          for (const part of path) {
            if (isContainerNode(current) && current.children?.[part]) {
              current = current.children[part];
            } else {
              return null;
            }
          }
          return current;
        })();

        if (movedFile && deletedBinKey) {
          recycleBinRef.current[deletedBinKey] = {
            item: movedFile,
            originalPath: parentPath,
            originalName: fileName,
            deletedAt: Date.now(),
          };
          saveRecycleBin(recycleBinRef.current);
        }
        doPersistFs(newFs, { dirty: [], removed: [[...parentPath, fileName]] });
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
    (destinationPath: string[], clipboard: ClipboardItem | null, fs?: { root: FileNode }): boolean => {
      if (!clipboard) return false;

      // Validate up front: the old implementation bailed silently inside
      // produce but still returned true, clearing a cut clipboard while the
      // file stayed put (#81).
      if (fs) {
        const nodeAt = (path: string[]): FileNode | null => {
          let current: FileNode = fs.root;
          for (const part of path) {
            if (isContainerNode(current) && current.children?.[part]) {
              current = current.children[part];
            } else {
              return null;
            }
          }
          return current;
        };
        const destination = nodeAt(destinationPath);
        if (!destination || !isContainerNode(destination)) return false;
        const source = nodeAt(clipboard.sourcePath);
        if (!source || !isContainerNode(source)) return false;
      }

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
    (binKey: string) => {
      setFs(prevFs => {
        const binItem = recycleBinRef.current[binKey];
        let restoredDegraded = false;
        const newFs = produce(prevFs, draft => {
          if (!isContainerNode(draft.root)) return;
          const recycleBin = (draft.root as any).children?.['回收站'];
          if (!recycleBin || !isContainerNode(recycleBin) || !recycleBin.children?.[binKey])
            return;

          // Strict walk: if any segment of the original path is gone, restore
          // to the desktop root and tell the user instead of silently
          // dropping the item into a wrong ancestor (#81).
          let targetParent: any = draft.root;
          if (binItem?.originalPath?.length > 0) {
            for (const part of binItem.originalPath) {
              if (isContainerNode(targetParent) && targetParent.children?.[part]) {
                targetParent = targetParent.children[part];
              } else {
                targetParent = draft.root;
                restoredDegraded = true;
                break;
              }
            }
          }

          if (isContainerNode(targetParent)) {
            if (!targetParent.children) {
              targetParent.children = {};
            }
            const originalName = binItem?.originalName ?? binKey;
            let targetName = originalName;
            let suffix = 2;
            while (targetParent.children[targetName]) {
              targetName = `${originalName} (${suffix++})`;
            }
            const restoredNode = recycleBin.children[binKey];
            targetParent.children[targetName] = {
              ...restoredNode,
              name: originalName,
            } as FileNode;
          }
          delete recycleBin.children[binKey];
        });
        delete recycleBinRef.current[binKey];
        saveRecycleBin(recycleBinRef.current);
        if (restoredDegraded && binItem) {
          dispatchFsNotice({
            type: 'restore-fallback',
            name: binItem.originalName ?? binKey,
          });
        }
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
