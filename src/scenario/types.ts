/**
 * Scenario system — declarative schema (#84).
 *
 * A `Scenario` is authored as plain JSON: story authors describe gating (doors &
 * keys), pushes (scripted QQ/tray/file events), and progress (flags) without
 * writing React. The runtime ({@link ../components/ScenarioRunner}) subscribes to
 * the event bus (#76), evaluates each trigger's `when` condition against world
 * state, and executes its `do` actions through the shipped actuation primitives
 * (#115–#119, #130).
 *
 * Design notes:
 * - The engine observes; the scenario judges (PUZZLE-DESIGN axiom 2). Conditions
 *   read event history + FS + flags; actions never encode game meaning in the core.
 * - Everything here is JSON-serializable — the same shape feeds the snapshot
 *   `flags` slot (#117) and could be hand-written in a `.json` file.
 */
import type { XPEvent, XPEventType } from '../events';

/** A flag value: booleans for gates, numbers for counters, strings for variables. */
export type FlagValue = boolean | number | string;

/** Primitive comparands allowed in payload / flag matching. */
export type Scalar = string | number | boolean;

/**
 * A condition tree evaluated when a trigger fires. Composable with
 * `all`/`any`/`not`; leaf predicates read flags, the triggering event's payload,
 * the persisted event journal, and the filesystem.
 */
export type Condition =
  /** AND — every child must hold. */
  | { all: Condition[] }
  /** OR — at least one child must hold. */
  | { any: Condition[] }
  /** NOT — the child must not hold. */
  | { not: Condition }
  /**
   * Flag predicate. With no comparator, tests truthiness. `eq` compares equality;
   * `gte`/`lte` compare numerically (counters).
   */
  | { flag: string; eq?: FlagValue; gte?: number; lte?: number }
  /**
   * Payload match on the *triggering* event: every listed field must equal the
   * event's field (deep-equal for arrays like `path`).
   */
  | { event: Record<string, Scalar | Scalar[]> }
  /** True if an event of `type` matching `match` has ever happened (event journal). */
  | { happened: { type: XPEventType; match?: Record<string, Scalar | Scalar[]> } }
  /** Count of journal events of `type` matching `match`, compared with `gte`/`lte`/`eq`. */
  | { count: { type: XPEventType; match?: Record<string, Scalar | Scalar[]> }; gte?: number; lte?: number; eq?: number }
  /** FS predicate: a node exists at `path`. */
  | { exists: string[] }
  /** FS predicate: the node at `path` exists and is not locked. */
  | { unlocked: string[] }
  /** FS predicate: the text file at `path` contains `contains`. */
  | { contentContains: { path: string[]; contains: string } }
  /** Evidence-board predicate: item `pinned` is currently on the board (more `evidence:pin` than `evidence:unpin` in the journal). */
  | { pinned: string }
  /** Evidence-board predicate: items `a` and `b` are linked and both still pinned (order-insensitive). */
  | { linked: { a: string; b: string } };

/**
 * An action executed when a trigger fires and its condition holds. Each maps to
 * a shipped actuation primitive so the core engine stays ignorant of game
 * semantics.
 */
export type Action =
  /** Set a flag (default `true`). */
  | { setFlag: string; value?: FlagValue }
  /** Increment a numeric flag by `by` (default 1); treats missing/non-number as 0. */
  | { incFlag: string; by?: number }
  /** Clear a node's `locked` flag (the "door opens" beat). */
  | { unlock: string[] }
  /** Create a file/folder node at `path` (a scripted "new file appeared"). */
  | { addFile: { path: string[]; node?: Partial<import('../types').FileNode> } }
  /** Delete the node at `path`. */
  | { removeFile: string[] }
  /** Overwrite a text file's content at `path`. */
  | { writeFile: { path: string[]; content: string } }
  /** Pop an XP tray balloon (the `showPopup` beat). */
  | { notify: { title: string; body?: string; icon?: string; timeout?: number; anchorId?: string } }
  /** Deliver an incoming QQ message from a buddy. */
  | { qqMessage: { buddyId: string; text: string } }
  /** Bring a QQ buddy online (knock + tray blink + balloon). */
  | { qqOnline: string }
  /** Open a registered app by id. */
  | { openApp: { appId: string; props?: Record<string, unknown> } }
  /** Open a filesystem node by absolute path. */
  | { openFile: string[] }
  /** Play a named XP system sound. */
  | { playSound: string }
  /** Inject an event onto the bus (also visible to `onEvent` and other triggers). */
  | { emit: XPEvent }
  /** Show a modal alert dialog. */
  | { alert: { title: string; message: string } }
  /**
   * Run nested actions after `ms` milliseconds. Persisted via the #130 scheduler:
   * survives reload and fires on next load if the delay elapsed while closed.
   */
  | { after: { ms: number; do: Action[] } };

/** One `{ on, when?, do }` rule. */
export interface Trigger {
  /** Optional stable id (used for once/max bookkeeping and debugging). */
  id?: string;
  /** Event type(s) this trigger listens for. */
  on: XPEventType | XPEventType[];
  /** Optional guard; the actions run only when it evaluates true. */
  when?: Condition;
  /** Actions to run, in order. */
  do: Action[];
  /** Fire at most once for the lifetime of the save (default false). */
  once?: boolean;
  /** Fire at most this many times (mutually reinforcing with `once`). */
  max?: number;
}

/** A complete scenario: initial flags + the trigger rulebook. */
export interface Scenario {
  /** Stable id (namespaces persisted progress; changing it starts fresh). */
  id: string;
  /** Flags seeded before any trigger runs. */
  initialFlags?: Record<string, FlagValue>;
  /** The rulebook. */
  triggers: Trigger[];
}
