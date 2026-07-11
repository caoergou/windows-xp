import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { restoreComponent } from '../utils/WindowFactory';
import { APP_REGISTRY } from '../registry/apps';
import { WindowState, WindowProps, AppRegistryEntry } from '../types';
import { WINDOW_DEFAULTS } from '../constants';
import { canUseDOM } from '../utils/storage';
import { useStorage } from './StorageContext';
import { useXPEventBus } from './EventBusContext';

interface WindowManagerActions {
  openWindow: (
    appId: string,
    title: string,
    component: React.ReactNode,
    icon?: string,
    props?: WindowProps
  ) => string;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  resizeWindow: (id: string, width: number, height: number) => void;
  moveWindow: (id: string, left: number, top: number) => void;
  focusWindow: (id: string) => void;
  setWindowTitle: (id: string, title: string) => void;
  setWindowBadge: (id: string, badge: string | number | null) => void;
  setWindowProgress: (id: string, progress: number | null) => void;
  flashWindow: (id: string) => void;
}

interface WindowManagerContextType extends WindowManagerActions {
  windows: WindowState[];
  activeWindowId: string | null;
}

/**
 * Split contexts (#80): any window interaction used to re-render every open
 * window, the taskbar and the desktop because a single context carried both
 * the (ever-changing) window list and the action set.
 *
 * - WindowsContext: the window list - changes on every window mutation.
 * - ActiveWindowIdContext: focus only - changes when focus moves.
 * - ActionsContext: stable for the provider's lifetime - never re-renders
 *   its consumers.
 *
 * <Window/> subscribes to actions + active id only; its own data arrives via
 * the windowState prop, so React.memo actually works: dragging or updating
 * one window no longer re-renders the others.
 */
const WindowsContext = createContext<WindowState[] | undefined>(undefined);
const ActiveWindowIdContext = createContext<string | null | undefined>(undefined);
const ActionsContext = createContext<WindowManagerActions | undefined>(undefined);

export const useWindowManagerActions = (): WindowManagerActions => {
  const actions = useContext(ActionsContext);
  if (actions === undefined) {
    throw new Error('useWindowManagerActions must be used within a WindowManagerProvider');
  }
  return actions;
};

export const useActiveWindowId = (): string | null => {
  const activeWindowId = useContext(ActiveWindowIdContext);
  if (activeWindowId === undefined) {
    throw new Error('useActiveWindowId must be used within a WindowManagerProvider');
  }
  return activeWindowId;
};

/** Merged, backward-compatible API. Subscribes to ALL window state. */
export const useWindowManager = (): WindowManagerContextType => {
  const windows = useContext(WindowsContext);
  const activeWindowId = useContext(ActiveWindowIdContext);
  const actions = useContext(ActionsContext);
  if (windows === undefined || activeWindowId === undefined || actions === undefined) {
    throw new Error('useWindowManager must be used within a WindowManagerProvider');
  }
  return useMemo(
    () => ({ windows, activeWindowId, ...actions }),
    [windows, activeWindowId, actions]
  );
};

const PERSIST_DEBOUNCE_MS = 300;

