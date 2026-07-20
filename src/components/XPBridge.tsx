import React, { useEffect, useImperativeHandle } from 'react';
import { useWindowManager } from '../context/WindowManagerContext';
import { useFileSystem } from '../context/FileSystemContext';
import { useUserSession } from '../context/UserSessionContext';
import { useModal } from '../context/ModalContext';
import { useTray, type NotifyOptions } from '../context/TrayContext';
import { useXPEventBus } from '../context/EventBusContext';
import { useStorage } from '../context/StorageContext';
import { useScheduler, type ScheduleOptions } from '../context/SchedulerContext';
import { useClock, type XPClockApi } from '../context/ClockContext';
import { useRecentDocuments } from '../context/RecentDocumentsContext';
import { usePrintSpooler, type PrintJob } from '../context/PrintSpoolerContext';
import { APP_REGISTRY, resolveFileOpen } from '../registry/apps';
import { useAppRegistry } from '../context/AppRegistryContext';
import { isContainerNode, isFileContentNode, type FileNode } from '../types';
import { canUseDOM } from '../utils/storage';
import { decodeOpenWindows, encodeOpenWindows } from '../utils/windowPersistence';
import { saveLanguage, getSavedLanguage } from '../utils/language';
import { XP_SNAPSHOT_VERSION, assertLoadableSnapshot, type XPSnapshot } from '../snapshot';
import { playSound } from '../utils/soundManager';
import { openExternalUrl } from '../utils/externalLink';
import { serializeOpenPath } from '../utils/deepLink';
import i18n from '../i18n';
import type { XPEvent, XPEventListener } from '../events';
import { qqStore } from '../apps/QQ/qqStore';
import type { QQProfile } from '../data/qq/types';
import { defaultQQProfile } from '../data/qq/defaultProfile';
import { SCENARIO_FLAGS_KEY } from './ScenarioRunner';
import { useLesson } from '../context/LessonContext';
import type { LessonMode } from '../lesson/types';
import {
  getRehearsalController,
  type RehearsalState,
  type ScenarioDebugState,
} from '../devtools/rehearsalChannel';
import type { FlagValue } from '../scenario/types';
import { useCulture } from '../context/CultureContext';
import { usePowerTransition } from '../context/PowerTransitionContext';
import { useOSPackage } from '../os/OSPackageContext';

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
  /** Finish a `reload: 'manual'` power sequence. */
  completePowerTransition: () => void;
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
  /** Deliver a message with QQ typing/queueing; false until the buddy profile is loaded. */
  sendMessage: (buddyId: string, text: string) => boolean;
  /** Whether the live QQ profile currently contains this buddy. */
  hasBuddy: (buddyId: string) => boolean;
  /** Idempotently load the active culture's profile for host-driven rehearsal. */
  ensureProfile: () => void;
  /** Bring a buddy online now (knock sound + tray blink + "上线了" balloon). */
  bringOnline: (buddyId: string) => void;
  /** Replace the live QQ profile (buddies/groups/scripts) and restart the session. */
  loadProfile: (profile: QQProfile) => void;
}

/**
 * Rehearsal / deterministic seek (#207) — the author's iteration-loop unlock.
 * Replays the scenario's canonical walkthrough prefix through the headless
 * solver to jump to any beat's exact state in a second, without replaying events
 * onto the bus (so no external side effects). Requires the scenario to declare a
 * `rehearsal.walkthrough`; the methods no-op / return false otherwise.
 */
