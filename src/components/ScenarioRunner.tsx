/**
 * Scenario runtime (#84).
 *
 * Renders nothing. Subscribes to the event bus (#76), and for every event:
 *   1. appends it to a bounded, persisted event journal;
 *   2. resolves any delayed actions whose #130 schedule just fired;
 *   3. evaluates each trigger whose `on` matches, running its `do` actions when
 *      the `when` condition holds and its once/max budget allows.
 *
 * All progress — flags, journal, per-trigger fire counts, pending delayed
 * actions — is persisted through the per-instance storage handle (namespaced by
 * `scenario.id`), so a save survives refresh and feeds the snapshot `flags`
 * slot (#117). Actions are executed through the shipped actuation primitives
 * (fs/tray/qq/scheduler/sound/modal/window), keeping the engine ignorant of
 * game semantics (PUZZLE-DESIGN axiom 2).
 */
import { useEffect, useRef } from 'react';
import { useXPEventBus } from '../context/EventBusContext';
import { useFileSystem } from '../context/FileSystemContext';
import { useTray } from '../context/TrayContext';
import { useScheduler } from '../context/SchedulerContext';
import { useModal } from '../context/ModalContext';
import { useWindowManagerActions } from '../context/WindowManagerContext';
import { useAppRegistry } from '../context/AppRegistryContext';
import { useStorage } from '../context/StorageContext';
import { APP_REGISTRY, resolveFileOpen } from '../registry/apps';
import { qqStore } from '../apps/QQ/qqStore';
import { playSound } from '../utils/soundManager';
import { isContainerNode, isFileContentNode, type FileNode } from '../types';
import type { XPEvent } from '../events';
import { appendJournal, evaluateCondition, matchOn, type EvalContext } from '../scenario/engine';
import type { Action, FlagValue, Scenario } from '../scenario/types';

/** In-memory + persisted progress for one running scenario. */
interface ScenarioState {
  flags: Record<string, FlagValue>;
  journal: XPEvent[];
  /** Fire counts keyed by trigger index (or explicit id). */
  fires: Record<string, number>;
  /** Delayed actions awaiting their schedule id's `time:fire`. */
  pending: Record<string, Action[]>;
}

/**
 * Canonical (un-prefixed) storage short-keys. One scenario runs per instance; a
 * stored `id` marker lets us wipe progress when the author swaps `scenario.id`.
 * `flags` is the public save spine — {@link SCENARIO_FLAGS_KEY} is read by the
 * snapshot code in XPBridge (#117).
 */
const SCENARIO_ID_KEY = 'scenario_id';
export const SCENARIO_FLAGS_KEY = 'scenario_flags';
const SCENARIO_JOURNAL_KEY = 'scenario_journal';
const SCENARIO_FIRES_KEY = 'scenario_fires';
const SCENARIO_PENDING_KEY = 'scenario_pending';

const stateKeys = (key: (short: string) => string): Record<keyof ScenarioState, string> => ({
  flags: key(SCENARIO_FLAGS_KEY),
  journal: key(SCENARIO_JOURNAL_KEY),
  fires: key(SCENARIO_FIRES_KEY),
  pending: key(SCENARIO_PENDING_KEY),
});

const JOURNAL_CAP = 500;

