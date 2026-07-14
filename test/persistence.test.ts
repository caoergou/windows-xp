// fake-indexeddb/auto must be imported BEFORE storage.ts so that the
// module-level `indexedDB` capture in storage.ts sees the fake factory.
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  setStoragePrefix,
  getStoragePrefix,
  getStorageKey,
  saveFileContent,
  getFileContent,
  deleteFileContent,
  saveMetadata,
  getMetadata,
  saveRecycleBin,
  getRecycleBin,
  clearAllStorage,
  getDefaultStorage,
} from '../src/utils/storage';
import type { FileMetadata, RecycleBinItem } from '../src/utils/storage';
import {
  loadPersistedFileSystem,
  persistFs,
} from '../src/context/FileSystemContext/utils/persistence';
import type { FileNode, FolderNode, FileContentNode } from '../src/types';
import { isContainerNode, isFileContentNode } from '../src/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeFile = (name: string, content?: string): FileContentNode => ({
  type: 'file',
  name,
  content,
  app: 'Notepad',
});

const makeDefaultFs = (): { root: FileNode } => ({
  root: {
    type: 'folder',
    name: 'root',
    children: {
      回收站: { type: 'folder', name: '回收站', icon: 'recycle_bin', children: {} },
      docs: {
        type: 'folder',
        name: 'docs',
        children: {
          'readme.txt': makeFile('readme.txt', 'default readme'),
        },
      } as FolderNode,
    },
  } as FolderNode,
});

