import React, { useEffect, useImperativeHandle } from 'react';
import { useWindowManager } from '../context/WindowManagerContext';
import { useFileSystem } from '../context/FileSystemContext';
import { useUserSession } from '../context/UserSessionContext';
import { useModal } from '../context/ModalContext';
import { useTray, type NotifyOptions } from '../context/TrayContext';
import { useXPEventBus } from '../context/EventBusContext';
import { useStorage } from '../context/StorageContext';
import { useScheduler, type ScheduleOptions } from '../context/SchedulerContext';
import { APP_REGISTRY, resolveFileOpen } from '../registry/apps';
import { useAppRegistry } from '../context/AppRegistryContext';
import { isContainerNode, isFileContentNode, type FileNode } from '../types';
import { canUseDOM } from '../utils/storage';
import { saveLanguage, getSavedLanguage } from '../utils/language';
import { XP_SNAPSHOT_VERSION, assertLoadableSnapshot, type XPSnapshot } from '../snapshot';
import { sounds, playSound } from '../utils/soundManager';
import i18n from '../i18n';
import type { XPEvent, XPEventListener } from '../events';
import { qqStore } from '../apps/QQ/qqStore';
import type { QQProfile } from '../data/qq/types';

/** Filesystem actuation from outside the desktop (#115). Paths are absolute. */
export interface XPFsApi {
  /** Read a file node's text content, or null if missing / not a text file. */
  readFile: (path: string[]) => string | null;
  /** Set a file node's content (persists). */
  writeFile: (path: string[], content: string) => void;
  /** Create a file/folder at path. `node.type` defaults to 'file'. */
  createFile: (path: string[], node?: Partial<FileNode>) => void;
  /** Delete the file or folder at path. */
  deleteFile: (path: string[]) => void;
  /** Return the raw node at path, or null. */
  getNode: (path: string[]) => FileNode | null;
  /** Whether a node exists at path. */
  exists: (path: string[]) => boolean;
  /** Persistently clear a node's `locked` flag. */
  unlockNode: (path: string[]) => void;
}

/** Session control (#115). */
export interface XPSessionApi {
  login: (password?: string) => boolean;
  logout: () => void;
  shutdown: () => void;
  restart: () => void;
}

/** Appearance control (#115). */
export interface XPAppearanceApi {
  setWallpaper: (idOrUrl: string) => void;
  setLanguage: (lang: string) => void;
}

/** A window as seen from outside the desktop. */
export interface XPWindowInfo {
  id: string;
  appId: string;
  title: string;
  isMinimized: boolean;
  isMaximized: boolean;
}

/** Window introspection + control (#115). */
export interface XPWindowsApi {
  list: () => XPWindowInfo[];
  focus: (id: string) => void;
  minimize: (id: string) => void;
  maximize: (id: string) => void;
  restore: (id: string) => void;
}

/**
 * QQ Messenger actuation (#119) — lets a scenario/host drive the buddy chat:
 * open the client (or a specific chat), have a buddy come online, or push an
 * incoming message. Content otherwise flows from the culture package's `qq`
 * profile; `loadProfile` replaces it at runtime.
 */
export interface XPQQApi {
  /** Open the QQ client; with `buddyId`, also open (or focus) that chat window. */
  open: (buddyId?: string) => string | null;
  /** Deliver an incoming message from a buddy (typing/queueing handled by QQ). */
  sendMessage: (buddyId: string, text: string) => void;
  /** Bring a buddy online now (knock sound + tray blink + "上线了" balloon). */
  bringOnline: (buddyId: string) => void;
  /** Replace the live QQ profile (buddies/groups/scripts) and restart the session. */
  loadProfile: (profile: QQProfile) => void;
}

/**
 * Imperative handle exposed via `ref` on <WindowsXP/> (#76, extended in #115):
 * lets the host drive the desktop programmatically (demos, tests, scenario
 * scripting). The five original top-level methods are kept for backward
 * compatibility; new capabilities are grouped by domain.
 */
