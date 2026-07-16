import { describe, expect, it } from 'vitest';
import { buildTaskbarEntries } from '../src/utils/taskbarGrouping';
import { WindowState } from '../src/types';

const windowState = (id: string, appId: string, isHidden = false): WindowState => ({
  id,
  appId,
  title: id,
  component: null,
  props: {},
  isMinimized: false,
  isMaximized: false,
  isHidden,
  zIndex: 1,
});

describe('buildTaskbarEntries', () => {
  const windows = [
    windowState('note-1', 'Notepad'),
    windowState('calc', 'Calculator'),
    windowState('note-2', 'Notepad'),
  ];

  it('clusters similar apps without compacting while labels still fit', () => {
    expect(buildTaskbarEntries(windows, 600).map(entry => entry.windows.map(w => w.id))).toEqual([
      ['note-1'],
      ['note-2'],
      ['calc'],
    ]);
  });

  it('compacts multi-window apps once the button strip is crowded', () => {
    const entries = buildTaskbarEntries(windows, 120);
    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({ key: 'group:Notepad', grouped: true });
    expect(entries[0].windows.map(window => window.id)).toEqual(['note-1', 'note-2']);
  });

  it('omits hidden-to-tray windows from buttons and grouping pressure', () => {
    const entries = buildTaskbarEntries([...windows, windowState('hidden', 'Notepad', true)], 600);
    expect(entries.flatMap(entry => entry.windows).map(window => window.id)).not.toContain(
      'hidden'
    );
  });
});
