// fake-indexeddb/auto must load before storage.ts so the module-level
// `indexedDB` capture sees the fake factory.
import 'fake-indexeddb/auto';
import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createStorage, getDefaultStorage, setStoragePrefix } from '../src/utils/storage';
import { StorageProvider, useStorage } from '../src/context/StorageContext';
import type { FileSystemMetadata } from '../src/utils/storage';

const meta = (name: string): FileSystemMetadata => ({
  files: { [name]: { path: [name], name, type: 'file', modifiedAt: 1 } },
  deleted: [],
  version: 2,
  lastModified: 1,
});

describe('per-instance storage isolation (#95)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('two handles with different prefixes never share localStorage keys', () => {
    const a = createStorage('inst_a');
    const b = createStorage('inst_b');

    a.local.setItem(a.key('token'), 'A');
    b.local.setItem(b.key('token'), 'B');

    expect(a.local.getItem(a.key('token'))).toBe('A');
    expect(b.local.getItem(b.key('token'))).toBe('B');
    // Underlying keys are distinct and namespaced.
    expect(localStorage.getItem('inst_a_token')).toBe('A');
    expect(localStorage.getItem('inst_b_token')).toBe('B');
  });

  it('metadata and recycle bin are isolated per handle', () => {
    const a = createStorage('meta_a');
    const b = createStorage('meta_b');

    a.saveMetadata(meta('a.txt'));
    b.saveMetadata(meta('b.txt'));
    expect(Object.keys(a.getMetadata()!.files)).toEqual(['a.txt']);
    expect(Object.keys(b.getMetadata()!.files)).toEqual(['b.txt']);

    a.saveRecycleBin({ x: { item: { type: 'file', name: 'x' }, originalPath: [], deletedAt: 1 } });
    expect(a.getRecycleBin()).not.toBeNull();
    expect(b.getRecycleBin()).toBeNull();
  });

  it('file content lives in separate IndexedDB databases', async () => {
    const a = createStorage('db_a');
    const b = createStorage('db_b');

    await a.saveFileContent(['note'], 'from-A');
    expect(await a.getFileContent(['note'])).toBe('from-A');
    // b uses a different DB name, so it must not see a's content.
    expect(await b.getFileContent(['note'])).toBeNull();
  });

  it('changing the default prefix does not affect an already-created handle', () => {
    setStoragePrefix('first_');
    const pinned = getDefaultStorage();
    expect(pinned.key('k')).toBe('first_k');

    setStoragePrefix('second_');
    // The pinned handle keeps its own prefix; only the default rotated.
    expect(pinned.key('k')).toBe('first_k');
    expect(getDefaultStorage().key('k')).toBe('second_k');
  });

  it('useStorage returns the provider-scoped handle, isolated across trees', () => {
    const Probe: React.FC<{ id: string }> = ({ id }) => {
      const storage = useStorage();
      return <span data-testid={id}>{storage.key('open_windows')}</span>;
    };

    render(
      <>
        <StorageProvider prefix="win_a">
          <Probe id="a" />
        </StorageProvider>
        <StorageProvider prefix="win_b">
          <Probe id="b" />
        </StorageProvider>
      </>
    );

    expect(screen.getByTestId('a').textContent).toBe('win_a_open_windows');
    expect(screen.getByTestId('b').textContent).toBe('win_b_open_windows');
  });
});