export interface XPScenarioApi {
  /** Jump to a named beat's state. Returns false if the beat / walkthrough is unknown. */
  seekTo: (beat: string) => boolean;
  /** Jump to a tape index (clamped; −1 = pristine start). */
  seekToIndex: (index: number) => void;
  /** Step one beat back (re-solve the shorter prefix). */
  stepBack: () => void;
  /** Step one beat forward. */
  stepForward: () => void;
  /** Leave rehearsal and restore the pre-rehearsal live save. */
  exitRehearsal: () => void;
  /** The current rehearsal cursor (active flag, index, tape length, named beats). */
  getState: () => RehearsalState;
  /** Set one flag through the live scenario runtime. Returns false without a scenario. */
  setFlag: (flag: string, value: FlagValue) => boolean;
  /** Inspect live flags, trigger fire budgets, and condition traces. */
  getDebugState: () => ScenarioDebugState;
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
  /**
   * Follow a link out of the fiction to a real URL (#136). New tab by default;
   * pass `{ newTab: false }` to navigate the current tab. Emits `link:external`.
   */
  openExternal: (url: string, opts?: { newTab?: boolean }) => void;
  /**
   * Build a shareable permalink (`?open=…`) that reproduces `windowId` on a
   * fresh load (#136). Returns null for component-only windows (no source path)
   * or without a DOM.
   */
  getShareUrl: (windowId: string) => string | null;
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
  /** Instance-local virtual system clock (#275). */
  clock: Pick<XPClockApi, 'now' | 'set' | 'advance' | 'reset'>;
  /** Data-driven virtual print spooler (#276). */
  print: {
    addJob: (job: Omit<PrintJob, 'submittedAt'> & { submittedAt?: string }) => void;
    updateJob: (id: string, updates: Partial<PrintJob>) => void;
    removeJob: (id: string) => void;
  };
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
  /**
   * Start a guided lesson by id (#141) in `try` (default), `do`, or `watch`
   * mode. Returns false if no lesson with that id was registered via the
   * `lessons` prop. Emits `lesson:*` events; progress persists per instance.
   */
  startLesson: (lessonId: string, mode?: LessonMode) => boolean;
  /** Stop the running lesson and clear its saved progress (#141). */
  stopLesson: () => void;
  /** Rehearsal / deterministic seek over the scenario's walkthrough (#207). */
  scenario: XPScenarioApi;
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
    // Rehearsal/seek events (#207) are engine-internal provenance: never surface
    // them to the host, so fast-forwarding to a beat can't fire external side
    // effects or pollute host analytics (the observer-effect guard).
    return bus.subscribe(event => {
      if (event.rehearsal) return;
      ref.current?.(event);
    });
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
    const clock = useClock();
    const { entries: recentDocuments } = useRecentDocuments();
    const print = usePrintSpooler();
    const { start: startLesson, stop: stopLesson } = useLesson();
    const { culture } = useCulture();
    const power = usePowerTransition();
    const os = useOSPackage();

