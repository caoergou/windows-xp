import React from 'react';
import { act, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { mergeContentPacks } from '../src/content/pack';
import { EventBusProvider } from '../src/context/EventBusContext';
import { StorageProvider } from '../src/context/StorageContext';
import { ClockProvider } from '../src/context/ClockContext';
import {
  RecentDocumentsProvider,
  useRecentDocuments,
  type RecentDocumentEntry,
} from '../src/context/RecentDocumentsContext';
import { XPEventBus } from '../src/events';

describe('forensic metadata v2 (#282)', () => {
  it('merges authored recycle-bin records without changing timestamps or paths', () => {
    const record = {
      item: {
        type: 'file' as const,
        name: 'draft.xls',
        ctime: '2016-02-16T08:00:00Z',
        mtime: '2016-02-17T09:00:00Z',
        importedAt: '2016-02-16T10:00:00Z',
      },
      originalPath: ['我的文档', '报名'],
      deletedAt: '2016-02-18T01:02:03Z',
    };
    const mounted = mergeContentPacks([{ id: 'forensics', recycleBin: { 'draft.xls': record } }]);
    expect(mounted.recycleBin['draft.xls']).toEqual(record);
  });

  it('merges seeded MRU with a runtime file open in chronological order', () => {
    localStorage.clear();
    const bus = new XPEventBus();
    const seeded: RecentDocumentEntry[] = [
      { path: ['old.txt'], openedAt: '2016-02-16T08:00:00Z', source: 'seeded' },
    ];
    let entries: RecentDocumentEntry[] = [];
    const Probe = () => {
      entries = useRecentDocuments().entries;
      return null;
    };
    render(
      <StorageProvider prefix="forensic_test_" persistence="local">
        <EventBusProvider bus={bus}>
          <ClockProvider config={{ initialTime: '2016-02-18T08:00:00Z', mode: 'frozen' }}>
            <RecentDocumentsProvider seeded={seeded}>
              <Probe />
            </RecentDocumentsProvider>
          </ClockProvider>
        </EventBusProvider>
      </StorageProvider>
    );
    act(() =>
      bus.emit({ type: 'file:open', path: ['new.txt'], name: 'new.txt', nodeType: 'file' })
    );
    expect(entries.map(entry => entry.path[0])).toEqual(['new.txt', 'old.txt']);
    expect(entries[0].source).toBe('runtime');
  });
});
