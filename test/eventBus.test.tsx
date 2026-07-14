/**
 * Event bus + imperative handle (#76).
 *
 * Verifies that desktop mutations emit the right XPEvents on the bus and that
 * the imperative XPHandle drives windows/files. Uses the low-level providers
 * with an explicit bus rather than full <WindowsXP/> so the assertions stay
 * fast and deterministic.
 */
import React from 'react';
import { render, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import PasswordDialog from '../src/components/PasswordDialog';
import { XPEventBus, type XPEvent } from '../src/events';
import { EventBusProvider } from '../src/context/EventBusContext';
import {
  WindowManagerProvider,
  useWindowManagerActions,
} from '../src/context/WindowManagerContext';
import { FileSystemProvider, useFileSystem } from '../src/context/FileSystemContext';

let bus: XPEventBus;
let events: XPEvent[];

const withBus = (ui: React.ReactNode) =>
  render(<EventBusProvider bus={bus}>{ui}</EventBusProvider>);

describe('XPEventBus core', () => {
  beforeEach(() => {
    bus = new XPEventBus();
    events = [];
    bus.subscribe(e => events.push(e));
    localStorage.clear();
  });

  it('delivers events to every subscriber and unsubscribes cleanly', () => {
    const seen: string[] = [];
    const off = bus.subscribe(e => seen.push(e.type));
    bus.emit({ type: 'session:login' });
    off();
    bus.emit({ type: 'session:logout' });
    expect(seen).toEqual(['session:login']);
    // The beforeEach subscriber still received both.
    expect(events.map(e => e.type)).toEqual(['session:login', 'session:logout']);
  });

  it('isolates a throwing listener from the rest', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(vi.fn());
    bus.subscribe(() => {
      throw new Error('boom');
    });
    const after: string[] = [];
    bus.subscribe(e => after.push(e.type));
    expect(() => bus.emit({ type: 'session:login' })).not.toThrow();
    expect(after).toEqual(['session:login']);
    spy.mockRestore();
  });
});

describe('expanded event catalog', () => {
  beforeEach(() => {
    bus = new XPEventBus();
    events = [];
    bus.subscribe(e => events.push(e));
  });

  // Every new domain must round-trip through the bus with its payload intact.
  // This is the type-level contract scenario authors and hosts depend on: the
  // union in src/events.ts is the single trigger vocabulary, so each member must
  // be constructible and observable. (A compile error here is the real guard —
  // an invalid payload would fail `tsc` before this test runs.)
  const samples: XPEvent[] = [
    { type: 'startmenu:open' },
    { type: 'startmenu:close' },
    { type: 'contextmenu:open', target: 'file', path: ['D:', '日记.txt'] },
    { type: 'file:properties', path: ['D:', '日记.txt'], name: '日记.txt' },
    { type: 'ie:navigate', url: 'http://example.com', generated: true },
    { type: 'qq:offline', buddyId: 'crystal' },
    { type: 'qq:status', buddyId: 'crystal', signature: '别动我的东西' },
    { type: 'qq:choice', buddyId: 'crystal', choiceId: 'opt-2' },
    { type: 'game:start', appId: 'Minesweeper', difficulty: 'beginner' },
    { type: 'game:win', appId: 'Minesweeper', difficulty: 'expert', timeMs: 42000 },
    { type: 'game:lose', appId: 'Minesweeper', difficulty: 'beginner' },
    { type: 'media:play', path: '/music.mp3', title: 'music' },
    { type: 'media:pause', path: '/music.mp3' },
    { type: 'media:ended', path: '/music.mp3' },
    { type: 'media:seek', path: '/music.mp3', position: 12.5 },
    { type: 'search:query', query: '0318', hit: true, resultIds: ['thread-1'] },
    { type: 'evidence:collect', termId: 'term.bicycle', source: 'diary' },
    { type: 'evidence:pin', itemId: 'photo-3' },
    { type: 'evidence:link', sourceId: 'photo-3', targetId: 'name-7' },
    { type: 'evidence:unpin', itemId: 'photo-3' },
    { type: 'deduction:submit', formId: 'finale', slots: { who: '阿哲', where: '网吧' } },
    { type: 'deduction:verified', formId: 'finale', groups: ['g1'] },
    { type: 'deduction:failed', formId: 'finale', groups: ['g2'] },
    { type: 'lesson:start', lessonId: 'get-software' },
    { type: 'lesson:step-complete', lessonId: 'get-software', stepId: 's1' },
    { type: 'lesson:hint-shown', lessonId: 'get-software', stepId: 's1', hintId: 'h1' },
    { type: 'lesson:step-failed', lessonId: 'get-software', stepId: 's1' },
    { type: 'lesson:complete', lessonId: 'get-software', score: 100 },
    { type: 'install:start', appId: 'Thunder' },
    { type: 'install:complete', appId: 'Thunder' },
    { type: 'install:cancelled', appId: 'Thunder' },
    { type: 'ui:action', appId: 'ControlPanel', control: 'screensaver.enabled', value: true },
  ];

  it.each(samples.map(s => [s.type, s] as const))(
    'delivers %s with its payload intact',
    (_type, sample) => {
      bus.emit(sample);
      expect(events).toHaveLength(1);
      expect(events[0]).toEqual(sample);
    }
  );
});

