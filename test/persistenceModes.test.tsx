/**
 * Persistence modes (#138): local | session | none, behind the createStorage
 * handle, plus a pristine-remount check through <WindowsXP/>.
 */
// fake-indexeddb/auto must load before storage.ts captures `indexedDB`.
import 'fake-indexeddb/auto';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createStorage } from '../src/utils/storage';
import { WindowsXP } from '../src/lib';
import type { XPHandle } from '../src/lib';

const hasDb = async (name: string): Promise<boolean> => {
  const dbs = await indexedDB.databases();
  return dbs.some(d => d.name === name);
};

describe('createStorage persistence backends (#138)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("local (default): metadata in localStorage, content round-trips via IndexedDB", async () => {
    const s = createStorage('pl_', 'local');
    s.saveMetadata({ files: {}, version: 1, lastModified: 0 });
    expect(localStorage.getItem('pl_fs_metadata')).toBeTruthy();
    await s.saveFileContent(['a.txt'], 'hello');
    expect(await s.getFileContent(['a.txt'])).toBe('hello');
    expect(await hasDb('pl_WindowsXP_FS')).toBe(true);
  });

  it('session: metadata in sessionStorage (survives a reload), content ephemeral, no IndexedDB', async () => {
    const s = createStorage('se_', 'session');
    s.saveMetadata({ files: {}, version: 1, lastModified: 0 });
    expect(sessionStorage.getItem('se_fs_metadata')).toBeTruthy();
    expect(localStorage.getItem('se_fs_metadata')).toBeNull();
    await s.saveFileContent(['a.txt'], 'hi');
    expect(await s.getFileContent(['a.txt'])).toBe('hi');
    expect(await hasDb('se_WindowsXP_FS')).toBe(false);

    // A fresh handle on the same tab still sees sessionStorage metadata…
    const reloaded = createStorage('se_', 'session');
    expect(reloaded.getMetadata()).toBeTruthy();
    // …but content is per-handle in memory, so it's gone (tab-lifetime loss).
    expect(await reloaded.getFileContent(['a.txt'])).toBeNull();
  });

  it('none: pure in-memory, nothing on disk, no IndexedDB, pristine per handle', async () => {
    const s = createStorage('no_', 'none');
    s.saveMetadata({ files: {}, version: 1, lastModified: 0 });
    await s.saveFileContent(['a.txt'], 'x');
    expect(await s.getFileContent(['a.txt'])).toBe('x');
    // Nothing leaked to disk…
    expect(localStorage.getItem('no_fs_metadata')).toBeNull();
    expect(sessionStorage.getItem('no_fs_metadata')).toBeNull();
    expect(await hasDb('no_WindowsXP_FS')).toBe(false);
    // …and a new handle is pristine.
    const fresh = createStorage('no_', 'none');
    expect(fresh.getMetadata()).toBeNull();
    expect(await fresh.getFileContent(['a.txt'])).toBeNull();
  });
});

describe('persistence="none" desktop is pristine across remounts (#138)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('a window opened in one mount does not survive into the next mount', async () => {
    const ref1 = React.createRef<XPHandle>();
    const first = render(
      <WindowsXP ref={ref1} skipBoot autoLogin disableScreenSaver persistence="none" />
    );
    await waitFor(() => expect(screen.getByTestId('taskbar')).toBeInTheDocument());
    ref1.current!.openApp('Calculator');
    await waitFor(() => expect(ref1.current!.windows.list().length).toBe(1));
    // Nothing was written to disk.
    expect(localStorage.getItem('xp_open_windows')).toBeNull();
    first.unmount();

    // Remount: pure in-memory backend → pristine, no restored windows.
    const ref2 = React.createRef<XPHandle>();
    render(<WindowsXP ref={ref2} skipBoot autoLogin disableScreenSaver persistence="none" />);
    await waitFor(() => expect(screen.getByTestId('taskbar')).toBeInTheDocument());
    expect(ref2.current!.windows.list().length).toBe(0);
  });
});
