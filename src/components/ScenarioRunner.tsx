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
import { useNotes } from '../context/NotesContext';
import { useWindowManagerActions } from '../context/WindowManagerContext';
import { useAppRegistry } from '../context/AppRegistryContext';
import { useStorage } from '../context/StorageContext';
import { APP_REGISTRY, resolveFileOpen } from '../registry/apps';
import { qqStore } from '../apps/QQ/qqStore';
import { playSound } from '../utils/soundManager';
import { isContainerNode, isFileContentNode, type FileNode } from '../types';
import type { XPEvent } from '../events';
import { useCulture } from '../context/CultureContext';
import {
  appendJournal,
  collectContentContainsPaths,
  evaluateCondition,
  matchOn,
  type EvalContext,
} from '../scenario/engine';
import { useContentPacks } from '../context/ContentPackContext';
import { validateScenario } from '../scenario/validate';
import { pickText } from '../scenario/strings';
import { useOSPackage } from '../os/OSPackageContext';
import {
  buildTape,
  beatIndex,
  seekResult,
  fsTreeToSolveNodes,
  type RehearsalTape,
} from '../scenario/rehearsal';
import { traceCondition, type ConditionTrace } from '../scenario/trace';
import {
  hasTraceListeners,
  publishTrace,
  type FlagChange,
  type SkipReason,
  type TriggerReport,
} from '../devtools/traceChannel';
import {
  registerRehearsalController,
  publishRehearsalState,
  type RehearsalController,
  type RehearsalState,
} from '../devtools/rehearsalChannel';
import type { Action, FlagValue, Scenario } from '../scenario/types';
import { readAppSetting } from '../hooks/useAppSettings';

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
  const {
    getFile,
    createFile,
    deleteFile,
    deleteFolder,
    updateFile,
    unlockNode,
    getFsSnapshot,
    applyFsSnapshotInMemory,
  } = useFileSystem();
  const { notify } = useTray();
  const { schedule } = useScheduler();
  const { dialog } = useModal();
  const { setNote, removeNote } = useNotes();
  const { cultureKey } = useCulture();
  const { openWindow } = useWindowManagerActions();
  const { registry } = useAppRegistry();
  const storage = useStorage();
  const { resolver } = useContentPacks();
  const os = useOSPackage();

  // Resolved bodies of `contentRef` files a scenario reads via `contentContains`
  // (#241). Populated eagerly below so the condition evaluator can stay
  // synchronous (`fs.content` peeks this map) instead of the whole predicate
  // chain going async.
  const resolvedRefContent = useRef<Map<string, string>>(new Map());

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
      flags: fresh
        ? { ...(scenario.initialFlags ?? {}) }
        : read(keys.flags, { ...(scenario.initialFlags ?? {}) }),
      journal: fresh ? [] : read<XPEvent[]>(keys.journal, []),
      fires: fresh ? {} : read<Record<string, number>>(keys.fires, {}),
      pending: fresh ? {} : read<Record<string, Action[]>>(keys.pending, {}),
    };
  }

  // Monotonic sequence for DevTools reports (#209).
  const seqRef = useRef(0);
  // Re-entrancy depth for flag:change cascades (#207): a flag:change trigger may
  // set another flag, emitting another flag:change. Bounded to catch loops.
  const flagDepthRef = useRef(0);

  // Validate the scenario once per id (#208). Errors → don't run it (a
  // half-applied bad script is worse than an inert one); warnings → run but
  // surface. Author-facing, so the messages stay English (console).
  const validRef = useRef<{ id: string; ok: boolean } | null>(null);
  if (scenario && validRef.current?.id !== scenario.id) {
    const { ok, errors, warnings } = validateScenario(scenario);
    validRef.current = { id: scenario.id, ok };
    if (errors.length) {
      console.error(
        `[windows-xp] scenario "${scenario.id}" is invalid — not running:\n- ${errors.join('\n- ')}`
      );
    }
    if (warnings.length) {
      console.warn(`[windows-xp] scenario "${scenario.id}" warnings:\n- ${warnings.join('\n- ')}`);
    }
  }

  const getEvalFs = (): EvalContext['fs'] => ({
    exists: path => getFile(path) !== null,
    unlocked: path => {
      const node = getFile(path);
      return node !== null && !node.locked;
    },
    content: path => {
      const node = getFile(path);
      if (!node || !isFileContentNode(node)) return null;
      if (node.content !== undefined) return node.content;
      return resolvedRefContent.current.get(path.join('/')) ?? null;
    },
  });

  // A ref-backed handler so we subscribe once but always see the latest context
  // functions (mirrors XPEventBridge). Rebuilt every render.
  const handlerRef = useRef<(event: XPEvent) => void>(() => {});
  handlerRef.current = (event: XPEvent) => {
    const state = stateRef.current;
    if (!scenario || !state || validRef.current?.ok === false) return;
    const keys = stateKeys(storage.key);

    // DevTools tracing (#209): only build the extra evaluation trace + flag-change
    // log when a panel is actually listening on this instance, so production pays
    // nothing. `traceTrigger`/`traceFlag` capture attribution as actions run.
    const tracing = hasTraceListeners(storage.prefix);
    const changes: FlagChange[] = [];
    let currentTriggerId: string | null = null;
    const traceFlag = (flag: string, value: FlagValue) => {
      if (tracing) changes.push({ flag, value, by: currentTriggerId ?? '(delayed)' });
    };

    // Announce a real flag change (#207) so `on: 'flag:change'` triggers can fire
    // on progress itself. Emitted on the bus (visible to onEvent/DevTools) and
    // re-entrant into this handler; a depth guard stops a runaway cascade.
    const FLAG_CASCADE_LIMIT = 30;
    const emitFlagChange = (flag: string, value: FlagValue) => {
      if (flagDepthRef.current >= FLAG_CASCADE_LIMIT) {
        console.warn(
          `[windows-xp] scenario "${scenario.id}": flag:change cascade exceeded ${FLAG_CASCADE_LIMIT} (flag "${flag}") — stopping to avoid a loop.`
        );
        return;
      }
      flagDepthRef.current += 1;
      try {
        bus.emit({ type: 'flag:change', flag, value });
      } finally {
        flagDepthRef.current -= 1;
      }
    };
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

    const fsPredicates = getEvalFs();

    const runActions = (actions: Action[]) => {
      for (const action of actions) runAction(action);
    };

    // Resolve a beat's literal-or-key against the scenario string table for the
    // active locale (#207): `key` wins over the inline literal when present. The
    // locale is the active culture id (which tracks the desktop language), not
    // `i18n.language` — the desktop's isolated i18n instance isn't the one the
    // language prop drives.
    const text = (literal: string | undefined, key: string | undefined): string | undefined =>
      pickText(scenario.strings, cultureKey, literal, key);

    const runAction = (action: Action) => {
      if ('setFlag' in action) {
        const prev = state.flags[action.setFlag];
        const next = action.value ?? true;
        state.flags[action.setFlag] = next;
        persist('flags');
        traceFlag(action.setFlag, next);
        if (prev !== next) emitFlagChange(action.setFlag, next);
      } else if ('incFlag' in action) {
        const prev = state.flags[action.incFlag];
        const next = (typeof prev === 'number' ? prev : 0) + (action.by ?? 1);
        state.flags[action.incFlag] = next;
        persist('flags');
        traceFlag(action.incFlag, next);
        if (prev !== next) emitFlagChange(action.incFlag, next);
      } else if ('unlock' in action) {
        unlockNode(action.unlock);
      } else if ('addFile' in action) {
        const { path, node = {} } = action.addFile;
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
        // Localize the file body (#207): a `contentKey` resolves against the
        // string table for the active locale, overriding any inline content.
        if (action.addFile.contentKey) {
          (rest as { content?: string }).content = text(undefined, action.addFile.contentKey);
        }
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
        const n = action.notify;
        notify({ ...n, title: text(n.title, n.titleKey) ?? '', body: text(n.body, n.bodyKey) });
      } else if ('qqMessage' in action) {
        const body = text(action.qqMessage.text, action.qqMessage.textKey) ?? '';
        if (!qqStore.receiveMessage(action.qqMessage.buddyId, body)) {
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
        openWindow(
          action.openApp.appId,
          def.name ?? action.openApp.appId,
          def.restore(props),
          def.icon,
          {
            ...(def.window ?? {}),
            componentProps: props,
          }
        );
      } else if ('openFile' in action) {
        const node = getFile(action.openFile);
        if (!node) return;
        const key = action.openFile[action.openFile.length - 1] ?? node.name;
        const resolved = resolveFileOpen(key, node, os.appRoles, registry);
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
        void dialog.alert({
          title: text(action.alert.title, action.alert.titleKey) ?? '',
          message: text(action.alert.message, action.alert.messageKey) ?? '',
          type: 'info',
        });
      } else if ('note' in action) {
        const n = action.note;
        setNote({
          ...n,
          title: text(n.title, n.titleKey),
          content: text(n.content, n.contentKey) ?? '',
        });
      } else if ('removeNote' in action) {
        removeNote(action.removeNote);
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
    const reports: TriggerReport[] = [];
    scenario.triggers.forEach((trigger, index) => {
      const fireKey = trigger.id ?? String(index);
      const count = state.fires[fireKey] ?? 0;

      if (!matchOn(trigger.on, event.type)) {
        if (tracing) {
          reports.push({
            id: fireKey,
            index,
            on: trigger.on,
            matchedOn: false,
            fired: false,
            fireCount: count,
          });
        }
        return;
      }

      // Budget gates take precedence over `when` (matching the original order).
      let skip: SkipReason | undefined;
      if (trigger.once && count >= 1) skip = 'once';
      else if (trigger.max !== undefined && count >= trigger.max) skip = 'max';

      const ctx: EvalContext = {
        flags: state.flags,
        event,
        journal: state.journal,
        fs: fsPredicates,
        appSettings: {
          get: (appId, key) => readAppSetting(storage.local, storage.key, appId, key),
        },
      };
      let whenTrace: ConditionTrace | undefined;
      if (!skip) {
        if (!evaluateCondition(trigger.when, ctx)) skip = 'when';
        if (tracing) whenTrace = traceCondition(trigger.when, ctx);
      }
      const willFire = skip === undefined;

      if (tracing) {
        reports.push({
          id: fireKey,
          index,
          on: trigger.on,
          matchedOn: true,
          when: whenTrace,
          fired: willFire,
          skip,
          fireCount: count,
        });
      }

      if (!willFire) return;
      currentTriggerId = fireKey;
      state.fires[fireKey] = count + 1;
      persist('fires');
      runActions(trigger.do);
      currentTriggerId = null;
    });

    // 4. Report this event's evaluation to any DevTools panel (#209).
    if (tracing) {
      seqRef.current += 1;
      publishTrace(storage.prefix, {
        seq: seqRef.current,
        event,
        triggers: reports,
        flags: { ...state.flags },
        changes,
      });
    }
  };

  // ── Rehearsal / deterministic seek (#207) ────────────────────────────────
  // The walkthrough tape (built once per scenario id) and the rehearsal cursor.
  const tapeRef = useRef<{ id: string; tape: RehearsalTape } | null>(null);
  if (scenario && tapeRef.current?.id !== scenario.id) {
    tapeRef.current = { id: scenario.id, tape: buildTape(scenario.rehearsal) };
  }
  // Non-null while rehearsing: the baseline FS + the live save to restore on exit.
  const rehearsalRef = useRef<{
    baselineFs: { root: FileNode };
    saved: ScenarioState;
    index: number;
  } | null>(null);

  // A ref-backed controller so we register once but always call the latest
  // closures (mirrors handlerRef). Rebuilt every render.
  const seekRef = useRef<RehearsalController>({
    seekTo: () => false,
    seekToIndex: () => {},
    stepBack: () => {},
    stepForward: () => {},
    exitRehearsal: () => {},
    getState: () => ({ active: false, index: -1, length: 0, beats: [] }),
    setFlag: () => false,
    getDebugState: () => ({
      scenarioId: null,
      flags: {},
      fires: {},
      journalLength: 0,
      pending: [],
      rehearsal: { active: false, index: -1, length: 0, beats: [] },
      triggers: [],
    }),
  });
  seekRef.current = (() => {
    const persistAll = () => {
      const st = stateRef.current;
      if (!st) return;
      const keys = stateKeys(storage.key);
      (['flags', 'journal', 'fires', 'pending'] as const).forEach(f => {
        try {
          storage.local.setItem(keys[f], JSON.stringify(st[f]));
        } catch (e) {
          console.warn(`[windows-xp] rehearsal: failed to persist ${f}`, e);
        }
      });
    };

    // Replay only the filesystem-shaped actions of a solved prefix onto the live
    // desktop; observation actions (notify/qq/sound/…) are intentionally skipped
    // — that is how seeking avoids the observer effect.
    const applyFsAction = (action: Action) => {
      if ('unlock' in action) {
        unlockNode(action.unlock);
      } else if ('addFile' in action) {
        const { path, node = {} } = action.addFile;
        const name = path[path.length - 1];
        if (!name) return;
        const {
          type = 'file',
          name: _n,
          ...rest
        } = node as Partial<FileNode> & { type?: 'file' | 'folder' };
        void _n;
        if (action.addFile.contentKey) {
          (rest as { content?: string }).content = pickText(
            scenario?.strings,
            cultureKey,
            undefined,
            action.addFile.contentKey
          );
        }
        createFile(path.slice(0, -1), name, type, rest);
      } else if ('writeFile' in action) {
        updateFile(action.writeFile.path, { content: action.writeFile.content });
      } else if ('removeFile' in action) {
        const name = action.removeFile[action.removeFile.length - 1];
        if (!name) return;
        const parent = action.removeFile.slice(0, -1);
        const node = getFile(action.removeFile);
        if (node && isContainerNode(node)) deleteFolder(parent, name);
        else deleteFile(parent, name);
      }
    };

    const currentTape = (): RehearsalTape => tapeRef.current?.tape ?? { events: [], beats: {} };

    const getState = (): RehearsalState => {
      const tape = currentTape();
      const beats = Object.entries(tape.beats)
        .map(([beat, index]) => ({ beat, index }))
        .sort((a, b) => a.index - b.index);
      return {
        active: rehearsalRef.current !== null,
        index: rehearsalRef.current?.index ?? -1,
        length: tape.events.length,
        beats,
      };
    };

    const getDebugState = (): ReturnType<RehearsalController['getDebugState']> => {
      const st = stateRef.current;
      if (!scenario || !st) {
        return {
          scenarioId: null,
          flags: {},
          fires: {},
          journalLength: 0,
          pending: [],
          rehearsal: getState(),
          triggers: [],
        };
      }
      const lastEvent = st.journal[st.journal.length - 1];
      const ctx: EvalContext = {
        flags: st.flags,
        event: lastEvent,
        journal: st.journal,
        fs: getEvalFs(),
        appSettings: {
          get: (appId, key) => readAppSetting(storage.local, storage.key, appId, key),
        },
      };
      return {
        scenarioId: scenario.id,
        flags: { ...st.flags },
        fires: { ...st.fires },
        journalLength: st.journal.length,
        ...(lastEvent ? { lastEvent } : {}),
        pending: Object.keys(st.pending),
        rehearsal: getState(),
        triggers: scenario.triggers.map((trigger, index) => {
          const id = trigger.id ?? String(index);
          const fireCount = st.fires[id] ?? 0;
          return {
            id,
            index,
            on: trigger.on,
            fireCount,
            budgetAvailable:
              (!trigger.once || fireCount < 1) &&
              (trigger.max === undefined || fireCount < trigger.max),
            when: traceCondition(trigger.when, ctx),
          };
        }),
      };
    };

    const publishState = () => publishRehearsalState(storage.prefix, getState());

    const enterRehearsal = () => {
      const st = stateRef.current;
      if (rehearsalRef.current || !st) return;
      rehearsalRef.current = {
        baselineFs: getFsSnapshot(),
        saved: {
          flags: { ...st.flags },
          journal: st.journal.slice(),
          fires: { ...st.fires },
          pending: { ...st.pending },
        },
        index: -1,
      };
    };

    const seekToIndex = (index: number) => {
      const st = stateRef.current;
      const tape = tapeRef.current?.tape;
      if (!st || !tape || !scenario) return;
      enterRehearsal();
      const baseFs = rehearsalRef.current!.baselineFs;
      const seek = seekResult(scenario, tape, index, fsTreeToSolveNodes(baseFs.root));
      // Install the deterministic engine state.
      st.flags = { ...seek.flags };
      st.journal = seek.journal;
      st.fires = { ...seek.fired };
      st.pending = {};
      persistAll();
      // Rebuild the live FS: restore the baseline, then replay the prefix's FS
      // actions in order (forward or backward seeks both rebuild from baseline).
      applyFsSnapshotInMemory(baseFs);
      seek.actions.forEach(applyFsAction);
      rehearsalRef.current!.index = seek.index;
      publishState();
    };

    return {
      seekTo: (beat: string) => {
        const idx = beatIndex(currentTape(), beat);
        if (idx < 0) return false;
        seekToIndex(idx);
        return true;
      },
      seekToIndex,
      stepBack: () => seekToIndex((rehearsalRef.current?.index ?? -1) - 1),
      stepForward: () => seekToIndex((rehearsalRef.current?.index ?? -1) + 1),
      exitRehearsal: () => {
        const r = rehearsalRef.current;
        const st = stateRef.current;
        if (!r || !st) return;
        st.flags = r.saved.flags;
        st.journal = r.saved.journal;
        st.fires = r.saved.fires;
        st.pending = r.saved.pending;
        persistAll();
        applyFsSnapshotInMemory(r.baselineFs);
        rehearsalRef.current = null;
        publishState();
      },
      getState,
      setFlag: (flag, value) => {
        const st = stateRef.current;
        if (!scenario || !st || validRef.current?.ok === false) return false;
        const previous = st.flags[flag];
        st.flags[flag] = value;
        try {
          storage.local.setItem(stateKeys(storage.key).flags, JSON.stringify(st.flags));
        } catch (e) {
          console.warn('[windows-xp] scenario: failed to persist flags', e);
        }
        if (previous !== value) bus.emit({ type: 'flag:change', flag, value });
        return true;
      },
      getDebugState,
    };
  })();

  // Register the controller once per scenario/instance; the stable wrapper
  // always dispatches to the latest ref-backed closures.
  useEffect(() => {
    if (!scenario) return undefined;
    const stable: RehearsalController = {
      seekTo: b => seekRef.current.seekTo(b),
      seekToIndex: i => seekRef.current.seekToIndex(i),
      stepBack: () => seekRef.current.stepBack(),
      stepForward: () => seekRef.current.stepForward(),
      exitRehearsal: () => seekRef.current.exitRehearsal(),
      getState: () => seekRef.current.getState(),
      setFlag: (flag, value) => seekRef.current.setFlag(flag, value),
      getDebugState: () => seekRef.current.getDebugState(),
    };
    return registerRehearsalController(storage.prefix, stable);
  }, [scenario, storage.prefix]);

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

  // Eagerly resolve the `contentRef` bodies of files a scenario gates on via
  // `contentContains` (#241), so those predicates can match referenced content
  // without turning the (synchronous) condition evaluator async. Only the files
  // actually read this way are loaded — not every contentRef in the FS.
  useEffect(() => {
    if (!scenario) return undefined;
    let cancelled = false;
    for (const path of collectContentContainsPaths(scenario)) {
      const node = getFile(path);
      if (node && isFileContentNode(node) && node.content === undefined && node.contentRef) {
        resolver.resolveOrNull(node.contentRef).then(text => {
          if (cancelled || text === null) return;
          resolvedRefContent.current.set(path.join('/'), text);
        });
      }
    }
    return () => {
      cancelled = true;
    };
  }, [scenario, resolver, getFile]);

  return null;
};

export default ScenarioRunner;
