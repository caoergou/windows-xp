import { FileNode, isContainerNode, isFileContentNode } from '../../../types';
import type { FileMetadata, RecycleBinItem, Storage } from '../../../utils/storage';

const RECYCLE_BIN_KEY = '回收站';

const getChild = (node: FileNode, key: string): FileNode | null =>
  isContainerNode(node) && node.children ? (node.children[key] ?? null) : null;

const walkToParent = (root: FileNode, pathParts: string[]): FileNode | null => {
  let current: FileNode = root;
  for (let i = 0; i < pathParts.length - 1; i++) {
    const next = getChild(current, pathParts[i]);
    // Strict: a missing segment means the entry cannot be re-attached. The old
    // implementation silently continued and re-parented files onto the nearest
    // existing ancestor, relocating them to the root after a refresh (#81).
    if (!next) return null;
    current = next;
  }
  return current;
};

const nodeMetadata = (node: FileNode, pathParts: string[]): FileMetadata => {
  // Not every FileNode variant declares these optional fields; read loosely.
  const loose = node as FileNode & {
    locked?: boolean;
    password?: string;
    broken?: boolean;
    hint?: string;
    app?: string;
    readOnly?: boolean;
    description?: string;
  };
  return {
    path: pathParts,
    name: node.name,
    type: node.type,
    icon: node.icon,
    locked: loose.locked,
    password: loose.password,
    broken: loose.broken,
    hint: loose.hint,
    app: loose.app,
    readOnly: loose.readOnly,
    description: loose.description,
    modifiedAt: Date.now(),
  } as FileMetadata;
};

/**
 * Load the user's persisted world on top of the default filesystem.
 *
 * Order matters: clone defaults -> apply deletion tombstones -> re-create
 * user nodes shallow-first (folders before their files) -> hydrate file
 * contents from IndexedDB -> restore the recycle bin.
 */
export const loadPersistedFileSystem = async (
  storage: Storage,
  defaultFileSystem: { root: FileNode }
): Promise<{ root: FileNode; recycleBinRef: Record<string, RecycleBinItem> }> => {
  const metadata = storage.getMetadata();
  const savedRecycleBin = storage.getRecycleBin();

  const mergedFs: { root: FileNode } = JSON.parse(JSON.stringify(defaultFileSystem));

  // 1. Deletion tombstones: built-in nodes the user removed stay removed (#81).
  for (const pathKey of metadata?.deleted ?? []) {
    const pathParts = pathKey.split('/').filter(Boolean);
    if (pathParts.length === 0 || pathParts[0] === RECYCLE_BIN_KEY) continue;
    const parent = walkToParent(mergedFs.root, pathParts);
    const name = pathParts[pathParts.length - 1];
    if (parent && isContainerNode(parent) && parent.children?.[name]) {
      delete parent.children[name];
    }
  }

  // 2. User nodes, shallow-first so parent folders exist before their children.
  const entries = Object.entries(metadata?.files ?? {}).sort(
    ([a], [b]) => a.split('/').length - b.split('/').length
  );

  for (const [pathKey, fileMeta] of entries) {
    const pathParts = pathKey.split('/').filter(Boolean);
    if (pathParts.length === 0 || pathParts[0] === RECYCLE_BIN_KEY) continue;

    const parent = walkToParent(mergedFs.root, pathParts);
    if (!parent || !isContainerNode(parent)) {
      console.warn(
        `[windows-xp] Skipping persisted node "${pathKey}": parent folder no longer exists.`
      );
      continue;
    }
    if (!parent.children) parent.children = {};

    const fileName = pathParts[pathParts.length - 1];
    const isFolder = fileMeta.type === 'folder';
    const content = isFolder ? null : await storage.getFileContent(pathParts);

    const {
      path: _path,
      modifiedAt: _modifiedAt,
      ...restMeta
    } = fileMeta as FileMetadata & Record<string, unknown>;
    void _path;
    void _modifiedAt;
    const existing = parent.children[fileName];
    if (existing) {
      parent.children[fileName] = {
        ...existing,
        ...restMeta,
        ...(content !== null ? { content } : {}),
      } as unknown as FileNode;
    } else {
      const restored: Record<string, unknown> = { ...restMeta };
      restored.name = fileMeta.name ?? fileName;
      if (isFolder) {
        restored.type = 'folder';
        restored.children = {};
      } else {
        restored.type = fileMeta.type ?? 'file';
        if (content !== null) restored.content = content;
      }
      parent.children[fileName] = restored as unknown as FileNode;
    }
  }

  // 3. Recycle bin state.
  const recycleBinRef: Record<string, RecycleBinItem> = {};
  const recycleBinNode = getChild(mergedFs.root, RECYCLE_BIN_KEY);
  if (recycleBinNode && isContainerNode(recycleBinNode) && savedRecycleBin) {
    recycleBinNode.children = {};
    for (const [key, binItem] of Object.entries(savedRecycleBin)) {
      recycleBinNode.children[key] = binItem.item as FileNode;
    }
    Object.assign(recycleBinRef, savedRecycleBin);
  }

  return { root: mergedFs.root, recycleBinRef };
};

