import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  createScopedHandle,
  AgentDeniedError,
  AgentRateLimitError,
} from '../src/agent/scopedHandle';
import { expandCaps, DANGEROUS_CAPS } from '../src/agent/types';
import type { XPHandle } from '../src/components/XPBridge';
import type { XPEvent } from '../src/events';

const mockHandle = (): XPHandle & { _emitted: XPEvent[] } => {
  const emitted: XPEvent[] = [];
  return {
    openApp: vi.fn(() => 'win-1'),
    openFile: vi.fn(() => 'win-2'),
    openExternal: vi.fn(),
    getShareUrl: vi.fn(() => null),
    closeWindow: vi.fn(),
    showAlert: vi.fn(),
    reset: vi.fn(),
    fs: {
      readFile: vi.fn(() => 'content'),
      writeFile: vi.fn(),
      createFile: vi.fn(),
      deleteFile: vi.fn(),
      getNode: vi.fn(() => ({ type: 'file' as const, name: 'test.txt' })),
      exists: vi.fn(() => true),
      unlockNode: vi.fn(),
    },
    session: {
      login: vi.fn(() => true),
      logout: vi.fn(),
      shutdown: vi.fn(),
      restart: vi.fn(),
      completePowerTransition: vi.fn(),
    },
    appearance: { setWallpaper: vi.fn(), setLanguage: vi.fn() },
    windows: {
      list: vi.fn(() => [
        { id: 'w1', appId: 'Notepad', title: 'Notepad', isMinimized: false, isMaximized: false },
      ]),
      focus: vi.fn(),
      minimize: vi.fn(),
      maximize: vi.fn(),
      restore: vi.fn(),
    },
    qq: {
      open: vi.fn(() => null),
      sendMessage: vi.fn(() => false),
      hasBuddy: vi.fn(() => false),
      ensureProfile: vi.fn(),
      bringOnline: vi.fn(),
      loadProfile: vi.fn(),
    },
    clock: { now: vi.fn(() => 0), set: vi.fn(), advance: vi.fn(), reset: vi.fn() },
    print: { addJob: vi.fn(), updateJob: vi.fn(), removeJob: vi.fn() },
    sound: { play: vi.fn() },
    notify: vi.fn(() => 'notif-1'),
    emit: vi.fn((e: XPEvent) => emitted.push(e)),
    schedule: vi.fn(() => 'sched-1'),
    cancelSchedule: vi.fn(),
    startLesson: vi.fn(() => true),
    stopLesson: vi.fn(),
    scenario: {
      seekTo: vi.fn(() => false),
      seekToIndex: vi.fn(),
      stepBack: vi.fn(),
      stepForward: vi.fn(),
      exitRehearsal: vi.fn(),
      getState: vi.fn(() => ({ active: false, index: -1, length: 0, beats: [] })),
      setFlag: vi.fn(() => false),
      getDebugState: vi.fn(() => ({
        scenarioId: null,
        flags: {},
        fires: {},
        journalLength: 0,
        pending: [],
        rehearsal: { active: false, index: -1, length: 0, beats: [] },
        triggers: [],
      })),
    },
    getSnapshot: vi.fn(() => ({
      version: 1,
      fs: {
        root: {
          type: 'root' as const,
          name: 'root',
          children: {
            'readme.txt': { type: 'file', name: 'readme.txt' },
            '.secret': { type: 'file', name: '.secret', hidden: true },
          },
        },
      },
      recycleBin: {},
      openWindows: [],
      wallpaper: null,
      language: null,
      flags: {},
    })),
    loadSnapshot: vi.fn(async () => {}),
    _emitted: emitted,
  } as unknown as XPHandle & { _emitted: XPEvent[] };
};

describe('expandCaps', () => {
  it('expands fs.* excluding dangerous caps', () => {
    const caps = expandCaps(['fs.*']);
    expect(caps.has('fs.read')).toBe(true);
    expect(caps.has('fs.write')).toBe(true);
    expect(caps.has('fs.create')).toBe(true);
    expect(caps.has('fs.delete')).toBe(true);
    expect(caps.has('fs.unlock')).toBe(true);
  });

  it('expands windows.* fully', () => {
    const caps = expandCaps(['windows.*']);
    expect(caps.has('windows.list')).toBe(true);
    expect(caps.has('windows.focus')).toBe(true);
    expect(caps.has('windows.minimize')).toBe(true);
    expect(caps.has('windows.maximize')).toBe(true);
    expect(caps.has('windows.restore')).toBe(true);
  });

  it('session.* does NOT include dangerous caps via wildcard', () => {
    const caps = expandCaps(['session.*']);
    expect(caps.has('session.login')).toBe(false);
    expect(caps.has('session.logout')).toBe(false);
    expect(caps.has('session.shutdown')).toBe(false);
    expect(caps.has('session.restart')).toBe(false);
  });

  it('dangerous caps require explicit listing', () => {
    const caps = expandCaps(['session.*', 'session.login']);
    expect(caps.has('session.login')).toBe(true);
    expect(caps.has('session.logout')).toBe(false);
  });

  it('snapshot.load and reset are never granted by wildcard', () => {
    const caps = expandCaps(['*']);
    expect(caps.has('snapshot.load')).toBe(false);
    expect(caps.has('reset')).toBe(false);
    expect(caps.has('schedule')).toBe(false);
  });

  it('explicitly listed dangerous caps are granted', () => {
    const caps = expandCaps(['reset', 'snapshot.load']);
    expect(caps.has('reset')).toBe(true);
    expect(caps.has('snapshot.load')).toBe(true);
  });
});

