import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { FileSystemProvider, useFileSystem } from '../src/context/FileSystemContext';
import { isFileContentNode } from '../src/types';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <FileSystemProvider>{children}</FileSystemProvider>
);

// FileSystemProvider asynchronously loads the persisted layer on mount;
// flushing microtasks inside act() lets that load settle before assertions.
const setup = async () => {
  const utils = renderHook(() => useFileSystem(), { wrapper });
  await act(async () => {
    await Promise.resolve();
  });
  return utils;
};

beforeEach(() => {
  localStorage.clear();
});

// ---------------------------------------------------------------------------
// Recycle bin
// ---------------------------------------------------------------------------

describe('recycle bin', () => {
  it('deleteFile soft-deletes: item moves into 回收站 and leaves its parent', async () => {
    const { result } = await setup();

    act(() => {
      result.current.createFile([], 'trash-me.txt', 'file', { content: 'keep my content' });
    });
    expect(result.current.getFile(['trash-me.txt'])).not.toBeNull();

    act(() => {
      result.current.deleteFile([], 'trash-me.txt');
    });

    expect(result.current.getFile(['trash-me.txt'])).toBeNull();
    const binned = result.current.getFile(['回收站', 'trash-me.txt']);
    expect(binned).not.toBeNull();
    if (!binned || !isFileContentNode(binned)) throw new Error('expected file node');
    expect(binned.content).toBe('keep my content');
  });

  it('persists the recycle bin snapshot to localStorage on delete', async () => {
    const { result } = await setup();

    act(() => {
      result.current.createFile([], 'persist-me.txt', 'file', { content: 'x' });
    });
    act(() => {
      result.current.deleteFile([], 'persist-me.txt');
    });

    const raw = localStorage.getItem('xp_fs_recycle_bin');
    expect(raw).not.toBeNull();
    const saved = JSON.parse(raw as string);
    expect(saved['persist-me.txt']).toBeDefined();
    expect(saved['persist-me.txt'].originalPath).toEqual([]);
  });

  it('restoreFromRecycleBin returns the item to its original (nested) path', async () => {
    const { result } = await setup();

    act(() => {
      result.current.createFolder([], 'work');
    });
    act(() => {
      result.current.createFile(['work'], 'report.txt', 'file', { content: 'Q3 report' });
    });
    act(() => {
      result.current.deleteFile(['work'], 'report.txt');
    });

    expect(result.current.getFile(['work', 'report.txt'])).toBeNull();
    expect(result.current.getFile(['回收站', 'report.txt'])).not.toBeNull();

    act(() => {
      result.current.restoreFromRecycleBin('report.txt');
    });

    expect(result.current.getFile(['回收站', 'report.txt'])).toBeNull();
    const restored = result.current.getFile(['work', 'report.txt']);
    expect(restored).not.toBeNull();
    if (!restored || !isFileContentNode(restored)) throw new Error('expected file node');
    expect(restored.content).toBe('Q3 report');
  });

  it('emptyRecycleBin clears all items and restore becomes a no-op', async () => {
    const { result } = await setup();

    act(() => {
      result.current.createFile([], 'doomed.txt', 'file', { content: 'gone forever' });
    });
    act(() => {
      result.current.deleteFile([], 'doomed.txt');
    });

    const binBefore = result.current.getFile(['回收站']);
    expect(Object.keys(binBefore?.children || {}).length).toBeGreaterThan(0);

    act(() => {
      result.current.emptyRecycleBin();
    });

    expect(Object.keys(result.current.getFile(['回收站'])?.children || {})).toHaveLength(0);
    expect(JSON.parse(localStorage.getItem('xp_fs_recycle_bin') as string)).toEqual({});

    act(() => {
      result.current.restoreFromRecycleBin('doomed.txt');
    });
    expect(result.current.getFile(['doomed.txt'])).toBeNull();
  });

  it('#81 fixed: 回收站同名文件各自保留，并还原到各自的原路径', () => {
    const { result } = renderHook(() => useFileSystem(), { wrapper });

    act(() => {
      result.current.createFile([], 'dirA', 'folder');
      result.current.createFile([], 'dirB', 'folder');
    });
    act(() => {
      result.current.createFile(['dirA'], 'f.txt', 'file', { content: 'from A' });
      result.current.createFile(['dirB'], 'f.txt', 'file', { content: 'from B' });
    });
    act(() => {
      result.current.deleteFile(['dirA'], 'f.txt');
    });
    act(() => {
      result.current.deleteFile(['dirB'], 'f.txt');
    });

    // Both entries live in the bin under distinct keys.
    const bin = result.current.getFile(['回收站']);
    const binChildren = bin && 'children' in bin ? (bin.children as Record<string, unknown>) : {};
    const keys = Object.keys(binChildren).filter(k => k.startsWith('f.txt'));
    expect(keys).toHaveLength(2);

    // Restore both; each returns to its own folder.
    act(() => {
      keys.forEach(key => result.current.restoreFromRecycleBin(key));
    });
    const restoredA = result.current.getFile(['dirA', 'f.txt']);
    const restoredB = result.current.getFile(['dirB', 'f.txt']);
    expect(restoredA).toBeDefined();
    expect(restoredB).toBeDefined();
    expect((restoredA as { content?: string })?.content).toBe('from A');
    expect((restoredB as { content?: string })?.content).toBe('from B');
  });

  it('#81 fixed: 粘贴到不存在的目标返回 false 且不清空剪切板', () => {
    const { result } = renderHook(() => useFileSystem(), { wrapper });

    act(() => {
      result.current.createFile([], 'victim.txt', 'file', { content: 'precious' });
    });
    act(() => {
      result.current.cutFile([], 'victim.txt');
    });

    let pasted: boolean | undefined;
    act(() => {
      pasted = result.current.pasteFile(['no-such-folder']);
    });
    expect(pasted).toBe(false);
    // File untouched, clipboard retained for a valid retry.
    expect(result.current.getFile(['victim.txt'])).not.toBeNull();
    expect(result.current.clipboard).not.toBeNull();

    // A valid paste afterwards still works.
    act(() => {
      result.current.createFile([], 'target', 'folder');
    });
    act(() => {
      pasted = result.current.pasteFile(['target']);
    });
    expect(pasted).toBe(true);
    expect(result.current.getFile(['target', 'victim.txt'])).not.toBeNull();
    expect(result.current.getFile(['victim.txt'])).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Clipboard: copy / cut / paste
// ---------------------------------------------------------------------------

describe('clipboard', () => {
  it('copy then paste keeps the source and creates a copy at the destination', async () => {
    const { result } = await setup();

    act(() => {
      result.current.createFile([], 'source.txt', 'file', { content: 'copy me' });
    });
    act(() => {
      result.current.createFolder([], 'dest');
    });
    act(() => {
      result.current.copyToClipboard([], 'source.txt');
    });

    expect(result.current.clipboard).toEqual({
      type: 'copy',
      sourcePath: [],
      fileName: 'source.txt',
    });

    let pasted = false;
    act(() => {
      pasted = result.current.pasteFile(['dest']);
    });
    expect(pasted).toBe(true);

    const original = result.current.getFile(['source.txt']);
    const copy = result.current.getFile(['dest', 'source.txt']);
    if (!original || !copy || !isFileContentNode(original) || !isFileContentNode(copy)) {
      throw new Error('expected file nodes');
    }
    expect(original.content).toBe('copy me');
    expect(copy.content).toBe('copy me');
    // A copy clipboard survives paste so it can be pasted again.
    expect(result.current.clipboard).not.toBeNull();
  });

  it('cut then paste moves the file and clears the clipboard', async () => {
    const { result } = await setup();

    act(() => {
      result.current.createFile([], 'moving.txt', 'file', { content: 'move me' });
    });
    act(() => {
      result.current.createFolder([], 'cut-dest');
    });
    act(() => {
      result.current.cutFile([], 'moving.txt');
    });

    expect(result.current.clipboard?.type).toBe('cut');

    act(() => {
      result.current.pasteFile(['cut-dest']);
    });

    expect(result.current.getFile(['moving.txt'])).toBeNull();
    const moved = result.current.getFile(['cut-dest', 'moving.txt']);
    if (!moved || !isFileContentNode(moved)) throw new Error('expected file node');
    expect(moved.content).toBe('move me');
    expect(result.current.clipboard).toBeNull();
  });

  it('supports multi-select copy and paste via a filename array', async () => {
    const { result } = await setup();

    act(() => {
      result.current.createFile([], 'multi-a.txt', 'file', { content: 'A' });
    });
    act(() => {
      result.current.createFile([], 'multi-b.txt', 'file', { content: 'B' });
    });
    act(() => {
      result.current.createFolder([], 'multi-dest');
    });
    act(() => {
      result.current.copyToClipboard([], ['multi-a.txt', 'multi-b.txt']);
    });

    expect(result.current.clipboard?.fileName).toBe('multi-a.txt');
    expect(result.current.clipboard?.fileNames).toEqual(['multi-a.txt', 'multi-b.txt']);

    act(() => {
      result.current.pasteFile(['multi-dest']);
    });

    // Both copies exist; both sources are retained.
    expect(result.current.getFile(['multi-dest', 'multi-a.txt'])).not.toBeNull();
    expect(result.current.getFile(['multi-dest', 'multi-b.txt'])).not.toBeNull();
    expect(result.current.getFile(['multi-a.txt'])).not.toBeNull();
    expect(result.current.getFile(['multi-b.txt'])).not.toBeNull();
  });

  it('supports multi-select cut and paste via a filename array', async () => {
    const { result } = await setup();

    act(() => {
      result.current.createFile([], 'cut-a.txt', 'file', { content: 'A' });
    });
    act(() => {
      result.current.createFile([], 'cut-b.txt', 'file', { content: 'B' });
    });
    act(() => {
      result.current.createFolder([], 'cut-multi-dest');
    });
    act(() => {
      result.current.cutFile([], ['cut-a.txt', 'cut-b.txt']);
    });

    act(() => {
      result.current.pasteFile(['cut-multi-dest']);
    });

    expect(result.current.getFile(['cut-multi-dest', 'cut-a.txt'])).not.toBeNull();
    expect(result.current.getFile(['cut-multi-dest', 'cut-b.txt'])).not.toBeNull();
    expect(result.current.getFile(['cut-a.txt'])).toBeNull();
    expect(result.current.getFile(['cut-b.txt'])).toBeNull();
    expect(result.current.clipboard).toBeNull();
  });

  it('pastes across sibling directories (dirA -> dirB)', async () => {
    const { result } = await setup();

    act(() => {
      result.current.createFolder([], 'dirA');
    });
    act(() => {
      result.current.createFolder([], 'dirB');
    });
    act(() => {
      result.current.createFile(['dirA'], 'cross.txt', 'file', { content: 'across' });
    });
    act(() => {
      result.current.cutFile(['dirA'], 'cross.txt');
    });
    act(() => {
      result.current.pasteFile(['dirB']);
    });

    expect(result.current.getFile(['dirA', 'cross.txt'])).toBeNull();
    const landed = result.current.getFile(['dirB', 'cross.txt']);
    if (!landed || !isFileContentNode(landed)) throw new Error('expected file node');
    expect(landed.content).toBe('across');
  });

  it('pasteFile returns false when the clipboard is empty', async () => {
    const { result } = await setup();

    let pasted = true;
    act(() => {
      pasted = result.current.pasteFile([]);
    });
    expect(pasted).toBe(false);
  });
});