describe('WindowManager emits lifecycle events (#76)', () => {
  beforeEach(() => {
    bus = new XPEventBus();
    events = [];
    bus.subscribe(e => events.push(e));
    localStorage.clear();
  });

  it('emits app:launch / window:minimize / app:close', () => {
    let actions: ReturnType<typeof useWindowManagerActions> | null = null;
    const Probe: React.FC = () => {
      actions = useWindowManagerActions();
      return null;
    };
    withBus(
      <WindowManagerProvider>
        <Probe />
      </WindowManagerProvider>
    );

    let id = '';
    act(() => {
      id = actions!.openWindow('Calculator', '计算器', <div />, 'calculator');
    });
    act(() => {
      actions!.minimizeWindow(id);
    });
    act(() => {
      actions!.closeWindow(id);
    });

    const types = events.map(e => e.type);
    expect(types).toContain('app:launch');
    expect(types).toContain('window:minimize');
    expect(types).toContain('app:close');

    const launch = events.find(e => e.type === 'app:launch');
    expect(launch).toMatchObject({ appId: 'Calculator', windowId: id, title: '计算器' });
  });
});

describe('imperative XPHandle (#76)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('openApp launches a window and onEvent observes it', async () => {
    const { WindowsXP } = await import('../src/lib');
    const seen: string[] = [];
    const ref = React.createRef<import('../src/components/XPBridge').XPHandle>();
    render(<WindowsXP ref={ref} autoLogin skipBoot onEvent={e => seen.push(e.type)} />);

    // The handle is wired once the provider tree mounts.
    await act(async () => {
      await Promise.resolve();
    });
    expect(ref.current).not.toBeNull();

    let id: string | null = null;
    act(() => {
      id = ref.current!.openApp('Calculator');
    });
    expect(id).toBeTruthy();
    expect(seen).toContain('app:launch');

    act(() => {
      ref.current!.closeWindow(id!);
    });
    expect(seen).toContain('app:close');
  });
});

