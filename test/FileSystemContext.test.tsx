import { renderHook, act } from '@testing-library/react';
import { expect, test, describe } from 'vitest';
import { FileSystemProvider, useFileSystem } from '../src/context/FileSystemContext';
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
      result.current.createFile([], 'test.txt', {
        type: 'file',
        name: 'test.txt',
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
      result.current.createFile([], 'update-test.txt', {
        type: 'file',
        name: 'update-test.txt',
        content: 'Original content',
      });
    });

    act(() => {
      result.current.updateFile(['update-test.txt'], { content: 'Updated content' });
    });

    const file = result.current.getFile(['update-test.txt']);
    expect(file).toBeDefined();
    expect((file as any).content).toBe('Updated content');
  });

  test('can delete a file', () => {
    const { result } = renderHook(() => useFileSystem(), { wrapper });

    act(() => {
      result.current.createFile([], 'delete-test.txt', {
        type: 'file',
        name: 'delete-test.txt',
        content: 'To be deleted',
      });
    });

    expect(result.current.fs.root.children['delete-test.txt']).toBeDefined();

    act(() => {
      result.current.deleteFile([], 'delete-test.txt');
    });

    expect(result.current.fs.root.children['delete-test.txt']).toBeUndefined();
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
    expect(result.current.fs.root.children['dest-folder']?.children?.['copy-source.txt']).toBeDefined();

    const sourceFile = result.current.getFile(['copy-source.txt']);
    const pastedFile = result.current.getFile(['dest-folder', 'copy-source.txt']);
    expect((sourceFile as any).content).toBe('Copy me');
    expect((pastedFile as any).content).toBe('Copy me');
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
    expect(result.current.fs.root.children['cut-dest-folder']?.children?.['cut-source.txt']).toBeDefined();

    const movedFile = result.current.getFile(['cut-dest-folder', 'cut-source.txt']);
    expect((movedFile as any).content).toBe('Move me');
    expect(result.current.clipboard).toBeNull();
  });
});