describe('DANGEROUS_CAPS', () => {
  it('contains all session caps, snapshot.load, reset, schedule', () => {
    expect(DANGEROUS_CAPS.has('session.login')).toBe(true);
    expect(DANGEROUS_CAPS.has('session.logout')).toBe(true);
    expect(DANGEROUS_CAPS.has('session.shutdown')).toBe(true);
    expect(DANGEROUS_CAPS.has('session.restart')).toBe(true);
    expect(DANGEROUS_CAPS.has('snapshot.load')).toBe(true);
    expect(DANGEROUS_CAPS.has('reset')).toBe(true);
    expect(DANGEROUS_CAPS.has('schedule')).toBe(true);
  });
});

describe('createScopedHandle', () => {
  let handle: ReturnType<typeof mockHandle>;

  beforeEach(() => {
    handle = mockHandle();
  });

  it('allows granted capabilities and emits agent:call', () => {
    const scoped = createScopedHandle(handle, { allow: ['fs.read'] });
    const result = scoped.fs.readFile(['test.txt']);
    expect(result).toBe('content');
    expect(handle.fs.readFile).toHaveBeenCalledWith(['test.txt']);
    const callEvent = handle._emitted.find(e => e.type === 'agent:call');
    expect(callEvent).toMatchObject({ type: 'agent:call', cap: 'fs.read', method: 'fs.readFile' });
  });

  it('all methods are always present (never undefined)', () => {
    const scoped = createScopedHandle(handle, { allow: [] });
    expect(typeof scoped.fs.readFile).toBe('function');
    expect(typeof scoped.fs.writeFile).toBe('function');
    expect(typeof scoped.fs.deleteFile).toBe('function');
    expect(typeof scoped.fs.createFile).toBe('function');
    expect(typeof scoped.fs.unlockNode).toBe('function');
    expect(typeof scoped.windows.list).toBe('function');
    expect(typeof scoped.windows.focus).toBe('function');
    expect(typeof scoped.openApp).toBe('function');
    expect(typeof scoped.openFile).toBe('function');
    expect(typeof scoped.notify).toBe('function');
    expect(typeof scoped.sound.play).toBe('function');
    expect(typeof scoped.getSnapshot).toBe('function');
  });

  it('emits agent:denied when calling ungranted capability', () => {
    const scoped = createScopedHandle(handle, { allow: ['fs.read'] });
    scoped.fs.writeFile(['test.txt'], 'data');
    expect(handle.fs.writeFile).not.toHaveBeenCalled();
    const denied = handle._emitted.find(e => e.type === 'agent:denied');
    expect(denied).toMatchObject({ type: 'agent:denied', cap: 'fs.write', method: 'fs.writeFile' });
  });

  it('ungranted openApp returns null and emits agent:denied', () => {
    const scoped = createScopedHandle(handle, { allow: [] });
    const result = scoped.openApp('Calculator');
    expect(result).toBeNull();
    expect(handle.openApp).not.toHaveBeenCalled();
    const denied = handle._emitted.find(e => e.type === 'agent:denied' && e.method === 'openApp');
    expect(denied).toBeDefined();
  });

  it('throws AgentDeniedError when onDenied is throw', () => {
    const scoped = createScopedHandle(handle, { allow: ['fs.read'], onDenied: 'throw' });
    expect(() => scoped.fs.writeFile(['x'], 'y')).toThrow(AgentDeniedError);
    expect(() => scoped.openApp('X')).toThrow(AgentDeniedError);
  });

  it('ungranted getSnapshot returns undefined', () => {
    const scoped = createScopedHandle(handle, { allow: [] });
    expect(scoped.getSnapshot()).toBeUndefined();
  });

  it('windows.list returns window list when granted', () => {
    const scoped = createScopedHandle(handle, { allow: ['windows.list'] });
    const wins = scoped.windows.list();
    expect(wins).toHaveLength(1);
    expect(wins[0].appId).toBe('Notepad');
  });

  it('ungranted windows.list returns empty array', () => {
    const scoped = createScopedHandle(handle, { allow: [] });
    const wins = scoped.windows.list();
    expect(wins).toEqual([]);
  });

  it('apps.open allows openApp', () => {
    const scoped = createScopedHandle(handle, { allow: ['apps.open'] });
    const result = scoped.openApp('Calculator');
    expect(result).toBe('win-1');
    expect(handle.openApp).toHaveBeenCalledWith('Calculator', undefined);
  });

  it('files.open allows openFile', () => {
    const scoped = createScopedHandle(handle, { allow: ['files.open'] });
    const result = scoped.openFile(['readme.txt']);
    expect(result).toBe('win-2');
  });

  it('notify allows notifications', () => {
    const scoped = createScopedHandle(handle, { allow: ['notify'] });
    const result = scoped.notify({ title: 'Test', body: 'Hello' });
    expect(result).toBe('notif-1');
  });

  it('sound.play allows playing sounds', () => {
    const scoped = createScopedHandle(handle, { allow: ['sound.play'] });
    scoped.sound.play('startup');
    expect(handle.sound.play).toHaveBeenCalledWith('startup');
  });

  it('snapshot.read allows getSnapshot', () => {
    const scoped = createScopedHandle(handle, { allow: ['snapshot.read'] });
    const snap = scoped.getSnapshot();
    expect(snap).toBeDefined();
    expect(snap?.version).toBe(1);
  });

  it('rate limiting denies after exceeding max calls', () => {
    const scoped = createScopedHandle(handle, {
      allow: ['fs.read'],
      rateLimit: { maxCalls: 2, windowMs: 60_000 },
    });
    scoped.fs.readFile(['a.txt']);
    scoped.fs.readFile(['b.txt']);
    const result = scoped.fs.readFile(['c.txt']);
    expect(result).toBeNull();
    const denied = handle._emitted.filter(e => e.type === 'agent:denied');
    expect(denied.length).toBeGreaterThanOrEqual(1);
  });

  it('rate limiting with throw mode throws AgentRateLimitError', () => {
    const scoped = createScopedHandle(handle, {
      allow: ['fs.read'],
      onDenied: 'throw',
      rateLimit: { maxCalls: 1, windowMs: 60_000 },
    });
    scoped.fs.readFile(['a.txt']);
    expect(() => scoped.fs.readFile(['b.txt'])).toThrow(AgentRateLimitError);
  });

  it('describe() returns structured world summary', () => {
    const scoped = createScopedHandle(handle, { allow: ['windows.list', 'snapshot.read'] });
    const desc = scoped.describe();
    expect(desc.focusedWindow).toBe('w1');
    expect(desc.windows).toHaveLength(1);
    expect(desc.windows[0].appId).toBe('Notepad');
  });

  it('describe() without windows.list returns empty windows', () => {
    const scoped = createScopedHandle(handle, { allow: ['snapshot.read'] });
    const desc = scoped.describe();
    expect(desc.windows).toHaveLength(0);
    expect(desc.focusedWindow).toBeNull();
  });

  it('describe() filters out hidden desktop items', () => {
    const scoped = createScopedHandle(handle, { allow: ['snapshot.read'] });
    const desc = scoped.describe();
    const names = desc.desktop.map(d => d.name);
    expect(names).toContain('readme.txt');
    expect(names).not.toContain('.secret');
  });

  it('capabilities property exposes the granted set', () => {
    const scoped = createScopedHandle(handle, { allow: ['fs.*', 'windows.list'] });
    expect(scoped.capabilities.has('fs.read')).toBe(true);
    expect(scoped.capabilities.has('fs.write')).toBe(true);
    expect(scoped.capabilities.has('windows.list')).toBe(true);
    expect(scoped.capabilities.has('apps.open')).toBe(false);
  });

  it('wildcard fs.* with explicit session.login grants both', () => {
    const scoped = createScopedHandle(handle, { allow: ['fs.*', 'session.login'] });
    expect(scoped.capabilities.has('fs.read')).toBe(true);
    expect(scoped.capabilities.has('session.login')).toBe(true);
    expect(scoped.capabilities.has('session.logout')).toBe(false);
  });
});

