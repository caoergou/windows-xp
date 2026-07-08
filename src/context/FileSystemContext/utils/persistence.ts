/* eslint-disable @typescript-eslint/no-explicit-any */
import { FileNode, isContainerNode, isFileContentNode } from '../../../types';
import {
  saveFileContent,
  getFileContent,
  saveMetadata,
  getMetadata,
  saveRecycleBin,
  getRecycleBin,
} from '../../../utils/storage';
import type { FileMetadata, RecycleBinItem } from '../../../utils/storage';

export const loadPersistedFileSystem = async (
  defaultFileSystem: { root: FileNode }
): Promise<{ root: FileNode; recycleBinRef: Record<string, RecycleBinItem> }> => {
  const metadata = getMetadata();
  const savedRecycleBin = getRecycleBin();

  // Start with a fresh clone of the default filesystem
  const mergedFs: { root: FileNode } = JSON.parse(JSON.stringify(defaultFileSystem));

  if (metadata?.files) {
    for (const [pathKey, fileMeta] of Object.entries(metadata.files)) {
      const pathParts = pathKey.split('/').filter(Boolean);
      const content = await getFileContent(pathParts);

      if (content !== null) {
        let current: FileNode = mergedFs.root;
        for (let i = 0; i < pathParts.length - 1; i++) {
          const part = pathParts[i];
          if (isContainerNode(current) && current.children?.[part]) {
            current = current.children[part];
          }
        }

        const fileName = pathParts[pathParts.length - 1];
        if (isContainerNode(current)) {
          if (!current.children) {
            current.children = {};
          }
          if (current.children[fileName]) {
            current.children[fileName] = {
              ...current.children[fileName],
              content,
              ...fileMeta,
            } as FileNode;
          } else {
            const newFile = { type: 'file', name: fileName, content } as Record<string, unknown>;
            Object.assign(newFile, fileMeta);
            current.children[fileName] = newFile as unknown as FileNode;
          }
        }
      }
    }
  }

  const recycleBinRef: Record<string, RecycleBinItem> = {};
  const recycleBinNode = (mergedFs.root as any).children?.['回收站'];
  if (recycleBinNode && isContainerNode(recycleBinNode)) {
    if (savedRecycleBin) {
      recycleBinNode.children = {};
      for (const [fileName, binItem] of Object.entries(savedRecycleBin)) {
        recycleBinNode.children[fileName] = binItem.item as FileNode;
      }
      Object.assign(recycleBinRef, savedRecycleBin);
    }
  }

  return { root: mergedFs.root, recycleBinRef };
};

export const persistFs = async (
  newFs: { root: FileNode },
  isLoaded: boolean
): Promise<void> => {
  if (!isLoaded) return;

  try {
    const metadata: Record<string, unknown> = {};

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
          modifiedAt: Date.now(),
        } as Record<string, unknown>;
      }

      if (isContainerNode(node) && node.children) {
        for (const [key, child] of Object.entries(node.children)) {
          await walkTree(child, [...path, key]);
        }
      }
    };

    await walkTree(newFs.root, []);
    saveMetadata({
      files: metadata as Record<string, FileMetadata>,
      version: 1,
      lastModified: Date.now(),
    });
  } catch (e) {
    console.error('Failed to persist filesystem:', e);
  }
};

export { saveRecycleBin, getRecycleBin };
export type { RecycleBinItem };
