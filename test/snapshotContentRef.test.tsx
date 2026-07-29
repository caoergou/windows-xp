import 'fake-indexeddb/auto';
import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import type { XPHandle } from '../src/components/XPBridge';
import {
  buildContentPackSnapshotCatalog,
  fingerprintAssetManifest,
} from '../src/content/fingerprint';
import { createContentResolver, memoryContentCache } from '../src/content/resolver';
import type { ContentPack, ContentRef } from '../src/content/types';
import {
  assertLoadableSnapshot,
  captureSnapshotContentRefs,
  prepareSnapshotFilesystem,
  XPSnapshotContentError,
  type SnapshotContentSource,
  type XPSnapshot,
} from '../src/snapshot';
import { isContainerNode, type FileNode } from '../src/types';
import { WindowsXP } from '../src/lib';

const pack: ContentPack = {
  id: 'snapshot-story',
  assets: {
    read: '# Read clue\n\nThe sharer saw this.',
    unread: '# Unread clue\n\nStill supplied by the pack.',
  },
  files: {
    'read.md': {
      type: 'file',
      name: 'read.md',
      app: 'MarkdownViewer',
      contentRef: { asset: 'read' },
    },
    'unread.md': {
      type: 'file',
      name: 'unread.md',
      app: 'MarkdownViewer',
      contentRef: { asset: 'unread' },
    },
  },
};

const tree = (): { root: FileNode } => ({
  root: {
    type: 'root',
    name: 'root',
    children: JSON.parse(JSON.stringify(pack.files)) as Record<string, FileNode>,
  },
});

const sourceFor = (packs: ContentPack[]): SnapshotContentSource => {
  const assets = Object.assign({}, ...packs.map(item => item.assets ?? {})) as Record<
    string,
    ContentRef
  >;
  return {
    ...buildContentPackSnapshotCatalog(packs),
    assets,
    resolver: createContentResolver({
      assets,
      cache: memoryContentCache(),
      packId: packs.map(item => item.id).join('+') || undefined,
    }),
  };
};

const snapshotWith = (fs: { root: FileNode }, source: SnapshotContentSource): XPSnapshot => ({
  version: 1,
  fs,
  recycleBin: {},
  openWindows: [],
  wallpaper: null,
  language: null,
  flags: {},
  contentRefs: captureSnapshotContentRefs(fs, source),
});