describe('settingEquals condition', () => {
  it('evaluates true when setting matches', async () => {
    const { evaluateCondition } = await import('../src/scenario/engine');
    const ctx = {
      flags: {},
      journal: [],
      fs: { exists: () => false, unlocked: () => false, content: () => null },
      appSettings: {
        get: (appId: string, key: string) => {
          if (appId === 'DisplaySettings' && key === 'wallpaper') return 'bliss';
          return undefined;
        },
      },
    };
    expect(
      evaluateCondition(
        { settingEquals: { appId: 'DisplaySettings', key: 'wallpaper', value: 'bliss' } },
        ctx
      )
    ).toBe(true);
    expect(
      evaluateCondition(
        { settingEquals: { appId: 'DisplaySettings', key: 'wallpaper', value: 'hills' } },
        ctx
      )
    ).toBe(false);
    expect(
      evaluateCondition({ settingEquals: { appId: 'Unknown', key: 'foo', value: 'bar' } }, ctx)
    ).toBe(false);
  });

  it('returns false when appSettings is not provided', async () => {
    const { evaluateCondition } = await import('../src/scenario/engine');
    const ctx = {
      flags: {},
      journal: [],
      fs: { exists: () => false, unlocked: () => false, content: () => null },
    };
    expect(evaluateCondition({ settingEquals: { appId: 'A', key: 'k', value: 'v' } }, ctx)).toBe(
      false
    );
  });
});