export interface XPHandle {
  /** Open a registered app by id, optionally passing component props. */
  openApp: (appId: string, props?: Record<string, unknown>) => string | null;
  /** Open a filesystem node by absolute path (resolves the right app). */
  openFile: (path: string[]) => string | null;
  /** Close a window by id. */
  closeWindow: (id: string) => void;
  /** Show an XP dialog. */
  showAlert: (title: string, message: string) => void;
  /** Clear all persisted desktop state (localStorage + IndexedDB) and reload. */
  reset: () => void;
  /** Filesystem actuation. */
  fs: XPFsApi;
  /** Session control. */
  session: XPSessionApi;
  /** Appearance control. */
  appearance: XPAppearanceApi;
  /** Window introspection + control. */
  windows: XPWindowsApi;
  /** QQ Messenger actuation (#119). */
  qq: XPQQApi;
  /** Play a named XP system sound. */
  sound: { play: (name: string) => void };
  /** Pop an XP tray balloon notification (#118). Returns the notification id. */
  notify: (options: NotifyOptions) => string;
  /** Inject an event onto the same bus `onEvent` and scenario triggers read. */
  emit: (event: XPEvent) => void;
  /**
   * Schedule an event to fire after a delay or at a wall-clock deadline (#130).
   * Pending schedules persist per instance and fire on next load if the
   * deadline passed while the page was closed. Returns the schedule id.
   */
  schedule: (options: ScheduleOptions) => string;
  /** Cancel a pending schedule by id (#130). */
  cancelSchedule: (id: string) => void;
  /** Capture the full desktop state as a portable, versioned snapshot (#117). */
  getSnapshot: () => XPSnapshot;
  /**
   * Replace this instance's state with a snapshot and reload to rehydrate.
   * Throws {@link XPSnapshotVersionError} for a missing/too-new version.
   */
  loadSnapshot: (snapshot: XPSnapshot) => Promise<void>;
}

/** Subscribes the host's onEvent callback to the bus. Renders nothing. */
export const XPEventBridge: React.FC<{ onEvent?: XPEventListener }> = ({ onEvent }) => {
  const bus = useXPEventBus();
  const ref = React.useRef(onEvent);
  ref.current = onEvent;
  useEffect(() => {
    if (!ref.current) return undefined;
    return bus.subscribe(event => ref.current?.(event));
  }, [bus]);
  return null;
};