export const WindowManagerProvider: React.FC<{
  children: React.ReactNode;
  registry?: Record<string, AppRegistryEntry>;
  value?: Partial<WindowManagerContextType>;
}> = ({ children, registry = APP_REGISTRY, value }) => {
  const bus = useXPEventBus();
  const storage = useStorage();
  const [windows, setWindows] = useState<WindowState[]>(() => {
    try {
      const saved = storage.local.getItem(storage.key('open_windows'));
      if (saved) {
        const parsed: WindowState[] = JSON.parse(saved);
        const restored = parsed
          .map(w => {
            const component = restoreComponent(w.appId, w.componentProps || w.props, registry);
            return component ? { ...w, component } : null;
          })
          .filter(Boolean);
        return restored as WindowState[];
      }
    } catch (e) {
      console.error('Failed to restore windows:', e);
    }
    return [];
  });
  const [activeWindowId, setActiveWindowIdState] = useState<string | null>(null);

  // Refs mirror the latest state so the (stable) actions never close over
  // stale values and never need to run side effects inside setState updaters.
  const windowsRef = useRef(windows);
  const activeWindowIdRef = useRef(activeWindowId);
  const zIndexRef = useRef(
    windows.reduce((top, w) => Math.max(top, w.zIndex), WINDOW_DEFAULTS.INITIAL_Z_INDEX)
  );
  const flashTimersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const commitWindows = useCallback((updater: (prev: WindowState[]) => WindowState[]) => {
    setWindows(prev => {
      const next = updater(prev);
      windowsRef.current = next;
      return next;
    });
  }, []);

  const setActiveWindowId = useCallback((id: string | null) => {
    activeWindowIdRef.current = id;
    setActiveWindowIdState(id);
  }, []);

  // If nothing is active but visible windows exist (e.g. after restore),
  // focus the top one. Minimized windows are skipped - the old version
  // re-activated a window the user had just minimized (#80).
  useEffect(() => {
    if (activeWindowId) return;
    const visible = windows.filter(w => !w.isMinimized);
    if (visible.length === 0) return;
    const topWindow = visible.reduce((top, current) =>
      current.zIndex > top.zIndex ? current : top
    );
    setActiveWindowId(topWindow.id);
  }, [activeWindowId, windows, setActiveWindowId]);

  // Persist windows to localStorage, debounced (#80): focus/drag bursts used
  // to serialize the entire window list synchronously on every change.
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flushPersist = useCallback(() => {
    if (persistTimerRef.current) {
      clearTimeout(persistTimerRef.current);
      persistTimerRef.current = null;
    }
    const windowsToSave = windowsRef.current.map(
      ({
        component: _component,
        onOpen: _onOpen,
        onClose: _onClose,
        onFocus: _onFocus,
        badge: _badge,
        progress: _progress,
        isFlashing: _isFlashing,
        ...rest
      }) => rest
    );
    storage.local.setItem(storage.key('open_windows'), JSON.stringify(windowsToSave));
  }, [storage]);

  useEffect(() => {
    windowsRef.current = windows;
    if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    persistTimerRef.current = setTimeout(flushPersist, PERSIST_DEBOUNCE_MS);
  }, [windows, flushPersist]);

  useEffect(() => {
    if (!canUseDOM) return;
    window.addEventListener('beforeunload', flushPersist);
    const timers = flashTimersRef.current;
    return () => {
      window.removeEventListener('beforeunload', flushPersist);
      flushPersist();
      timers.forEach(timer => clearTimeout(timer));
      timers.clear();
    };
  }, [flushPersist]);

  const focusWindow = useCallback(
    (id: string) => {
      const current = windowsRef.current;
      const win = current.find(w => w.id === id);
      if (!win) return;

      if (activeWindowIdRef.current !== id) {
        // Side effects live OUTSIDE the setState updater (#80): under
        // StrictMode the old implementation invoked onFocus twice.
        win.onFocus?.(id);
        bus.emit({ type: 'window:focus', windowId: id, appId: win.appId });
        const newZIndex =
          Math.max(...current.map(w => w.zIndex), WINDOW_DEFAULTS.INITIAL_Z_INDEX) + 1;
        zIndexRef.current = newZIndex;
        setActiveWindowId(id);
        commitWindows(prev =>
          prev.map(w =>
            w.id === id ? { ...w, zIndex: newZIndex, isMinimized: false, isFlashing: false } : w
          )
        );
        return;
      }

      if (win.isMinimized) {
        commitWindows(prev =>
          prev.map(w => (w.id === id ? { ...w, isMinimized: false, isFlashing: false } : w))
        );
      }
    },
    [commitWindows, setActiveWindowId, bus]
  );

  const openWindow = useCallback(
    (
      appId: string,
      title: string,
      component: React.ReactNode,
      icon?: string,
      props: WindowProps = {}
    ): string => {
      if (props.singleton) {
        const existing = windowsRef.current.find(w => w.appId === appId);
        if (existing) {
          focusWindow(existing.id);
          return existing.id;
        }
      }

      // Date.now() collides when several windows open in the same millisecond
      // (multi-select Enter, restore bursts) - #81.
      const id =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

      const minWidth = props.minWidth ?? WINDOW_DEFAULTS.MIN_WIDTH;
      const minHeight = props.minHeight ?? WINDOW_DEFAULTS.MIN_HEIGHT;
      const windowWidth = Math.max(props.width || WINDOW_DEFAULTS.WIDTH, minWidth);
      const windowHeight = Math.max(props.height || WINDOW_DEFAULTS.HEIGHT, minHeight);
      const screenWidth = canUseDOM ? window.innerWidth : 1280;
      const screenHeight = canUseDOM
        ? Math.max(window.innerHeight - 30, WINDOW_DEFAULTS.MIN_HEIGHT)
        : 720;

      const maxLeft = Math.max(0, screenWidth - windowWidth);
      const maxTop = Math.max(0, screenHeight - windowHeight);
      const centeredLeft = Math.max(0, (screenWidth - windowWidth) / 2);
      const centeredTop = Math.max(0, (screenHeight - windowHeight) / 2);

      const defaultLeft = Math.min(centeredLeft, maxLeft);
      const defaultTop = Math.min(centeredTop, maxTop);

      // componentProps must be passed explicitly; they are what survives a
      // refresh (functions and React elements cannot be serialized).
      const { componentProps, ...windowProps } = props;

      zIndexRef.current += 1;
      const newWindow: WindowState = {
        id,
        appId,
        title,
        component,
        componentProps: (componentProps || {}) as Record<string, unknown>,
        icon,
        props: windowProps,
        isMinimized: false,
        isMaximized: props.isMaximized || false,
        zIndex: zIndexRef.current,
        width: props.width,
        height: props.height,
        left: props.left || defaultLeft,
        top: props.top || defaultTop,
        onClose: props.onClose || null,
        onFocus: props.onFocus || null,
        badge: null,
        progress: null,
        isFlashing: false,
      };

      commitWindows(prev => [...prev, newWindow]);
      setActiveWindowId(id);

      props.onOpen?.(id);
      bus.emit({ type: 'app:launch', appId, windowId: id, title });

      return id;
    },
    [commitWindows, focusWindow, setActiveWindowId, bus]
  );

  const closeWindow = useCallback(
    (id: string) => {
      const current = windowsRef.current;
      const win = current.find(w => w.id === id);
      if (!win) return;
      win.onClose?.(id);

      const timer = flashTimersRef.current.get(id);
      if (timer) {
        clearTimeout(timer);
        flashTimersRef.current.delete(id);
      }

      const newWindows = current.filter(w => w.id !== id);
      commitWindows(() => newWindows);
      bus.emit({ type: 'app:close', appId: win.appId, windowId: id });
      if (activeWindowIdRef.current === id) {
        if (newWindows.length > 0) {
          const top = newWindows.reduce((a, b) => (a.zIndex > b.zIndex ? a : b));
          setActiveWindowId(top.id);
        } else {
          setActiveWindowId(null);
        }
      }
    },
    [commitWindows, setActiveWindowId, bus]
  );

  const minimizeWindow = useCallback(
    (id: string) => {
      const win = windowsRef.current.find(w => w.id === id);
      commitWindows(prev => prev.map(w => (w.id === id ? { ...w, isMinimized: true } : w)));
      // Only clear focus if the minimized window WAS the active one (#80).
      if (activeWindowIdRef.current === id) {
        setActiveWindowId(null);
      }
      if (win) bus.emit({ type: 'window:minimize', windowId: id, appId: win.appId });
    },
    [commitWindows, setActiveWindowId, bus]
  );

  const maximizeWindow = useCallback(
    (id: string) => {
      const win = windowsRef.current.find(w => w.id === id);
      commitWindows(prev =>
        prev.map(w => (w.id === id ? { ...w, isMaximized: !w.isMaximized } : w))
      );
      if (win) {
        bus.emit({
          type: win.isMaximized ? 'window:restore' : 'window:maximize',
          windowId: id,
          appId: win.appId,
        });
      }
    },
    [commitWindows, bus]
  );

  const resizeWindow = useCallback(
    (id: string, width: number, height: number) => {
      commitWindows(prev => prev.map(w => (w.id === id ? { ...w, width, height } : w)));
    },
    [commitWindows]
  );

  const moveWindow = useCallback(
    (id: string, left: number, top: number) => {
      commitWindows(prev => prev.map(w => (w.id === id ? { ...w, left, top } : w)));
    },
    [commitWindows]
  );

  const setWindowTitle = useCallback(
    (id: string, title: string) => {
      commitWindows(prev => prev.map(w => (w.id === id ? { ...w, title } : w)));
    },
    [commitWindows]
  );

  const setWindowBadge = useCallback(
    (id: string, badge: string | number | null) => {
      commitWindows(prev => prev.map(w => (w.id === id ? { ...w, badge } : w)));
    },
    [commitWindows]
  );

  const setWindowProgress = useCallback(
    (id: string, progress: number | null) => {
      commitWindows(prev => prev.map(w => (w.id === id ? { ...w, progress } : w)));
    },
    [commitWindows]
  );

  const flashWindow = useCallback(
    (id: string) => {
      // Restart the flash if one is already running; timers are tracked so
      // unmount/close cleans them up (#80).
      const existing = flashTimersRef.current.get(id);
      if (existing) clearTimeout(existing);

      commitWindows(prev => prev.map(w => (w.id === id ? { ...w, isFlashing: true } : w)));
      const timer = setTimeout(() => {
        flashTimersRef.current.delete(id);
        commitWindows(prev => prev.map(w => (w.id === id ? { ...w, isFlashing: false } : w)));
      }, 3000);
      flashTimersRef.current.set(id, timer);
    },
    [commitWindows]
  );

  const actions = useMemo<WindowManagerActions>(() => {
    const base: WindowManagerActions = {
      openWindow,
      closeWindow,
      minimizeWindow,
      maximizeWindow,
      resizeWindow,
      moveWindow,
      focusWindow,
      setWindowTitle,
      setWindowBadge,
      setWindowProgress,
      flashWindow,
    };
    if (!value) return base;
    // Test/advanced override hook: only function overrides belong here.
    const overrides = Object.fromEntries(
      Object.entries(value).filter(([, v]) => typeof v === 'function')
    );
    return { ...base, ...overrides };
  }, [
    openWindow,
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    resizeWindow,
    moveWindow,
    focusWindow,
    setWindowTitle,
    setWindowBadge,
    setWindowProgress,
    flashWindow,
    value,
  ]);

  const effectiveWindows = value?.windows ?? windows;
  const effectiveActiveId =
    value && 'activeWindowId' in value ? (value.activeWindowId ?? null) : activeWindowId;

  return (
    <WindowsContext.Provider value={effectiveWindows}>
      <ActiveWindowIdContext.Provider value={effectiveActiveId}>
        <ActionsContext.Provider value={actions}>{children}</ActionsContext.Provider>
      </ActiveWindowIdContext.Provider>
    </WindowsContext.Provider>
  );
};