    useImperativeHandle(ref, (): XPHandle => {
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
          const resolved = resolveFileOpen(key, node, os.appRoles, registry);
          if (!resolved) return null;
          return openWindow(resolved.appId, node.name, resolved.component, resolved.icon, {
            ...resolved.windowProps,
            sourcePath: path,
          });
        },
        openExternal: (url, opts) => {
          const newTab = opts?.newTab ?? true;
          openExternalUrl(url, newTab);
          bus.emit({ type: 'link:external', url, newTab });
        },
        getShareUrl: windowId => {
          if (!canUseDOM) return null;
          const win = windows.find(w => w.id === windowId);
          const path = win?.props?.sourcePath;
          if (!path || path.length === 0) return null;
          const lang = getSavedLanguage();
          const query = `open=${serializeOpenPath(path)}${lang ? `&lang=${lang}` : ''}`;
          return `${window.location.origin}${window.location.pathname}?${query}`;
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
            const {
              type = 'file',
              name: _n,
              ...rest
            } = node as Partial<FileNode> & {
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
          shutdown: () => power.request('shutdown'),
          restart: () => power.request('restart'),
          completePowerTransition: power.complete,
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
                  buddy ? i18n.t('qq.chatTitle', { nickname: buddy.nickname }) : 'QQ',
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
            const delivered = qqStore.receiveMessage(buddyId, text) !== null;
            if (!delivered) {
              console.warn(
                `[windows-xp] qq.sendMessage: no buddy "${buddyId}" (open QQ / loadProfile first)`
              );
            }
            return delivered;
          },
          hasBuddy: buddyId => qqStore.buddy(buddyId) !== undefined,
          ensureProfile: () => qqStore.start(culture.qq ?? defaultQQProfile),
          bringOnline: buddyId => qqStore.bringOnline(buddyId, { announce: true, runScript: true }),
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

        clock: {
          now: clock.now,
          set: clock.set,
          advance: clock.advance,
          reset: clock.reset,
        },
        print: {
          addJob: print.addJob,
          updateJob: print.updateJob,
          removeJob: print.removeJob,
        },

        startLesson: (lessonId, lessonMode) => startLesson(lessonId, lessonMode),
        stopLesson,

        scenario: {
          seekTo: beat => getRehearsalController(storage.prefix)?.seekTo(beat) ?? false,
          seekToIndex: index => getRehearsalController(storage.prefix)?.seekToIndex(index),
          stepBack: () => getRehearsalController(storage.prefix)?.stepBack(),
          stepForward: () => getRehearsalController(storage.prefix)?.stepForward(),
          exitRehearsal: () => getRehearsalController(storage.prefix)?.exitRehearsal(),
          getState: () =>
            getRehearsalController(storage.prefix)?.getState() ?? {
              active: false,
              index: -1,
              length: 0,
              beats: [],
            },
          setFlag: (flag, value) =>
            getRehearsalController(storage.prefix)?.setFlag(flag, value) ?? false,
          getDebugState: () =>
            getRehearsalController(storage.prefix)?.getDebugState() ?? {
              scenarioId: null,
              flags: {},
              fires: {},
              journalLength: 0,
              pending: [],
              rehearsal: { active: false, index: -1, length: 0, beats: [] },
              triggers: [],
            },
        },

        getSnapshot: (): XPSnapshot => {
          const openWindows = decodeOpenWindows(storage.local.getItem(storage.key('open_windows')));
          // Scenario progress (#84) lives under the canonical flags key.
          let flags: Record<string, unknown> = {};
          let mediaSessions: Record<string, { index: number; position: number }> = {};
          let evidenceReports: Record<string, unknown> = {};
          try {
            const raw = storage.local.getItem(storage.key(SCENARIO_FLAGS_KEY));
            if (raw) flags = JSON.parse(raw);
          } catch (e) {
            console.warn('[windows-xp] getSnapshot: scenario flags parse failed', e);
          }
          try {
            const raw = storage.local.getItem(storage.key('wmp_sessions'));
            if (raw) mediaSessions = JSON.parse(raw) as typeof mediaSessions;
          } catch (e) {
            console.warn('[windows-xp] getSnapshot: media sessions parse failed', e);
          }
          try {
            const raw = storage.local.getItem(storage.key('evidence_reports'));
            if (raw) evidenceReports = JSON.parse(raw) as typeof evidenceReports;
          } catch (e) {
            console.warn('[windows-xp] getSnapshot: evidence reports parse failed', e);
          }
          return {
            version: XP_SNAPSHOT_VERSION,
            fs: getFsSnapshot(),
            recycleBin: getRecycleBinItems(),
            openWindows,
            wallpaper: wallpaper ?? null,
            language: getSavedLanguage(),
            flags,
            clock: clock.getSnapshot(),
            recentDocuments,
            printJobs: print.jobs,
            mediaSessions,
            evidenceReports,
          };
        },

        loadSnapshot: async (snapshot: XPSnapshot) => {
          assertLoadableSnapshot(snapshot);
          await loadFsSnapshot(snapshot.fs, snapshot.recycleBin ?? {});
          storage.local.setItem(
            storage.key('open_windows'),
            encodeOpenWindows(snapshot.openWindows ?? [])
          );
          if (snapshot.wallpaper) {
            storage.local.setItem(storage.key('wallpaper'), snapshot.wallpaper);
          }
          if (snapshot.flags && Object.keys(snapshot.flags).length > 0) {
            storage.local.setItem(storage.key(SCENARIO_FLAGS_KEY), JSON.stringify(snapshot.flags));
          }
          if (snapshot.language) saveLanguage(snapshot.language);
          if (snapshot.clock) clock.loadSnapshot(snapshot.clock);
          if (snapshot.recentDocuments) {
            storage.local.setItem(
              storage.key('recent_documents'),
              JSON.stringify(snapshot.recentDocuments)
            );
          }
          if (snapshot.printJobs) {
            storage.local.setItem(storage.key('print_jobs'), JSON.stringify(snapshot.printJobs));
          }
          if (snapshot.mediaSessions) {
            storage.local.setItem(
              storage.key('wmp_sessions'),
              JSON.stringify(snapshot.mediaSessions)
            );
          }
          if (snapshot.evidenceReports) {
            storage.local.setItem(
              storage.key('evidence_reports'),
              JSON.stringify(snapshot.evidenceReports)
            );
          }
          if (canUseDOM) window.location.reload();
        },
      };
    }, [
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
      startLesson,
      stopLesson,
      culture,
      clock,
      recentDocuments,
      print,
      power,
      os.appRoles,
    ]);

    void fs;
    return null;
  }
);