describe('snapshot ContentRef semantics (#266)', () => {
  beforeEach(() => localStorage.clear());

  it('exports read bodies while retaining unread pack provenance and fingerprint', async () => {
    const ref = React.createRef<XPHandle>();
    render(<WindowsXP ref={ref} autoLogin skipBoot disableScreenSaver contentPacks={[pack]} />);
    await waitFor(() => expect(ref.current).not.toBeNull());
    const handle = ref.current;
    if (!handle) throw new Error('expected WindowsXP handle');
    await waitFor(() => expect(screen.getByTestId('taskbar')).toBeInTheDocument());
    await screen.findByTestId('desktop-icon-read.md');
    let windowId: string | null = null;
    act(() => {
      windowId = handle.openFile(['read.md']);
    });
    expect(windowId).not.toBeNull();
    await waitFor(() =>
      expect(handle.getSnapshot().contentRefs?.[0]?.resolvedContent).toBe(
        '# Read clue\n\nThe sharer saw this.'
      )
    );

    const snapshot = handle.getSnapshot();
    expect(snapshot.contentRefs).toEqual([
      {
        path: ['read.md'],
        ref: { asset: 'read' },
        packId: 'snapshot-story',
        assetManifestFingerprint: fingerprintAssetManifest(pack.assets),
        resolvedContent: '# Read clue\n\nThe sharer saw this.',
      },
      {
        path: ['unread.md'],
        ref: { asset: 'unread' },
        packId: 'snapshot-story',
        assetManifestFingerprint: fingerprintAssetManifest(pack.assets),
      },
    ]);
  });

  it('does not treat a solver-only resolution as user-read content', async () => {
    const source = sourceFor([pack]);
    await source.resolver.resolveOrNull({ asset: 'read' });
    const entries = captureSnapshotContentRefs(tree(), source);
    expect(entries[0]).not.toHaveProperty('resolvedContent');
  });

  it('restores read content inline and keeps verified unread refs lazy', async () => {
    const source = sourceFor([pack]);
    await source.resolver.resolveForRead({ asset: 'read' });
    const snapshot = snapshotWith(tree(), source);
    const restored = prepareSnapshotFilesystem(snapshot, source);
    if (!isContainerNode(restored.root)) throw new Error('expected snapshot root container');

    expect(restored.root.children['read.md']).toMatchObject({
      content: '# Read clue\n\nThe sharer saw this.',
    });
    expect(restored.root.children['read.md']).not.toHaveProperty('contentRef');
    expect(restored.root.children['unread.md']).toMatchObject({
      contentRef: { asset: 'unread' },
    });
    await expect(source.resolver.resolve({ asset: 'unread' })).resolves.toContain('Unread clue');
  });

  it('restores a read file without its pack but rejects an unread missing asset by name', async () => {
    const source = sourceFor([pack]);
    await source.resolver.resolveForRead({ asset: 'read' });
    const fullSnapshot = snapshotWith(tree(), source);
    const withoutPacks = sourceFor([]);

    const readOnlyTree = tree();
    if (!isContainerNode(readOnlyTree.root)) throw new Error('expected snapshot root container');
    delete readOnlyTree.root.children['unread.md'];
    const readOnlySnapshot: XPSnapshot = {
      ...fullSnapshot,
      fs: readOnlyTree,
      contentRefs: fullSnapshot.contentRefs?.filter(entry => entry.path[0] === 'read.md'),
    };
    const restoredRead = prepareSnapshotFilesystem(readOnlySnapshot, withoutPacks);
    if (!isContainerNode(restoredRead.root)) throw new Error('expected snapshot root container');
    expect(restoredRead.root.children['read.md']).toMatchObject({
      content: '# Read clue\n\nThe sharer saw this.',
    });

    expect(() => prepareSnapshotFilesystem(fullSnapshot, withoutPacks)).toThrow(
      XPSnapshotContentError
    );
    try {
      prepareSnapshotFilesystem(fullSnapshot, withoutPacks);
    } catch (error) {
      expect(error).toMatchObject({
        code: 'snapshot-content-pack-missing',
        packId: 'snapshot-story',
        asset: 'unread',
        path: ['unread.md'],
      });
      expect(String(error)).toContain('snapshot-story');
      expect(String(error)).toContain('unread');
    }

    const ref = React.createRef<XPHandle>();
    render(
      <WindowsXP
        ref={ref}
        autoLogin
        skipBoot
        disableScreenSaver
        persistence="none"
        storagePrefix="snapshot-import_"
      />
    );
    await waitFor(() => expect(ref.current).not.toBeNull());
    const handle = ref.current;
    if (!handle) throw new Error('expected WindowsXP handle');
    await expect(handle.loadSnapshot(fullSnapshot)).rejects.toMatchObject({
      code: 'snapshot-content-pack-missing',
      packId: 'snapshot-story',
      asset: 'unread',
      path: ['unread.md'],
    });
  });

  it('rejects the same pack id when its asset manifest fingerprint changed', () => {
    const source = sourceFor([pack]);
    const snapshot = snapshotWith(tree(), source);
    const changedPack: ContentPack = {
      ...pack,
      assets: { ...pack.assets, unread: '# Changed after the save' },
    };
    expect(() => prepareSnapshotFilesystem(snapshot, sourceFor([changedPack]))).toThrowError(
      expect.objectContaining({
        code: 'snapshot-content-pack-mismatch',
        packId: 'snapshot-story',
      })
    );
  });

  it('rejects content metadata that does not match its filesystem node', () => {
    const source = sourceFor([pack]);
    const snapshot = snapshotWith(tree(), source);
    const [entry] = snapshot.contentRefs ?? [];
    if (!entry) throw new Error('expected snapshot content metadata');
    entry.path = ['missing.md'];

    expect(() => assertLoadableSnapshot(snapshot)).toThrowError(
      'contentRefs[0]: does not match its filesystem contentRef.'
    );
  });
});
