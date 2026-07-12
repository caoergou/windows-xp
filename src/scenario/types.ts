import type { JsonValue } from '../types';
import type { XPEvent } from '../events';

/**
 * Scenario system (#84) — declarative, JSON-authored interactive stories.
 *
 * A scenario is a set of **triggers** ("when this event happens and these
 * conditions hold, run these actions") over the desktop's event bus, plus
 * **flags** (persisted progress state). Authors don't write React: the schema
 * is a thin declarative client over the imperative engine (#115) and the event
 * catalog (#116/#130). Design derivation lives in `docs/PUZZLE-DESIGN.md`.
 */

/** Events the scenario layer reasons over: real desktop events plus two internal ones. */
export type ScenarioEvent =
  | XPEvent
  | { type: 'scenario:start' }
  | { type: 'flag:set'; flag: string; value: JsonValue };

/**
 * Matches an event by `type` (exact, or a trailing `*` glob like `file:*`) and
 * optional exact field equalities (e.g. `{ type: 'file:open', name: 'diary.txt' }`).
 * Array fields (like `path`) compare by value equality.
 */
export interface EventPattern {
  type: string;
  [field: string]: JsonValue;
}

/** A boolean predicate over flags, the event journal, and the current event. */
export interface ScenarioCondition {
  /** All sub-conditions must hold. */
  allOf?: ScenarioCondition[];
  /** At least one sub-condition must hold. */
  anyOf?: ScenarioCondition[];
  /** The sub-condition must NOT hold. */
  not?: ScenarioCondition;
  /** The named flag is truthy. */
  flag?: string;
  /** The named flag strictly equals `value`. */
  flagEquals?: { flag: string; value: JsonValue };
  /** An event matching this pattern has occurred at least once (event-history predicate). */
  happened?: EventPattern;
  /** The count of journal events matching `event` is within [gte, lte]. */
  count?: { event: EventPattern; gte?: number; lte?: number };
  /** The CURRENT triggering event's fields equal these (sugar for pattern fields sans type). */
  match?: Record<string, JsonValue>;
}

/** A single side effect. Multiple keys on one action all run (in a stable order). */
export interface ScenarioAction {
  /** Set a flag (default value `true`), then re-evaluate flag-driven triggers. */
  setFlag?: string | { flag: string; value?: JsonValue };
  /** Persistently clear a node's `locked` flag (path from the desktop root). */
  unlockNode?: string[];
  /** Create a file/folder node at `path` (last segment is its key). */
  addFile?: {
    path: string[];
    type?: 'file' | 'folder';
    name?: string;
    content?: string;
    app?: string;
    icon?: string;
    locked?: boolean;
    password?: string;
  };
  /** Delete the node at `path`. */
  removeFile?: string[];
  /** Pop an XP tray balloon (#118). */
  notify?: { icon?: string; title: string; body?: string; timeout?: number };
  /** Show an XP alert dialog. */
  alert?: { title: string; message: string; type?: 'info' | 'warning' | 'error' };
  /** Deliver an incoming QQ message from a buddy (#119). */
  qqMessage?: { buddyId: string; text: string };
  /** Play a named XP system sound. */
  playSound?: string;
  /** Open a registered app by id. */
  openApp?: string;
  /** Open a filesystem node by path. */
  openFile?: string[];
  /** Inject an event onto the bus (advanced; also visible to other triggers). */
  emit?: XPEvent;
  /** Schedule a `time:fire` (#130). A trigger `on: 'time:fire'` with `match: { id }` reacts. */
  schedule?: { id: string; delayMs?: number; at?: number };
}

/** One rule: when `on` fires and `when` holds, run `actions`. */
export interface ScenarioTrigger {
  /** Stable id (used for `once`/`max` bookkeeping across reloads). */
  id: string;
  /** Event type to listen for: an `XPEvent['type']`, a `type*` glob, `'scenario:start'`, or `'flag:set'`. */
  on: string;
  /** Optional guard evaluated against flags / journal / the current event. */
  when?: ScenarioCondition;
  /** Side effects to run when the trigger fires. */
  actions: ScenarioAction[];
  /** Fire at most once ever (per persisted progress). */
  once?: boolean;
  /** Fire at most this many times ever. */
  max?: number;
}

/** A complete scenario: initial flags + the trigger rules. */
export interface Scenario {
  id?: string;
  /** Initial flag values, applied only on a fresh start (persisted state wins on reload). */
  flags?: Record<string, JsonValue>;
  triggers: ScenarioTrigger[];
}

/** Persisted scenario progress (namespaced by `storagePrefix`). */
export interface ScenarioState {
  flags: Record<string, JsonValue>;
  /** Bounded event history for `happened`/`count` predicates. */
  journal: ScenarioEvent[];
  /** Per-trigger fire counts, for `once`/`max`. */
  fireCounts: Record<string, number>;
}
