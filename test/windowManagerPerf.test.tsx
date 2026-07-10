/**
 * WindowManager performance refactor (#80) regression tests.
 *
 * The acceptance criterion: interacting with one window must not re-render
 * the others. These tests exercise the real <Window/> component under
 * React.Profiler, plus the stable-actions contract and the fixed
 * minimize/flash/persist behaviors.
 */
import React, { Profiler, useEffect } from 'react';
import { render, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  WindowManagerProvider,
  useWindowManager,
  useWindowManagerActions,
} from '../src/context/WindowManagerContext';
import Window from '../src/components/Window';

const renderCounts: Record<string, number> = {};
const countRender = (id: string) => {
  renderCounts[id] = (renderCounts[id] ?? 0) + 1;
};
const resetCounts = () => {
  Object.keys(renderCounts).forEach(key => delete renderCounts[key]);
};

let capturedActions: ReturnType<typeof useWindowManagerActions> | null = null;
const actionRenderLog: Array<ReturnType<typeof useWindowManagerActions>> = [];

const ActionsProbe: React.FC = () => {
  const actions = useWindowManagerActions();
  capturedActions = actions;
  actionRenderLog.push(actions);
  return null;
};

let windowsSnapshot: ReturnType<typeof useWindowManager>['windows'] = [];
const getWindows = () => windowsSnapshot;

// The measurement row must itself be memoized with a stable onRender: an
// inline callback would re-render the Profiler node on every parent render
// and count measurement noise instead of actual <Window/> work. The real
// Desktop maps windows straight onto the memoized <Window/>, so this row
// mirrors production behavior.
const stableOnRender: React.ProfilerOnRenderCallback = id => countRender(String(id));
const WindowRow = React.memo(({ win }: { win: ReturnType<typeof useWindowManager>['windows'][number] }) => (
  <Profiler id={win.appId} onRender={stableOnRender}>
    <Window windowState={win} />
  </Profiler>
));
WindowRow.displayName = 'WindowRow';

const WindowsHarness: React.FC = () => {
  const { windows } = useWindowManager();
  windowsSnapshot = windows;
  return (
    <>
      {windows.map(win => (
        <WindowRow key={win.id} win={win} />
      ))}
    </>
  );
};

const Opener: React.FC = () => {
  const { openWindow } = useWindowManagerActions();
  useEffect(() => {
    openWindow('win-a', 'Window A', <div>A</div>, undefined, { width: 300, height: 200 });
    openWindow('win-b', 'Window B', <div>B</div>, undefined, { width: 300, height: 200 });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- open once
  }, []);
  return null;
};

const mountDesktop = () =>
  render(
    <WindowManagerProvider>
      <ActionsProbe />
      <Opener />
      <WindowsHarness />
    </WindowManagerProvider>
  );

describe('WindowManager performance (#80)', () => {
  beforeEach(() => {
    localStorage.clear();
    resetCounts();
    capturedActions = null;
    actionRenderLog.length = 0;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('moving one window does not re-render the other window', () => {
    mountDesktop();
    expect(getWindows()).toHaveLength(2);
    resetCounts();

    act(() => {
      capturedActions?.moveWindow(getWindows()[0].id, 500, 400);
    });

    expect(renderCounts['win-a'] ?? 0).toBeGreaterThan(0);
    expect(renderCounts['win-b'] ?? 0).toBe(0);
  });

  it('resizing and progress updates only re-render the touched window', () => {
    mountDesktop();
    resetCounts();

    act(() => {
      capturedActions?.resizeWindow(getWindows()[1].id, 640, 480);
    });
    act(() => {
      capturedActions?.setWindowProgress(getWindows()[1].id, 50);
    });

    expect(renderCounts['win-a'] ?? 0).toBe(0);
    expect(renderCounts['win-b'] ?? 0).toBeGreaterThan(0);
  });

  it('actions object is referentially stable across window mutations', () => {
    mountDesktop();
    const before = capturedActions;

    act(() => {
      capturedActions?.moveWindow(getWindows()[0].id, 10, 10);
    });
    act(() => {
      capturedActions?.setWindowBadge(getWindows()[1].id, 3);
    });

    expect(capturedActions).toBe(before);
    // The actions-only consumer never re-rendered after mount.
    expect(new Set(actionRenderLog).size).toBe(1);
  });

  it('minimizing a non-active window keeps the active window focused', () => {
    let state: ReturnType<typeof useWindowManager> | null = null;
    const StateProbe: React.FC = () => {
      state = useWindowManager();
      return null;
    };
    render(
      <WindowManagerProvider>
        <ActionsProbe />
        <Opener />
        <StateProbe />
      </WindowManagerProvider>
    );

    const getState = () => {
      if (!state) throw new Error('state probe not mounted');
      return state;
    };
    const [winA, winB] = getState().windows;
    expect(getState().activeWindowId).toBe(winB.id); // last opened is active

    act(() => {
      capturedActions?.minimizeWindow(winA.id);
    });
    // Old behavior unconditionally cleared the focus (#80).
    expect(getState().activeWindowId).toBe(winB.id);

    act(() => {
      capturedActions?.minimizeWindow(winB.id);
    });
    // All windows minimized: nothing to auto-activate (the old auto-focus
    // effect used to re-activate the window the user had just minimized).
    expect(getState().activeWindowId).toBeNull();
  });

  it('flashWindow restarts its timer and clears the flag after 3s', () => {
    vi.useFakeTimers();
    let state: ReturnType<typeof useWindowManager> | null = null;
    const StateProbe: React.FC = () => {
      state = useWindowManager();
      return null;
    };
    render(
      <WindowManagerProvider>
        <ActionsProbe />
        <Opener />
        <StateProbe />
      </WindowManagerProvider>
    );
    const getState = () => {
      if (!state) throw new Error('state probe not mounted');
      return state;
    };
    const id = getState().windows[0].id;

    act(() => {
      capturedActions?.flashWindow(id);
    });
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    // Restart: a second flash within the window extends the deadline.
    act(() => {
      capturedActions?.flashWindow(id);
    });
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(getState().windows.find(w => w.id === id)?.isFlashing).toBe(true);
    act(() => {
      vi.advanceTimersByTime(1100);
    });
    expect(getState().windows.find(w => w.id === id)?.isFlashing).toBe(false);
  });

  it('persists to localStorage once per burst instead of per mutation', () => {
    vi.useFakeTimers();
    mountDesktop();
    act(() => {
      vi.advanceTimersByTime(400); // flush the mount/open persist
    });

    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    const id = getWindows()[0].id;
    act(() => {
      capturedActions?.moveWindow(id, 11, 11);
      capturedActions?.moveWindow(id, 22, 22);
      capturedActions?.moveWindow(id, 33, 33);
    });
    act(() => {
      vi.advanceTimersByTime(400);
    });

    const persistCalls = setItemSpy.mock.calls.filter(([key]) =>
      String(key).endsWith('open_windows')
    );
    expect(persistCalls).toHaveLength(1);
    const saved = JSON.parse(persistCalls[0][1] as string);
    expect(saved.find((w: { id: string }) => w.id === id).left).toBe(33);
    setItemSpy.mockRestore();
  });
});
