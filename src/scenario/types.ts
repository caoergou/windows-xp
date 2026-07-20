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
import type { ScenarioStrings } from './strings';

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
  | {
      count: { type: XPEventType; match?: Record<string, Scalar | Scalar[]> };
      gte?: number;
      lte?: number;
      eq?: number;
    }
  /** FS predicate: a node exists at `path`. */
  | { exists: string[] }
  /** FS predicate: the node at `path` exists and is not locked. */
  | { unlocked: string[] }
  /** FS predicate: the text file at `path` contains `contains`. */
  | { contentContains: { path: string[]; contains: string } }
  /** Evidence-board predicate: item `pinned` is currently on the board (more `evidence:pin` than `evidence:unpin` in the journal). */
  | { pinned: string }
  /** Evidence-board predicate: items `a` and `b` are linked and both still pinned (order-insensitive). */
  | { linked: { a: string; b: string } }
  /** Search-oracle predicate: a `search:query` was run whose query contains `searched` (case-insensitive substring). */
  | { searched: string }
  /** Search-oracle predicate: a `search:query` surfaced the result `found` (its id appeared in `resultIds`). */
  | { found: string }
  /** Evidence-report predicate over the latest stable per-claim result event (#278). */
  | {
      reportClaim: {
        reportId: string;
        claimId: string;
        result?: import('../apps/EvidenceReport/logic').ClaimResult;
      };
    }
  /** App-settings predicate (#142): the app's persisted setting `key` equals `value`. */
  | { settingEquals: { appId: string; key: string; value: string | number | boolean } };

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
  /**
   * Create a file/folder node at `path` (a scripted "new file appeared").
   * `contentKey` resolves the file's text body against the scenario's string
   * table (#207) at fire time, overriding `node.content` — so an in-world
   * document the player reads localizes with the rest of the beat text.
   */
  | {
      addFile: { path: string[]; node?: Partial<import('../types').FileNode>; contentKey?: string };
    }
  /** Delete the node at `path`. */
  | { removeFile: string[] }
  /** Overwrite a text file's content at `path`. */
  | { writeFile: { path: string[]; content: string } }
  /** Pop an XP tray balloon (the `showPopup` beat). `titleKey`/`bodyKey` resolve against the scenario's string table (#207). */
  | {
      notify: {
        title?: string;
        titleKey?: string;
        body?: string;
        bodyKey?: string;
        icon?: string;
        timeout?: number;
        anchorId?: string;
      };
    }
  /** Deliver an incoming QQ message from a buddy. `textKey` resolves against the string table (#207). */
  | { qqMessage: { buddyId: string; text?: string; textKey?: string } }
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
  /** Show a modal alert dialog. `titleKey`/`messageKey` resolve against the string table (#207). */
  | { alert: { title?: string; titleKey?: string; message?: string; messageKey?: string } }
  /**
   * Pin or update a desktop sticky note (#207) — the cheapest "narration" channel
   * for nudging the story forward. Upserts by `id`; call again with the same id to
   * change the text.
   */
  | { note: ScenarioNote }
  /** Remove a desktop sticky note by id (#207). */
  | { removeNote: string }
  /**
   * Run nested actions after `ms` milliseconds. Persisted via the #130 scheduler:
   * survives reload and fires on next load if the delay elapsed while closed.
   */
  | { after: { ms: number; do: Action[] } };

/** Colour of a scenario sticky note (#207). */
export type NoteColor = 'yellow' | 'blue' | 'pink' | 'green';

/** A desktop sticky note pinned by a scenario (#207). JSON-serializable. */
export interface ScenarioNote {
  /** Stable id — upsert/remove key. */
  id: string;
  /** Optional heading; falls back to a generic "Note" caption. */
  title?: string;
  /** String-table key for the title (#207); resolves over `title`. */
  titleKey?: string;
  /** Body text (newlines preserved). */
  content?: string;
  /** String-table key for the body (#207); resolves over `content`. */
  contentKey?: string;
  /** Desktop position in px; auto-stacked from the top-right when omitted. */
  x?: number;
  y?: number;
  /** Paper colour (default `yellow`). */
  color?: NoteColor;
}

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

/** One step of a scenario's canonical walkthrough (#207 rehearsal). */
export interface RehearsalStep {
  /** The event that advances the story at this step. */
  event: XPEvent;
  /**
   * Optional named beat reached once this step is processed — the target for
   * `seekTo(beat)`. Beat names should be stable (they survive edits that shift
   * indices).
   */
  beat?: string;
}

/**
 * A canonical walkthrough the rehearsal/seek engine (#207) replays to jump to
 * any story beat deterministically ("rehearsal mode"). Because triggers and events are
 * data, replaying a prefix through the headless solver reconstructs the exact
 * state of having played to that beat - so an author tests the finale in a
 * second instead of playing ten minutes. Authoring it also gives the solver its
 * regression walkthrough ("CI for stories").
 */
export interface RehearsalPlan {
  walkthrough: RehearsalStep[];
}

/** A complete scenario: initial flags + the trigger rulebook. */
export interface Scenario {
  /** Stable id (namespaces persisted progress; changing it starts fresh). */
  id: string;
  /** Flags seeded before any trigger runs. */
  initialFlags?: Record<string, FlagValue>;
  /** The rulebook. */
  triggers: Trigger[];
  /**
   * Per-locale beat-text tables (#207). Actions reference an entry by key
   * (`titleKey`, `bodyKey`, `textKey`, `contentKey`); the runtime resolves it
   * against the active UI locale. Lets a writer localize/polish the script
   * without touching the logic.
   */
  strings?: ScenarioStrings;
  /**
   * Optional canonical walkthrough for the rehearsal/seek engine (#207) and the
   * headless solver's regression input. Omit for scenarios that don't need
   * fast-forward.
   */
  rehearsal?: RehearsalPlan;
}
