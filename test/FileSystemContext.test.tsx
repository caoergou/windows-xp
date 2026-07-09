import { renderHook, act } from '@testing-library/react';
import { expect, test, describe } from 'vitest';
import { FileSystemProvider, useFileSystem } from '../src/context/FileSystemContext';
import { isFileContentNode } from '../src/types';
import React from 'react';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <FileSystemProvider>{children}</FileSystemProvider>
);

describe('FileSystemContext', () => {
  test('provides file system operations', () => {
    const { result } = renderHook(() => useFileSystem(), { wrapper });

    expect(result.current.fs).toBeDefined();
    expect(result.current.getFile).toBeDefined();
    expect(result.current.createFile).toBeDefined();
    expect(result.current.updateFile).toBeDefined();
    expect(result.current.deleteFile).toBeDefined();
  });

  test('can retrieve file by path', () => {
    const { result } = renderHook(() => useFileSystem(), { wrapper });

    const root = result.current.getFile([]);
    expect(root).toBeDefined();
    expect(root?.type).toBe('folder');
  });

  test('can create a new file', () => {
    const { result } = renderHook(() => useFileSystem(), { wrapper });

    const initialCount = Object.keys(result.current.fs.root.children || {}).length;

    act(() => {
      result.current.createFile([], 'test.txt', 'file', {
        content: 'Hello World',
      });
    });

    const newCount = Object.keys(result.current.fs.root.children || {}).length;
    expect(newCount).toBe(initialCount + 1);
    expect(result.current.fs.root.children['test.txt']).toBeDefined();
  });

  test('can update file properties', () => {
    const { result } = renderHook(() => useFileSystem(), { wrapper });

    act(() => {
      result.current.createFile([], 'update-test.txt', 'file', {
        content: 'Original content',
      });
    });

    act(() => {
      result.current.updateFile(['update-test.txt'], { content: 'Updated content' });
    });

    const file = result.current.getFile(['update-test.txt']);
    expect(file).toBeDefined();
    if (!isFileContentNode(file)) throw new Error('Expected a file node');
    expect(file.content).toBe('Updated content');
  });

  test('can delete a file', () => {
    const { result } = renderHook(() => useFileSystem(), { wrapper });

    act(() => {
      result.current.createFile([], 'delete-test.txt', 'file', {
        content: 'To be deleted',
      });
    });

    expect(result.current.fs.root.children['delete-test.txt']).toBeDefined();

    act(() => {
      result.current.deleteFile([], 'delete-test.txt');
    });

    expect(result.current.fs.root.children['delete-test.txt']).toBeUndefined();
  });

  test('can create a folder', () => {
    const { result } = renderHook(() => useFileSystem(), { wrapper });

    act(() => {
      result.current.createFolder([], 'cmd-folder');
    });

    const folder = result.current.fs.root.children['cmd-folder'];
    expect(folder).toBeDefined();
    expect(folder?.type).toBe('folder');
  });

  test('can delete an empty folder', () => {
    const { result } = renderHook(() => useFileSystem(), { wrapper });

    act(() => {
      result.current.createFolder([], 'empty-folder');
    });

    expect(result.current.fs.root.children['empty-folder']).toBeDefined();

    act(() => {
      result.current.deleteFolder([], 'empty-folder');
    });

    expect(result.current.fs.root.children['empty-folder']).toBeUndefined();
  });

  test('cannot delete a non-empty folder', () => {
    const { result } = renderHook(() => useFileSystem(), { wrapper });

    act(() => {
      result.current.createFolder([], 'parent-folder');
    });

    act(() => {
      result.current.createFile(['parent-folder'], 'child.txt', 'file', {
        content: 'child',
      });
    });

    act(() => {
      result.current.deleteFolder([], 'parent-folder');
    });

    expect(result.current.fs.root.children['parent-folder']).toBeDefined();
  });

  test('can rename a node', () => {
    const { result } = renderHook(() => useFileSystem(), { wrapper });

    act(() => {
      result.current.createFile([], 'rename-me.txt', 'file', {
        content: 'rename me',
      });
    });

    act(() => {
      result.current.renameNode([], 'rename-me.txt', 'renamed.txt');
    });

    expect(result.current.fs.root.children['rename-me.txt']).toBeUndefined();
    expect(result.current.fs.root.children['renamed.txt']).toBeDefined();
  });

  test('can copy and paste a file', () => {
    const { result } = renderHook(() => useFileSystem(), { wrapper });

    act(() => {
      result.current.createFile([], 'copy-source.txt', 'file', {
        content: 'Copy me',
      });
    });

    act(() => {
      result.current.createFile([], 'dest-folder', 'folder');
    });

    act(() => {
      result.current.copyToClipboard([], 'copy-source.txt');
    });

    expect(result.current.clipboard).toEqual({
      type: 'copy',
      sourcePath: [],
      fileName: 'copy-source.txt',
    });

    act(() => {
      result.current.pasteFile(['dest-folder']);
    });

    expect(result.current.fs.root.children['copy-source.txt']).toBeDefined();
    expect(
      result.current.fs.root.children['dest-folder']?.children?.['copy-source.txt']
    ).toBeDefined();

    const sourceFile = result.current.getFile(['copy-source.txt']);
    const pastedFile = result.current.getFile(['dest-folder', 'copy-source.txt']);
    if (!isFileContentNode(sourceFile)) throw new Error('Expected a file node');
    if (!isFileContentNode(pastedFile)) throw new Error('Expected a file node');
    expect(sourceFile.content).toBe('Copy me');
    expect(pastedFile.content).toBe('Copy me');
  });

  test('can cut and paste a file', () => {
    const { result } = renderHook(() => useFileSystem(), { wrapper });

    act(() => {
      result.current.createFile([], 'cut-source.txt', 'file', {
        content: 'Move me',
      });
    });

    act(() => {
      result.current.createFile([], 'cut-dest-folder', 'folder');
    });

    act(() => {
      result.current.cutFile([], 'cut-source.txt');
    });

    expect(result.current.clipboard).toEqual({
      type: 'cut',
      sourcePath: [],
      fileName: 'cut-source.txt',
    });

    act(() => {
      result.current.pasteFile(['cut-dest-folder']);
    });

    expect(result.current.fs.root.children['cut-source.txt']).toBeUndefined();
    expect(
      result.current.fs.root.children['cut-dest-folder']?.children?.['cut-source.txt']
    ).toBeDefined();

    const movedFile = result.current.getFile(['cut-dest-folder', 'cut-source.txt']);
    if (!isFileContentNode(movedFile)) throw new Error('Expected a file node');
    expect(movedFile.content).toBe('Move me');
    expect(result.current.clipboard).toBeNull();
  });

  test('recycle bin contains preset items', () => {
    const { result } = renderHook(() => useFileSystem(), { wrapper });

    const recycleBin = result.current.getFile(['回收站']);
    expect(recycleBin).toBeDefined();
    expect(recycleBin?.type).toBe('folder');

    const presetNames = ['旧照片.jpg', '写给未来的信.txt', '下载未完成.url', '临时文档.txt'];
    for (const name of presetNames) {
      expect(result.current.getFile(['回收站', name])).toBeDefined();
    }
  });

  test('can restore a preset recycle bin item to its original path', () => {
    const { result } = renderHook(() => useFileSystem(), { wrapper });

    expect(result.current.getFile(['回收站', '临时文档.txt'])).toBeDefined();
    expect(result.current.getFile(['我的文档', '临时文档.txt'])).toBeNull();

    act(() => {
      result.current.restoreFromRecycleBin('临时文档.txt');
    });

    expect(result.current.getFile(['回收站', '临时文档.txt'])).toBeNull();
    const restored = result.current.getFile(['我的文档', '临时文档.txt']);
    expect(restored).toBeDefined();
    if (!isFileContentNode(restored)) throw new Error('Expected a file node');
    expect(restored.name).toBe('临时文档.txt');
  });

  test('can empty the recycle bin', () => {
    const { result } = renderHook(() => useFileSystem(), { wrapper });

    const recycleBin = result.current.getFile(['回收站']);
    expect(recycleBin).toBeDefined();
    expect(Object.keys(recycleBin?.children || {}).length).toBeGreaterThan(0);

    act(() => {
      result.current.emptyRecycleBin();
    });

    expect(Object.keys(result.current.getFile(['回收站'])?.children || {}).length).toBe(0);
  });
});