const getNode = (fs: { root: FileNode }, path: string[]): FileNode | null => {
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

const sampleMetadata = (pathKey: string, name: string): Record<string, FileMetadata> => ({
  [pathKey]: {
    path: pathKey.split('/'),
    name,
    type: 'file',
    app: 'Notepad',
    modifiedAt: Date.now(),
  },
});

// Each test gets its own storage prefix, which isolates both the IndexedDB
// database name and the localStorage keys without needing to rebuild the
// fake IndexedDB factory (storage.ts captures the factory at module load).
let prefixCounter = 0;

beforeEach(() => {
  localStorage.clear();
  setStoragePrefix(`ptest${++prefixCounter}`);
});

// ---------------------------------------------------------------------------
// storage.ts — file content in IndexedDB
// ---------------------------------------------------------------------------

describe('storage.ts: IndexedDB file content', () => {
  it('roundtrips saveFileContent -> getFileContent', async () => {
    await saveFileContent(['docs', 'readme.txt'], 'hello world');
    await expect(getFileContent(['docs', 'readme.txt'])).resolves.toBe('hello world');
  });

  it('returns null for content that was never saved', async () => {
    await expect(getFileContent(['nope', 'missing.txt'])).resolves.toBeNull();
  });

  it('overwrites existing content on re-save (put semantics)', async () => {
    await saveFileContent(['a.txt'], 'v1');
    await saveFileContent(['a.txt'], 'v2');
    await expect(getFileContent(['a.txt'])).resolves.toBe('v2');
  });

  it('deleteFileContent removes stored content', async () => {
    await saveFileContent(['gone.txt'], 'bye');
    await deleteFileContent(['gone.txt']);
    await expect(getFileContent(['gone.txt'])).resolves.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// storage.ts — metadata / recycle bin in localStorage
// ---------------------------------------------------------------------------

describe('storage.ts: localStorage metadata and recycle bin', () => {
  it('roundtrips saveMetadata -> getMetadata via the prefixed localStorage key', () => {
    const metadata = {
      files: sampleMetadata('docs/readme.txt', 'readme.txt'),
      version: 1,
      lastModified: Date.now(),
    };
    saveMetadata(metadata);

    const raw = localStorage.getItem(`${getStoragePrefix()}fs_metadata`);
    expect(raw).not.toBeNull();
    expect(getMetadata()).toEqual(metadata);
  });

  it('getMetadata returns null when absent or corrupt', () => {
    expect(getMetadata()).toBeNull();
    localStorage.setItem(getStorageKey('fs_metadata'), '{not-valid-json');
    expect(getMetadata()).toBeNull();
  });

  it('roundtrips saveRecycleBin -> getRecycleBin', () => {
    const items: Record<string, RecycleBinItem> = {
      'old.txt': {
        item: makeFile('old.txt', 'trashed'),
        originalPath: ['docs'],
        deletedAt: 123456,
      },
    };
    saveRecycleBin(items);
    expect(localStorage.getItem(`${getStoragePrefix()}fs_recycle_bin`)).not.toBeNull();
    expect(getRecycleBin()).toEqual(items);
  });

  it('keeps content in IndexedDB only and metadata in localStorage only', async () => {
    await saveFileContent(['secret.txt'], 'SECRET_CONTENT_MARKER');
    saveMetadata({
      files: sampleMetadata('secret.txt', 'secret.txt'),
      version: 1,
      lastModified: Date.now(),
    });

    // The file body must never leak into localStorage...
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i) as string;
      expect(localStorage.getItem(key)).not.toContain('SECRET_CONTENT_MARKER');
    }
    // ...while metadata lives in localStorage and content in IndexedDB.
    expect(getMetadata()?.files['secret.txt']?.name).toBe('secret.txt');
    await expect(getFileContent(['secret.txt'])).resolves.toBe('SECRET_CONTENT_MARKER');
  });
});

// ---------------------------------------------------------------------------
// storagePrefix isolation
// ---------------------------------------------------------------------------

describe('storage.ts: storagePrefix', () => {
  it('normalizes the prefix with a trailing underscore and drives getStorageKey', () => {
    setStoragePrefix('myapp');
    expect(getStoragePrefix()).toBe('myapp_');
    expect(getStorageKey('fs_metadata')).toBe('myapp_fs_metadata');

    setStoragePrefix('other_');
    expect(getStoragePrefix()).toBe('other_');
  });

  it('isolates IndexedDB database and localStorage keys per prefix', async () => {
    setStoragePrefix('tenant_a');
    await saveFileContent(['file.txt'], 'content of A');
    saveMetadata({
      files: sampleMetadata('file.txt', 'file.txt'),
      version: 1,
      lastModified: Date.now(),
    });

    setStoragePrefix('tenant_b');
    // Different DB name and different localStorage key => nothing visible.
    await expect(getFileContent(['file.txt'])).resolves.toBeNull();
    expect(getMetadata()).toBeNull();
    await saveFileContent(['file.txt'], 'content of B');

    setStoragePrefix('tenant_a');
    await expect(getFileContent(['file.txt'])).resolves.toBe('content of A');
    expect(getMetadata()?.files['file.txt']).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// persistence.ts — persistFs / loadPersistedFileSystem
// ---------------------------------------------------------------------------

describe('persistence.ts: persistFs and loadPersistedFileSystem', () => {
  it('persistFs is a no-op before the initial load completes (isLoaded=false)', async () => {
    await persistFs(getDefaultStorage(), makeDefaultFs(), false);
    expect(getMetadata()).toBeNull();
    await expect(getFileContent(['docs', 'readme.txt'])).resolves.toBeNull();
  });

  it('merges persisted edits back into the default tree on load', async () => {
    const fs = makeDefaultFs();
    const readme = getNode(fs, ['docs', 'readme.txt']);
    if (!readme || !isFileContentNode(readme)) throw new Error('expected file node');
    readme.content = 'edited by user';

    await persistFs(getDefaultStorage(), fs, true);
    const { root } = await loadPersistedFileSystem(getDefaultStorage(), makeDefaultFs());

    const merged = getNode({ root }, ['docs', 'readme.txt']);
    if (!merged || !isFileContentNode(merged)) throw new Error('expected file node');
    expect(merged.content).toBe('edited by user');
  });

  it('recreates user-created files (absent from defaults) with their metadata', async () => {
    const fs = makeDefaultFs();
    if (!isContainerNode(fs.root)) throw new Error('expected container root');
    fs.root.children['notes.txt'] = makeFile('notes.txt', 'my notes');

    await persistFs(getDefaultStorage(), fs, true);
    const { root } = await loadPersistedFileSystem(getDefaultStorage(), makeDefaultFs());

    const restored = getNode({ root }, ['notes.txt']);
    if (!restored || !isFileContentNode(restored)) throw new Error('expected file node');
    expect(restored.content).toBe('my notes');
    expect(restored.app).toBe('Notepad');
    // Metadata went to localStorage, content to IndexedDB.
    expect(getMetadata()?.files['notes.txt']).toBeDefined();
    await expect(getFileContent(['notes.txt'])).resolves.toBe('my notes');
  });

  it('replaces recycle bin children from the saved recycle bin and returns its ref', async () => {
    const binItems: Record<string, RecycleBinItem> = {
      'trashed.txt': {
        item: makeFile('trashed.txt', 'in the bin'),
        originalPath: ['docs'],
        deletedAt: 42,
      },
    };
    saveRecycleBin(binItems);

    const { root, recycleBinRef } = await loadPersistedFileSystem(
      getDefaultStorage(),
      makeDefaultFs()
    );
    const bin = getNode({ root }, ['回收站']);
    if (!bin || !isContainerNode(bin)) throw new Error('expected recycle bin folder');
    expect(Object.keys(bin.children)).toEqual(['trashed.txt']);
    expect(recycleBinRef['trashed.txt']?.originalPath).toEqual(['docs']);
  });

  it('leaves default recycle bin contents alone when nothing was persisted', async () => {
    const defaults = makeDefaultFs();
    const defaultBin = getNode(defaults, ['回收站']);
    if (!defaultBin || !isContainerNode(defaultBin)) throw new Error('expected folder');
    defaultBin.children['preset.txt'] = makeFile('preset.txt', 'preset');

    const { root, recycleBinRef } = await loadPersistedFileSystem(getDefaultStorage(), defaults);
    expect(getNode({ root }, ['回收站', 'preset.txt'])).not.toBeNull();
    expect(recycleBinRef).toEqual({});
  });

  it('clearAllStorage wipes metadata, recycle bin and file contents', async () => {
    await saveFileContent(['wipe.txt'], 'wipe me');
    saveMetadata({
      files: sampleMetadata('wipe.txt', 'wipe.txt'),
      version: 1,
      lastModified: Date.now(),
    });
    saveRecycleBin({
      'wipe.txt': { item: makeFile('wipe.txt'), originalPath: [], deletedAt: 1 },
    });

    await clearAllStorage();

    expect(getMetadata()).toBeNull();
    expect(getRecycleBin()).toBeNull();
    await expect(getFileContent(['wipe.txt'])).resolves.toBeNull();
  });

  it('#81 fixed: 用户新建的空文件夹与嵌套文件在刷新后完整保留', async () => {
    const defaultFs = {
      root: {
        type: 'folder',
        name: 'root',
        children: {},
      } as unknown as FileNode,
    };
    // User creates 我的项目/笔记.txt (folder + nested file)
    const currentFs = {
      root: {
        type: 'folder',
        name: 'root',
        children: {
          我的项目: {
            type: 'folder',
            name: '我的项目',
            children: {
              '笔记.txt': { type: 'file', name: '笔记.txt', content: 'hello' },
            },
          },
          空文件夹: { type: 'folder', name: '空文件夹', children: {} },
        },
      } as unknown as FileNode,
    };

    await persistFs(getDefaultStorage(), currentFs, true, { defaultFs });
    const { root } = await loadPersistedFileSystem(getDefaultStorage(), defaultFs);

    const folder = isContainerNode(root) ? root.children['我的项目'] : undefined;
    if (!folder) throw new Error('user folder was not restored');
    expect(folder.type).toBe('folder');
    const nested = isContainerNode(folder) ? folder.children?.['笔记.txt'] : undefined;
    if (!nested) throw new Error('nested file was not restored');
    expect(isFileContentNode(nested) ? nested.content : null).toBe('hello');
    // The nested file must live under its folder, NOT relocate to root (#81).
    expect(isContainerNode(root) ? root.children['笔记.txt'] : null).toBeFalsy();

    const empty = isContainerNode(root) ? root.children['空文件夹'] : undefined;
    if (!empty) throw new Error('empty folder was not restored');
    expect(empty.type).toBe('folder');
  });

  it('#81 fixed: 持久化条目的父目录缺失时被跳过而不是挂到根目录', async () => {
    const defaultFs = {
      root: { type: 'folder', name: 'root', children: {} } as unknown as FileNode,
    };
    // Simulate stale metadata pointing into a folder that no longer exists,
    // without folder metadata for it (legacy v1 data shape).
    await saveFileContent(['ghost-dir', 'orphan.txt'], 'orphan');
    saveMetadata({
      files: {
        'ghost-dir/orphan.txt': {
          path: ['ghost-dir', 'orphan.txt'],
          name: 'orphan.txt',
          type: 'file',
          modifiedAt: Date.now(),
        } as FileMetadata,
      },
      version: 2,
      lastModified: Date.now(),
    });

    const { root } = await loadPersistedFileSystem(getDefaultStorage(), defaultFs);
    // Neither attached at root nor anywhere else.
    expect(isContainerNode(root) ? root.children['orphan.txt'] : null).toBeFalsy();
    expect(isContainerNode(root) ? root.children['ghost-dir'] : null).toBeFalsy();
  });

  it('#81 fixed: 删除内置文件会记录 tombstone，刷新后不再复活', async () => {
    const defaultFs = {
      root: {
        type: 'folder',
        name: 'root',
        children: {
          'builtin.txt': { type: 'file', name: 'builtin.txt', content: 'factory' },
          docs: {
            type: 'folder',
            name: 'docs',
            children: {
              'manual.txt': { type: 'file', name: 'manual.txt', content: 'rtfm' },
            },
          },
        },
      } as unknown as FileNode,
    };
    // User deleted builtin.txt and docs/manual.txt
    const currentFs = {
      root: {
        type: 'folder',
        name: 'root',
        children: {
          docs: { type: 'folder', name: 'docs', children: {} },
        },
      } as unknown as FileNode,
    };

    await persistFs(getDefaultStorage(), currentFs, true, { defaultFs });
    const { root } = await loadPersistedFileSystem(getDefaultStorage(), defaultFs);

    expect(isContainerNode(root) ? root.children['builtin.txt'] : null).toBeFalsy();
    const docs = isContainerNode(root) ? root.children['docs'] : undefined;
    if (!docs) throw new Error('docs folder missing');
    expect(isContainerNode(docs) ? docs.children?.['manual.txt'] : null).toBeFalsy();
  });
});
