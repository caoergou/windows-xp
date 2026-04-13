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
    expect(root?.type).toBe('root');
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
});
