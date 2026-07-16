/**
 * DevTools rehearsal channel (#207). A prefix-keyed registry + pub/sub that lets
 * the seek-bar UI (a DevTools consumer) drive and observe the ScenarioRunner's
 * rehearsal state without either side importing the other.
 *
 * Two halves, both keyed by the instance's storage `prefix` so two `<WindowsXP/>`
 * instances never cross streams:
 *   • a **controller registry** — the ScenarioRunner registers one controller
 *     (seek/step/exit); the imperative handle (XPBridge) and the seek bar look
 *     it up and call it;
 *   • a **state pub/sub** — the runner publishes `RehearsalState` after every
 *     seek so the UI re-renders.
 *
 * Like {@link ./traceChannel}, it lives outside the engine dirs (no React, no
 * colors) and tree-shakes away when nothing mounts it.
 */

import type { XPEvent } from '../events';
import type { FlagValue } from '../scenario/types';
import type { ConditionTrace } from '../scenario/trace';

/** A named beat and the tape index that reaches it. */
export interface RehearsalBeat {
  beat: string;
  index: number;
}

/** The rehearsal cursor as the seek bar renders it. */
export interface RehearsalState {
  /** Whether a rehearsal is in progress (the live save is being previewed). */
  active: boolean;
  /** Current tape index (−1 = before the first step / pristine start). */
  index: number;
  /** Total number of steps on the tape. */
  length: number;
  /** Named beats in tape order (seek targets). */
  beats: RehearsalBeat[];
}

/** One trigger's current authoring/debug state, independent of a matching event. */
export interface ScenarioTriggerState {
  id: string;
  index: number;
  on: string | string[];
  fireCount: number;
  budgetAvailable: boolean;
  when: ConditionTrace;
}

/** Serializable runtime state exposed to authoring tools through XPHandle. */
export interface ScenarioDebugState {
  scenarioId: string | null;
  flags: Record<string, FlagValue>;
  fires: Record<string, number>;
  journalLength: number;
  lastEvent?: XPEvent;
  pending: string[];
  rehearsal: RehearsalState;
  triggers: ScenarioTriggerState[];
}

/** The imperative surface the ScenarioRunner exposes to seek-bar consumers. */
export interface RehearsalController {
  /** Jump to a named beat's state; returns false if the beat is unknown. */
  seekTo: (beat: string) => boolean;
  /** Jump to a tape index (clamped; −1 = pristine start). */
  seekToIndex: (index: number) => void;
  /** Step one beat back (re-solve the shorter prefix). */
  stepBack: () => void;
  /** Step one beat forward. */
  stepForward: () => void;
  /** Leave rehearsal and restore the pre-rehearsal live save. */
  exitRehearsal: () => void;
  /** The current cursor (for a consumer that mounts mid-session). */
  getState: () => RehearsalState;
  /** Set one authoring flag and emit the same flag:change event as scenario actions. */
  setFlag: (flag: string, value: FlagValue) => boolean;
  /** Inspect flags, fire budgets, and condition traces without touching runtime state. */
  getDebugState: () => ScenarioDebugState;
}

const controllers = new Map<string, RehearsalController>();
const listeners = new Map<string, Set<(state: RehearsalState) => void>>();

/** Register the runner's controller for `prefix`; returns an unregister fn. */
export const registerRehearsalController = (
  prefix: string,
  controller: RehearsalController
): (() => void) => {
  controllers.set(prefix, controller);
  return () => {
    if (controllers.get(prefix) === controller) controllers.delete(prefix);
  };
};

/** The controller registered on `prefix`, or null (no scenario / not mounted). */
export const getRehearsalController = (prefix: string): RehearsalController | null =>
  controllers.get(prefix) ?? null;

/** Publish the current rehearsal state to everyone listening on `prefix`. */
export const publishRehearsalState = (prefix: string, state: RehearsalState): void => {
  const set = listeners.get(prefix);
  if (!set) return;
  for (const fn of set) {
    try {
      fn(state);
    } catch {
      /* a broken listener must not break the runtime */
    }
  }
};

/** Subscribe to rehearsal-state updates on `prefix`; returns an unsubscribe fn. */
export const subscribeRehearsalState = (
  prefix: string,
  fn: (state: RehearsalState) => void
): (() => void) => {
  let set = listeners.get(prefix);
  if (!set) {
    set = new Set();
    listeners.set(prefix, set);
  }
  set.add(fn);
  return () => {
    set?.delete(fn);
    if (set && set.size === 0) listeners.delete(prefix);
  };
};