export const ScenarioRunner: React.FC<{ scenario?: Scenario }> = ({ scenario }) => {
  const bus = useXPEventBus();
  const { getFile, createFile, deleteFile, deleteFolder, updateFile, unlockNode } = useFileSystem();
  const { notify } = useTray();
  const { schedule } = useScheduler();
  const { dialog } = useModal();
  const { openWindow } = useWindowManagerActions();
  const { registry } = useAppRegistry();
  const storage = useStorage();

  // Persisted progress lives in a ref (we render nothing and want synchronous
  // reads/writes inside the bus handler), lazily hydrated once from storage.
  const stateRef = useRef<ScenarioState | null>(null);
  if (scenario && stateRef.current === null) {
    const keys = stateKeys(storage.key);
    const read = <T,>(k: string, fallback: T): T => {
      try {
        const raw = storage.local.getItem(k);
        return raw ? (JSON.parse(raw) as T) : fallback;
      } catch {
        return fallback;
      }
    };
    // A different scenario.id than last time = a fresh story: ignore stale save.
    const fresh = storage.local.getItem(storage.key(SCENARIO_ID_KEY)) !== scenario.id;
    stateRef.current = {
      flags: fresh ? { ...(scenario.initialFlags ?? {}) } : read(keys.flags, { ...(scenario.initialFlags ?? {}) }),
      journal: fresh ? [] : read<XPEvent[]>(keys.journal, []),
      fires: fresh ? {} : read<Record<string, number>>(keys.fires, {}),
      pending: fresh ? {} : read<Record<string, Action[]>>(keys.pending, {}),
    };
  }

  // A ref-backed handler so we subscribe once but always see the latest context
  // functions (mirrors XPEventBridge). Rebuilt every render.
  const handlerRef = useRef<(event: XPEvent) => void>(() => {});
  handlerRef.current = (event: XPEvent) => {
    const state = stateRef.current;
    if (!scenario || !state) return;
    const keys = stateKeys(storage.key);
    const persist = <K extends keyof ScenarioState>(field: K) => {
      try {
        storage.local.setItem(keys[field], JSON.stringify(state[field]));
      } catch (e) {
        console.warn(`[windows-xp] scenario: failed to persist ${field}`, e);
      }
    };

    // 1. Record the event.
    state.journal = appendJournal(state.journal, event, JOURNAL_CAP);
    persist('journal');

    const fsPredicates: EvalContext['fs'] = {
      exists: path => getFile(path) !== null,
      unlocked: path => {
        const node = getFile(path);
        return node !== null && !node.locked;
      },
      content: path => {
        const node = getFile(path);
        return node && isFileContentNode(node) ? (node.content ?? null) : null;
      },
    };

    const runActions = (actions: Action[]) => {
      for (const action of actions) runAction(action);
    };

    const runAction = (action: Action) => {
      if ('setFlag' in action) {
        state.flags[action.setFlag] = action.value ?? true;
        persist('flags');
      } else if ('incFlag' in action) {
        const cur = state.flags[action.incFlag];
        state.flags[action.incFlag] = (typeof cur === 'number' ? cur : 0) + (action.by ?? 1);
        persist('flags');
      } else if ('unlock' in action) {
        unlockNode(action.unlock);
      } else if ('addFile' in action) {
        const { path, node = {} } = action.addFile;
        const name = path[path.length - 1];
        if (!name) return;
        const { type = 'file', name: _n, ...rest } = node as Partial<FileNode> & {
          type?: 'file' | 'folder';
        };
        void _n;
        createFile(path.slice(0, -1), name, type, rest);
      } else if ('removeFile' in action) {
        const name = action.removeFile[action.removeFile.length - 1];
        if (!name) return;
        const parent = action.removeFile.slice(0, -1);
        const node = getFile(action.removeFile);
        if (node && isContainerNode(node)) deleteFolder(parent, name);
        else deleteFile(parent, name);
      } else if ('writeFile' in action) {
        updateFile(action.writeFile.path, { content: action.writeFile.content });
      } else if ('notify' in action) {
        notify(action.notify);
      } else if ('qqMessage' in action) {
        if (!qqStore.receiveMessage(action.qqMessage.buddyId, action.qqMessage.text)) {
          console.warn(
            `[windows-xp] scenario qqMessage: no buddy "${action.qqMessage.buddyId}" (open QQ / loadProfile first)`
          );
        }
      } else if ('qqOnline' in action) {
        qqStore.bringOnline(action.qqOnline, { announce: true, runScript: true });
      } else if ('openApp' in action) {
        const def = registry[action.openApp.appId] ?? APP_REGISTRY[action.openApp.appId];
        if (!def) {
          console.warn(`[windows-xp] scenario openApp: unknown appId "${action.openApp.appId}"`);
          return;
        }
        const props = action.openApp.props ?? {};
        openWindow(action.openApp.appId, def.name ?? action.openApp.appId, def.restore(props), def.icon, {
          ...(def.window ?? {}),
          componentProps: props,
        });
      } else if ('openFile' in action) {
        const node = getFile(action.openFile);
        if (!node) return;
        const key = action.openFile[action.openFile.length - 1] ?? node.name;
        const resolved = resolveFileOpen(key, node);
        if (!resolved) return;
        openWindow(resolved.appId, node.name, resolved.component, resolved.icon, {
          ...resolved.windowProps,
          sourcePath: action.openFile,
        });
      } else if ('playSound' in action) {
        playSound(action.playSound as Parameters<typeof playSound>[0]);
      } else if ('emit' in action) {
        bus.emit(action.emit);
      } else if ('alert' in action) {
        void dialog.alert({ title: action.alert.title, message: action.alert.message, type: 'info' });
      } else if ('after' in action) {
        const id = schedule({ delayMs: action.after.ms });
        state.pending[id] = action.after.do;
        persist('pending');
      }
    };

    // 2. Resolve any delayed actions whose schedule just fired.
    if (event.type === 'time:fire') {
      const due = state.pending[event.id];
      if (due) {
        delete state.pending[event.id];
        persist('pending');
        runActions(due);
      }
    }

    // 3. Evaluate triggers.
    scenario.triggers.forEach((trigger, index) => {
      if (!matchOn(trigger.on, event.type)) return;
      const fireKey = trigger.id ?? String(index);
      const count = state.fires[fireKey] ?? 0;
      if (trigger.once && count >= 1) return;
      if (trigger.max !== undefined && count >= trigger.max) return;

      const ctx: EvalContext = { flags: state.flags, event, journal: state.journal, fs: fsPredicates };
      if (!evaluateCondition(trigger.when, ctx)) return;

      state.fires[fireKey] = count + 1;
      persist('fires');
      runActions(trigger.do);
    });
  };

  // On (re)start, stamp the scenario id and persist the seeded flags so a fresh
  // save is snapshot-visible even before the first mutating action.
  useEffect(() => {
    if (!scenario || !stateRef.current) return;
    const keys = stateKeys(storage.key);
    try {
      if (storage.local.getItem(storage.key(SCENARIO_ID_KEY)) !== scenario.id) {
        storage.local.setItem(storage.key(SCENARIO_ID_KEY), scenario.id);
        storage.local.setItem(keys.flags, JSON.stringify(stateRef.current.flags));
        storage.local.setItem(keys.journal, JSON.stringify(stateRef.current.journal));
        storage.local.setItem(keys.fires, JSON.stringify(stateRef.current.fires));
        storage.local.setItem(keys.pending, JSON.stringify(stateRef.current.pending));
      }
    } catch {
      /* non-fatal */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario?.id]);

  // Subscribe once; the ref-backed handler always sees the latest closures.
  useEffect(() => {
    if (!scenario) return undefined;
    return bus.subscribe(event => handlerRef.current(event));
  }, [bus, scenario]);

  return null;
};

export default ScenarioRunner;
