// fake-indexeddb/auto must load before storage.ts so file-content round-trips
// (IndexedDB) work in jsdom — the same setup persistence.test.ts uses.
import 'fake-indexeddb/auto';
import React from 'react';
import { render, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { XP_SNAPSHOT_VERSION, XPSnapshotVersionError } from '../src/snapshot';
import type { XPHandle } from '../src/components/XPBridge';
import { isContainerNode } from '../src/types';

const flush = async () => {
  await act(async () => {
    await new Promise(r => setTimeout(r, 60));
  });
};

const mount = async (prefix: string) => {
  const { WindowsXP } = await import('../src/lib');
  const ref = React.createRef<XPHandle>();
  const utils = render(<WindowsXP ref={ref} autoLogin skipBoot storagePrefix={prefix} />);
  await flush();
  expect(ref.current).not.toBeNull();
  return { ref, utils };
};

describe('XPSnapshot save/load (#117)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('getSnapshot captures created files with content + version/flags', async () => {
    const { ref } = await mount('snapget_');

    act(() => {
      ref.current!.fs.createFile(['save.txt'], {
        type: 'file',
        app: 'Notepad',
        content: 'hello snapshot',
      });
    });

    const snap = ref.current!.getSnapshot();
    expect(snap.version).toBe(XP_SNAPSHOT_VERSION);
    expect(snap.flags).toEqual({});

    const root = snap.fs.root;
    const node = isContainerNode(root) ? root.children?.['save.txt'] : undefined;
    expect(node).toBeDefined();
    expect((node as { content?: string }).content).toBe('hello snapshot');
  });

  it('loadSnapshot rejects a newer-version snapshot without touching storage', async () => {
    const { ref } = await mount('snapver_');

    const future = {
      version: XP_SNAPSHOT_VERSION + 1,
      fs: { root: { type: 'folder', name: 'root', children: {} } },
      recycleBin: {},
      openWindows: [],
      wallpaper: null,
      language: null,
      flags: {},
    };

    await expect(
      ref.current!.loadSnapshot(future as unknown as import('../src/snapshot').XPSnapshot)
    ).rejects.toBeInstanceOf(XPSnapshotVersionError);
  });

  it('round-trips a save from one prefix into another (share a save)', async () => {
    // Author a save under prefix A.
    const { ref: refA } = await mount('snapA_');
    act(() => {
      refA.current!.fs.createFile(['diary.txt'], {
        type: 'file',
        app: 'Notepad',
        content: 'the password is BLISS',
      });
    });
    // Let the debounced persist flush to storage A.
    await flush();
    const snap = refA.current!.getSnapshot();
    expect(refA.current!.fs.readFile(['diary.txt'])).toBe('the password is BLISS');

    // Import it into a fresh prefix B. loadSnapshot writes storage then reloads;
    // the reload throws in jsdom (no navigation), which we swallow — the writes
    // have already completed by then.
    const { ref: refB, utils: bUtils } = await mount('snapB_');
    expect(refB.current!.fs.exists(['diary.txt'])).toBe(false); // clean before import
    await act(async () => {
      await refB.current!.loadSnapshot(snap).catch(() => undefined);
    });
    bUtils.unmount();

    // Re-mount prefix B: it hydrates from the imported storage.
    const { ref: refB2 } = await mount('snapB_');
    expect(refB2.current!.fs.exists(['diary.txt'])).toBe(true);
    expect(refB2.current!.fs.readFile(['diary.txt'])).toBe('the password is BLISS');
  });
});