/** Wires the imperative handle to the live contexts. Renders nothing. */
export const XPImperativeApi = React.forwardRef<XPHandle, { storagePrefix?: string }>(
  function XPImperativeApi(_props, ref) {
    const { openWindow, closeWindow, focusWindow, minimizeWindow, maximizeWindow, windows } =
      useWindowManager();
    const {
      fs,
      getFile,
      updateFile,
      createFile: fsCreateFile,
      deleteFile: fsDeleteFile,
      deleteFolder,
      unlockNode,
      getFsSnapshot,
      getRecycleBinItems,
      loadFsSnapshot,
    } = useFileSystem();
    const { login, logout, setWallpaper, wallpaper } = useUserSession();
    const { dialog } = useModal();
    const { notify } = useTray();
    const { registry } = useAppRegistry();
    const bus = useXPEventBus();
    const storage = useStorage();
    const { schedule, cancelSchedule } = useScheduler();

    useImperativeHandle(
      ref,
      (): XPHandle => {
        const powerOff = (state: 'shutdown' | 'restart') => {
          storage.local.removeItem(storage.key('open_windows'));
          storage.local.setItem(storage.key('power_state'), state);
          bus.emit({ type: 'session:shutdown', mode: state });
          sounds.shutdown();
          if (canUseDOM) setTimeout(() => window.location.reload(), 600);
        };

        return {
          openApp: (appId, props = {}) => {
            const def = registry[appId] ?? APP_REGISTRY[appId];
            if (!def) {
              console.warn(`[windows-xp] openApp: unknown appId "${appId}"`);
              return null;
            }
            return openWindow(appId, def.name ?? appId, def.restore(props), def.icon, {
              ...(def.window ?? {}),
              componentProps: props,
            });
          },
          openFile: path => {
            const node = getFile(path);
            if (!node) {
              console.warn(`[windows-xp] openFile: no node at ${path.join('/')}`);
              return null;
            }
            const key = path[path.length - 1] ?? node.name;
            const resolved = resolveFileOpen(key, node);
            if (!resolved) return null;
            return openWindow(
              resolved.appId,
              node.name,
              resolved.component,
              resolved.icon,
              resolved.windowProps
            );
          },
          closeWindow,
          showAlert: (title, message) => {
            void dialog.alert({ title, message, type: 'info' });
          },
          reset: () => {
            if (!canUseDOM) return;
            const done = () => window.location.reload();
            // Clear both storage layers for this instance through the storage
            // util (no raw window.localStorage access here), then reload (#163/C).
            storage.clearPrefixedLocal();
            storage.clearAllStorage().then(done, done);
          },

          fs: {
            readFile: path => {
              const node = getFile(path);
              return node && isFileContentNode(node) ? (node.content ?? null) : null;
            },
            writeFile: (path, content) => updateFile(path, { content }),
            createFile: (path, node = {}) => {
              const parent = path.slice(0, -1);
              const name = path[path.length - 1];
              if (!name) return;
              const { type = 'file', name: _n, ...rest } = node as Partial<FileNode> & {
                type?: 'file' | 'folder';
              };
              void _n;
              fsCreateFile(parent, name, type, rest);
            },
            deleteFile: path => {
              const parent = path.slice(0, -1);
              const name = path[path.length - 1];
              if (!name) return;
              const node = getFile(path);
              if (node && isContainerNode(node)) deleteFolder(parent, name);
              else fsDeleteFile(parent, name);
            },
            getNode: getFile,
            exists: path => getFile(path) !== null,
            unlockNode,
          },

          session: {
            login: password => login(password ?? ''),
            logout,
            shutdown: () => powerOff('shutdown'),
            restart: () => powerOff('restart'),
          },

          appearance: {
            setWallpaper,
            setLanguage: lang => {
              saveLanguage(lang);
              void i18n.changeLanguage(lang);
            },
          },

          windows: {
            list: () =>
              windows.map(w => ({
                id: w.id,
                appId: w.appId,
                title: w.title,
                isMinimized: w.isMinimized,
                isMaximized: w.isMaximized,
              })),
            focus: focusWindow,
            minimize: minimizeWindow,
            maximize: maximizeWindow,
            restore: focusWindow,
          },

          qq: {
            open: buddyId => {
              const def = registry.QQ ?? APP_REGISTRY.QQ;
              if (!def) {
                console.warn('[windows-xp] qq.open: QQ app is not registered');
                return null;
              }
              const clientId = openWindow('QQ', def.name ?? 'QQ', def.restore({}), def.icon, {
                ...(def.window ?? {}),
                componentProps: {},
              });
              if (buddyId) {
                const existing = windows.find(
                  w =>
                    w.appId === 'QQ' &&
                    (w.componentProps as { buddyId?: string })?.buddyId === buddyId
                );
                if (existing) {
                  focusWindow(existing.id);
                } else {
                  const buddy = qqStore.buddy(buddyId);
                  openWindow(
                    'QQ',
                    buddy ? `与 ${buddy.nickname} 聊天中` : 'QQ',
                    def.restore({ view: 'chat', buddyId }),
                    def.icon,
                    {
                      width: 516,
                      height: 476,
                      resizable: false,
                      componentProps: { view: 'chat', buddyId },
                    }
                  );
                }
                bus.emit({ type: 'qq:open', buddyId });
              }
              return clientId;
            },
            sendMessage: (buddyId, text) => {
              if (!qqStore.receiveMessage(buddyId, text)) {
                console.warn(
                  `[windows-xp] qq.sendMessage: no buddy "${buddyId}" (open QQ / loadProfile first)`
                );
              }
            },
            bringOnline: buddyId =>
              qqStore.bringOnline(buddyId, { announce: true, runScript: true }),
            loadProfile: profile => {
              qqStore.reset();
              qqStore.start(profile);
            },
          },

          sound: { play: name => playSound(name as Parameters<typeof playSound>[0]) },

          notify,

          emit: event => bus.emit(event),

          schedule: options => schedule(options),
          cancelSchedule: id => cancelSchedule(id),

          getSnapshot: (): XPSnapshot => {
            let openWindows: unknown[] = [];
            try {
              const raw = storage.local.getItem(storage.key('open_windows'));
              if (raw) openWindows = JSON.parse(raw);
            } catch (e) {
              console.warn('[windows-xp] getSnapshot: open_windows parse failed', e);
            }
            return {
              version: XP_SNAPSHOT_VERSION,
              fs: getFsSnapshot(),
              recycleBin: getRecycleBinItems(),
              openWindows,
              wallpaper: wallpaper ?? null,
              language: getSavedLanguage(),
              flags: {},
            };
          },

          loadSnapshot: async (snapshot: XPSnapshot) => {
            assertLoadableSnapshot(snapshot);
            await loadFsSnapshot(snapshot.fs, snapshot.recycleBin ?? {});
            storage.local.setItem(
              storage.key('open_windows'),
              JSON.stringify(snapshot.openWindows ?? [])
            );
            if (snapshot.wallpaper) {
              storage.local.setItem(storage.key('wallpaper'), snapshot.wallpaper);
            }
            if (snapshot.language) saveLanguage(snapshot.language);
            if (canUseDOM) window.location.reload();
          },
        };
      },
      [
        openWindow,
        closeWindow,
        focusWindow,
        minimizeWindow,
        maximizeWindow,
        windows,
        getFile,
        updateFile,
        fsCreateFile,
        fsDeleteFile,
        deleteFolder,
        unlockNode,
        getFsSnapshot,
        getRecycleBinItems,
        loadFsSnapshot,
        login,
        logout,
        setWallpaper,
        wallpaper,
        dialog,
        notify,
        registry,
        bus,
        storage,
        schedule,
        cancelSchedule,
      ]
    );

    void fs;
    return null;
  }
);
