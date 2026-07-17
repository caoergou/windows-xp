import { useCallback } from 'react';
import { produce, current } from 'immer';
import { sounds } from '../../../utils/soundManager';
import { FileNode, isContainerNode, ClipboardItem } from '../../../types';
import { RecycleBinItem } from '../utils/persistence';
import { useStorage } from '../../StorageContext';
import { useClock } from '../../ClockContext';

type ContainerNode = Extract<FileNode, { children: Record<string, FileNode> }>;

/**
 * Walk to the container at `path` inside an immer draft (or plain tree).
 * Returns null when any segment is missing or the target is not a container.
 * This replaces nine hand-rolled copies of the same loop (#82).
 */
const getContainerAtPath = (root: FileNode, path: string[]): ContainerNode | null => {
  let node: FileNode = root;
  for (const part of path) {
    if (isContainerNode(node) && node.children?.[part]) {
      node = node.children[part];
    } else {
      return null;
    }
  }
  return isContainerNode(node) ? node : null;
};

const RECYCLE_BIN_KEY = '回收站';

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
  const storage = useStorage();
  const clock = useClock();
  const updateFile = useCallback(
    (path: string[], updates: Partial<FileNode>) => {
      setFs(prevFs => {
        const newFs = produce(prevFs, draft => {
          const parent = getContainerAtPath(draft.root, path.slice(0, -1));
          const name = path[path.length - 1];
          const node = path.length === 0 ? draft.root : parent?.children[name];
          if (!node) return;
          const contentChanged =
            (updates as Partial<FileNode> & { content?: string }).content !== undefined;
          Object.assign(node, updates, contentChanged ? { mtime: clock.now() } : {});
        });
        const contentChanged =
          (updates as Partial<FileNode> & { content?: string }).content !== undefined;
        doPersistFs(newFs, { dirty: contentChanged ? [path] : [] });
        return newFs;
      });
    },
    [setFs, doPersistFs, clock]
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
          const parent = getContainerAtPath(draft.root, parentPath);
          if (!parent) return;
          parent.children[fileName] = {
            type,
            name: fileName,
            ctime: clock.now(),
            mtime: clock.now(),
            atime: clock.now(),
            provenance: 'local',
            ...(type === 'folder' ? { children: {} } : {}),
            ...properties,
          } as FileNode;
        });
        doPersistFs(newFs, { dirty: [[...parentPath, fileName]] });
        return newFs;
      });
    },
    [setFs, doPersistFs, clock]
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
          const parent = getContainerAtPath(draft.root, parentPath);
          const folder = parent?.children[folderName];
          if (!parent || !folder) return;
          if (!isContainerNode(folder) || Object.keys(folder.children || {}).length > 0) return;
          delete parent.children[folderName];
        });
        doPersistFs(newFs, { dirty: [], removed: [[...parentPath, folderName]] });
        return newFs;
      });
    },
    [setFs, doPersistFs]
  );

  const renameFile = useCallback(
    (parentPath: string[], oldName: string, newName: string) => {
      setFs(prevFs => {
        const newFs = produce(prevFs, draft => {
          const parent = getContainerAtPath(draft.root, parentPath);
          const file = parent?.children[oldName];
          if (!parent || !file) return;
          delete parent.children[oldName];
          parent.children[newName] = { ...file, name: newName } as FileNode;
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

  const deleteFile = useCallback(
    (parentPath: string[], fileName: string) => {
      sounds.recycle();
      setFs(prevFs => {
        let deletedBinKey: string | null = null;
        const newFs = produce(prevFs, draft => {
          const parent = getContainerAtPath(draft.root, parentPath);
          const file = parent?.children[fileName];
          if (!parent || !file) return;
          delete parent.children[fileName];

          const recycleBin = getContainerAtPath(draft.root, [RECYCLE_BIN_KEY]);
          if (recycleBin) {
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

        if (deletedBinKey) {
          const recycleBin = getContainerAtPath(newFs.root, [RECYCLE_BIN_KEY]);
          const movedFile = recycleBin?.children[deletedBinKey];
          if (movedFile) {
            recycleBinRef.current[deletedBinKey] = {
              item: movedFile,
              originalPath: parentPath,
              originalName: fileName,
              deletedAt: clock.now(),
            };
            storage.saveRecycleBin(recycleBinRef.current);
          }
        }
        doPersistFs(newFs, { dirty: [], removed: [[...parentPath, fileName]] });
        return newFs;
      });
    },
    [setFs, doPersistFs, recycleBinRef, storage, clock]
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
          const sourceParent = getContainerAtPath(draft.root, sourcePath);
          const node = sourceParent?.children[fileName];
          if (!sourceParent || !node) return;
          const destinationParent = getContainerAtPath(draft.root, destinationPath);
          if (!destinationParent) return;

          // Relocate the draft node instead of deep-copying it (#82): the old
          // JSON.parse(JSON.stringify()) defeated immer's structural sharing.
          delete sourceParent.children[fileName];
          destinationParent.children[newName] = { ...node, name: newName } as FileNode;
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
          const sourceParent = getContainerAtPath(draft.root, sourcePath);
          const node = sourceParent?.children[fileName];
          if (!sourceParent || !node) return;
          const destinationParent = getContainerAtPath(draft.root, destinationPath);
          if (!destinationParent) return;

          // A copy needs a real snapshot; immer's current() replaces the old
          // JSON round-trip (#82).
          destinationParent.children[newName] = {
            ...current(node),
            name: newName,
            ctime: clock.now(),
            importedAt: clock.now(),
            provenance: 'local',
          } as FileNode;
        });
        doPersistFs(newFs);
        return newFs;
      });
    },
    [setFs, doPersistFs, clock]
  );

  const getClipboardFileNames = (item: ClipboardItem): string[] =>
    item.fileNames?.length ? item.fileNames : [item.fileName];

  const pasteFile = useCallback(
    (
      destinationPath: string[],
      clipboard: ClipboardItem | null,
      fs?: { root: FileNode }
    ): boolean => {
      if (!clipboard) return false;

      // Validate up front: the old implementation bailed silently inside
      // produce but still returned true, clearing a cut clipboard while the
      // file stayed put (#81).
      if (fs) {
        if (!getContainerAtPath(fs.root, destinationPath)) return false;
        if (!getContainerAtPath(fs.root, clipboard.sourcePath)) return false;
      }

      const names = getClipboardFileNames(clipboard);

      if (clipboard.type === 'cut') {
        const { sourcePath } = clipboard;
        setFs(prevFs => {
          const newFs = produce(prevFs, draft => {
            const sourceParent = getContainerAtPath(draft.root, sourcePath);
            const destinationParent = getContainerAtPath(draft.root, destinationPath);
            if (!sourceParent || !destinationParent) return;

            for (const fileName of names) {
              const node = sourceParent.children[fileName];
              if (!node) continue;
              delete sourceParent.children[fileName];
              destinationParent.children[fileName] = node;
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
        const recycleBin = getContainerAtPath(draft.root, [RECYCLE_BIN_KEY]);
        if (recycleBin) {
          recycleBin.children = {};
        }
      });
      doPersistFs(newFs);
      return newFs;
    });
    recycleBinRef.current = {};
    storage.saveRecycleBin({});
  }, [setFs, doPersistFs, recycleBinRef, storage]);

  const restoreFromRecycleBin = useCallback(
    (binKey: string) => {
      setFs(prevFs => {
        const binItem = recycleBinRef.current[binKey];
        let restoredDegraded = false;
        const newFs = produce(prevFs, draft => {
          const recycleBin = getContainerAtPath(draft.root, [RECYCLE_BIN_KEY]);
          if (!recycleBin || !recycleBin.children[binKey]) return;

          // Strict walk: if any segment of the original path is gone, restore
          // to the desktop root and tell the user instead of silently
          // dropping the item into a wrong ancestor (#81).
          let targetParent: ContainerNode | null = null;
          if (binItem?.originalPath?.length > 0) {
            targetParent = getContainerAtPath(draft.root, binItem.originalPath);
            if (!targetParent) {
              restoredDegraded = true;
            }
          }
          if (!targetParent) {
            targetParent = isContainerNode(draft.root) ? draft.root : null;
          }
          if (!targetParent) return;

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
          delete recycleBin.children[binKey];
        });
        delete recycleBinRef.current[binKey];
        storage.saveRecycleBin(recycleBinRef.current);
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
    [setFs, doPersistFs, recycleBinRef, storage]
  );

  return {
    updateFile,
    createFile,
    createFolder,
    renameFile,
    deleteFile,
    deleteFolder,
    moveFile,
    copyFile,
    pasteFile,
    emptyRecycleBin,
    restoreFromRecycleBin,
  };
};