export interface PersistOptions {
  /**
   * The pristine default filesystem (before user mutations). Used to diff the
   * current tree: nodes missing from the default are persisted as user nodes,
   * default nodes missing from the current tree become deletion tombstones.
   */
  defaultFs?: { root: FileNode };
  /**
   * Content paths touched by the triggering operation. When provided, only
   * these files are written to IndexedDB instead of rewriting every file on
   * every operation (#81). Metadata (cheap, localStorage) is always refreshed.
   */
  dirtyContentPaths?: string[][];
  /** Content paths whose IndexedDB entries should be removed. */
  removedContentPaths?: string[][];
}

const shouldSkipPersist = (node: FileNode): boolean =>
  Boolean((node as { managedByCulture?: boolean }).managedByCulture);

export const persistFs = async (
  storage: Storage,
  newFs: { root: FileNode },
  isLoaded: boolean,
  options: PersistOptions = {}
): Promise<void> => {
  if (!isLoaded) return;

  try {
    const { defaultFs, dirtyContentPaths, removedContentPaths } = options;
    const files: Record<string, FileMetadata> = {};
    const contentWrites: Array<Promise<void>> = [];
    const dirtyKeys = dirtyContentPaths ? new Set(dirtyContentPaths.map(p => p.join('/'))) : null;

    const defaultNodeAt = (pathParts: string[]): FileNode | null => {
      if (!defaultFs) return null;
      let current: FileNode | null = defaultFs.root;
      for (const part of pathParts) {
        current = current ? getChild(current, part) : null;
        if (!current) return null;
      }
      return current;
    };

    const walkTree = (node: FileNode, path: string[]) => {
      if (path.length > 0) {
        const key = path.join('/');
        if (path[0] === RECYCLE_BIN_KEY) return; // recycle bin persists separately
        if (shouldSkipPersist(node)) return;

        const defaultNode = defaultNodeAt(path);
        const isUserNode = defaultFs ? !defaultNode : false;
        const isEditedFile =
          isFileContentNode(node) &&
          node.content !== undefined &&
          (!defaultFs ||
            !defaultNode ||
            !isFileContentNode(defaultNode) ||
            defaultNode.content !== node.content);

        // Persist: user-created nodes (files AND folders, #81) and edited files.
        if (isUserNode || isEditedFile) {
          files[key] = nodeMetadata(node, path);
          if (isFileContentNode(node) && node.content !== undefined) {
            if (!dirtyKeys || dirtyKeys.has(key)) {
              contentWrites.push(storage.saveFileContent(path, node.content));
            }
          }
        }
      }

      if (isContainerNode(node) && node.children) {
        for (const [key, child] of Object.entries(node.children)) {
          walkTree(child, [...path, key]);
        }
      }
    };

    walkTree(newFs.root, []);

    // Tombstones: default nodes that vanished from the current tree (#81).
    const deleted: string[] = [];
    if (defaultFs) {
      const currentNodeAt = (pathParts: string[]): FileNode | null => {
        let current: FileNode | null = newFs.root;
        for (const part of pathParts) {
          current = current ? getChild(current, part) : null;
          if (!current) return null;
        }
        return current;
      };
      const walkDefault = (node: FileNode, path: string[]) => {
        if (path.length > 0) {
          if (path[0] === RECYCLE_BIN_KEY) return;
          if (shouldSkipPersist(node)) return;
          if (!currentNodeAt(path)) {
            deleted.push(path.join('/'));
            return; // children are implicitly gone with their parent
          }
        }
        if (isContainerNode(node) && node.children) {
          for (const [key, child] of Object.entries(node.children)) {
            walkDefault(child, [...path, key]);
          }
        }
      };
      walkDefault(defaultFs.root, []);
    }

    for (const path of removedContentPaths ?? []) {
      contentWrites.push(storage.deleteFileContent(path));
    }

    await Promise.all(contentWrites);
    storage.saveMetadata({
      files,
      deleted,
      version: 2,
      lastModified: Date.now(),
    });
  } catch (e) {
    console.error('Failed to persist filesystem:', e);
  }
};

export type { RecycleBinItem };
