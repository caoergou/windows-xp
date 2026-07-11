/**
 * Event bus + imperative handle (#76).
 *
 * Verifies that desktop mutations emit the right XPEvents on the bus and that
 * the imperative XPHandle drives windows/files. Uses the low-level providers
 * with an explicit bus rather than full <WindowsXP/> so the assertions stay
 * fast and deterministic.
 */
import React from 'react';
import { render, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { XPEventBus, type XPEvent } from '../src/events';
import { EventBusProvider } from '../src/context/EventBusContext';
import { WindowManagerProvider, useWindowManagerActions } from '../src/context/WindowManagerContext';
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
    render(
      <WindowsXP ref={ref} autoLogin skipBoot onEvent={e => seen.push(e.type)} />
    );

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
    expect(seen.some(e => e.type === 'cmd:exec' && 'command' in e && e.command === 'from-host')).toBe(
      true
    );

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