describe('imperative XPHandle v2 (#115)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const mountHandle = async (seen: XPEvent[]) => {
    const { WindowsXP } = await import('../src/lib');
    const ref = React.createRef<import('../src/components/XPBridge').XPHandle>();
    render(<WindowsXP ref={ref} autoLogin skipBoot onEvent={e => seen.push(e)} />);
    await act(async () => {
      await Promise.resolve();
    });
    expect(ref.current).not.toBeNull();
    return ref;
  };

  it('plants a file, reads/writes it, and openFile is observable', async () => {
    const seen: XPEvent[] = [];
    const ref = await mountHandle(seen);

    act(() => {
      ref.current!.fs.createFile(['clue.txt'], { type: 'file', content: 'secret', app: 'Notepad' });
    });
    expect(ref.current!.fs.exists(['clue.txt'])).toBe(true);
    expect(ref.current!.fs.readFile(['clue.txt'])).toBe('secret');

    act(() => {
      ref.current!.fs.writeFile(['clue.txt'], 'changed');
    });
    expect(ref.current!.fs.readFile(['clue.txt'])).toBe('changed');

    act(() => {
      ref.current!.openFile(['clue.txt']);
    });
    expect(seen.map(e => e.type)).toContain('app:launch');

    act(() => {
      ref.current!.fs.deleteFile(['clue.txt']);
    });
    expect(ref.current!.fs.exists(['clue.txt'])).toBe(false);
  });

  it('unlockNode clears locked persistently and emits file:unlock', async () => {
    const seen: XPEvent[] = [];
    const ref = await mountHandle(seen);

    act(() => {
      ref.current!.fs.createFile(['vault'], { type: 'folder', locked: true, password: 'x' });
    });
    expect(ref.current!.fs.getNode(['vault'])?.locked).toBe(true);

    act(() => {
      ref.current!.fs.unlockNode(['vault']);
    });
    expect(ref.current!.fs.getNode(['vault'])?.locked).toBe(false);
    expect(seen.some(e => e.type === 'file:unlock')).toBe(true);
  });

  it('exposes windows.list, appearance.setWallpaper and emit', async () => {
    const seen: XPEvent[] = [];
    const ref = await mountHandle(seen);

    let id: string | null = null;
    act(() => {
      id = ref.current!.openApp('Calculator');
    });
    const list = ref.current!.windows.list();
    expect(list.some(w => w.id === id)).toBe(true);

    // Host-injected event reaches the same onEvent pipeline.
    act(() => {
      ref.current!.emit({ type: 'cmd:exec', command: 'from-host' });
    });
    expect(
      seen.some(e => e.type === 'cmd:exec' && 'command' in e && e.command === 'from-host')
    ).toBe(true);

    // setWallpaper does not throw and is callable from the handle.
    act(() => {
      ref.current!.appearance.setWallpaper('bliss');
    });
  });
});

describe('FileSystem emits mutation events (#76)', () => {
  beforeEach(() => {
    bus = new XPEventBus();
    events = [];
    bus.subscribe(e => events.push(e));
    localStorage.clear();
  });

  it('emits file:create, file:rename and file:delete', () => {
    let fsApi: ReturnType<typeof useFileSystem> | null = null;
    const Probe: React.FC = () => {
      fsApi = useFileSystem();
      return null;
    };
    withBus(
      <FileSystemProvider>
        <Probe />
      </FileSystemProvider>
    );

    act(() => {
      fsApi!.createFile([], 'ev.txt', 'file', { content: 'x' });
    });
    act(() => {
      fsApi!.renameFile([], 'ev.txt', 'ev2.txt');
    });
    act(() => {
      fsApi!.deleteFile([], 'ev2.txt');
    });

    const byType = (t: string) => events.find(e => e.type === t);
    expect(byType('file:create')).toMatchObject({ name: 'ev.txt', nodeType: 'file' });
    expect(byType('file:rename')).toMatchObject({ oldName: 'ev.txt', newName: 'ev2.txt' });
    expect(byType('file:delete')).toMatchObject({ name: 'ev2.txt' });
  });
});

describe('FileSystem emits expanded coverage events (#116)', () => {
  let fsApi: ReturnType<typeof useFileSystem> | null;

  const mountFs = () => {
    fsApi = null;
    const Probe: React.FC = () => {
      fsApi = useFileSystem();
      return null;
    };
    withBus(
      <FileSystemProvider>
        <Probe />
      </FileSystemProvider>
    );
  };

  beforeEach(() => {
    bus = new XPEventBus();
    events = [];
    bus.subscribe(e => events.push(e));
    localStorage.clear();
  });

  const byType = (t: string) => events.find(e => e.type === t);

  it('emits file:update on content edit', () => {
    mountFs();
    act(() => {
      fsApi!.createFile([], 'note.txt', 'file', { content: 'a' });
    });
    act(() => {
      fsApi!.updateFile(['note.txt'], { content: 'passphrase' });
    });
    // Carries the new content so scenarios can react to what was typed (#116).
    expect(byType('file:update')).toMatchObject({
      path: ['note.txt'],
      name: 'note.txt',
      content: 'passphrase',
    });
  });

  it('emits folder:delete when a folder is removed', () => {
    mountFs();
    act(() => {
      fsApi!.createFolder([], 'Docs');
    });
    act(() => {
      fsApi!.deleteFolder([], 'Docs');
    });
    expect(byType('folder:delete')).toMatchObject({ path: ['Docs'], name: 'Docs' });
  });

  it('emits file:move and file:copy', () => {
    mountFs();
    act(() => {
      fsApi!.createFolder([], 'Dest');
      fsApi!.createFile([], 'm.txt', 'file', { content: 'x' });
      fsApi!.createFile([], 'c.txt', 'file', { content: 'y' });
    });
    act(() => {
      fsApi!.moveFile([], 'm.txt', ['Dest']);
    });
    act(() => {
      fsApi!.copyFile([], 'c.txt', ['Dest']);
    });
    expect(byType('file:move')).toMatchObject({
      from: ['m.txt'],
      to: ['Dest', 'm.txt'],
      name: 'm.txt',
    });
    expect(byType('file:copy')).toMatchObject({
      from: ['c.txt'],
      to: ['Dest', 'c.txt'],
      name: 'c.txt',
    });
  });

  it('emits recyclebin:empty', () => {
    mountFs();
    act(() => {
      fsApi!.emptyRecycleBin();
    });
    expect(byType('recyclebin:empty')).toBeTruthy();
  });

  it('emits password:fail with an incrementing attempt count, then file:unlock', () => {
    mountFs();
    const locked = {
      type: 'folder',
      name: 'Secret',
      locked: true,
      password: 'open',
      children: {},
    } as never;
    act(() => {
      fsApi!.checkAccess(locked, 'wrong');
    });
    act(() => {
      fsApi!.checkAccess(locked, 'nope');
    });
    act(() => {
      fsApi!.checkAccess(locked, 'open');
    });
    const fails = events.filter(e => e.type === 'password:fail');
    expect(fails).toHaveLength(2);
    expect(fails[0]).toMatchObject({ name: 'Secret', attempt: 1 });
    expect(fails[1]).toMatchObject({ name: 'Secret', attempt: 2 });
    expect(byType('file:unlock')).toMatchObject({ name: 'Secret' });
  });
});

describe('PasswordDialog fires onFail on each wrong entry (#116)', () => {
  it('calls onFail when the entered password is incorrect, not on cancel', () => {
    const onFail = vi.fn();
    const onSuccess = vi.fn();
    const onCancel = vi.fn();
    const { getByPlaceholderText, getByText } = render(
      <PasswordDialog
        correctPassword="open"
        onSuccess={onSuccess}
        onCancel={onCancel}
        onFail={onFail}
      />
    );
    const input = getByPlaceholderText(/./) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'wrong' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onFail).toHaveBeenCalledTimes(1);
    expect(onSuccess).not.toHaveBeenCalled();

    // A second wrong attempt fires again (the dialog stayed open).
    fireEvent.change(input, { target: { value: 'nope' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onFail).toHaveBeenCalledTimes(2);

    // The correct password succeeds without another onFail.
    fireEvent.change(input, { target: { value: 'open' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onFail).toHaveBeenCalledTimes(2);
    expect(onSuccess).toHaveBeenCalledTimes(1);

    void getByText;
  });
});
