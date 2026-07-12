/**
 * DevTools trace channel (#209). A tiny prefix-keyed pub/sub that carries the
 * ScenarioRunner's per-event evaluation reports to the DevTools panel — the one
 * data source both the panel and the landing-page glass box read.
 *
 * It lives outside the engine dirs (no React, no colors, no XP chrome) and is
 * keyed by the instance's storage `prefix` so two `<WindowsXP/>` instances on the
 * same page never cross streams. It is dev-only wiring; a production build that
 * never mounts the panel and never calls `publishTrace` tree-shakes it away.
 */
import type { XPEvent } from '../events';
import type { FlagValue } from '../scenario/types';
import type { ConditionTrace } from '../scenario/trace';

/** Why a matched trigger did not fire (undefined when it fired). */
export type SkipReason = 'once' | 'max' | 'when';

/** One trigger's outcome for a single event. */
export interface TriggerReport {
  /** Trigger id, or its index as a string. */
  id: string;
  index: number;
  on: string | string[];
  /** Did the event type match the trigger's `on`? */
  matchedOn: boolean;
  /** Present when `matchedOn` and the once/max budget allowed evaluation. */
  when?: ConditionTrace;
  fired: boolean;
  skip?: SkipReason;
  /** Times this trigger has fired so far. */
  fireCount: number;
}

/** A flag mutation attributed to the trigger that caused it. */
export interface FlagChange {
  flag: string;
  value: FlagValue;
  /** The firing trigger's id/index. */
  by: string;
}

/** The ScenarioRunner's full report for one processed event. */
export interface EvalReport {
  /** Monotonic sequence number within this instance. */
  seq: number;
  event: XPEvent;
  triggers: TriggerReport[];
  /** Flags snapshot after the event was processed. */
  flags: Record<string, FlagValue>;
  /** Flags changed while processing this event, with attribution. */
  changes: FlagChange[];
}

type Listener = (report: EvalReport) => void;

const channels = new Map<string, Set<Listener>>();

/** Publish a report to everyone listening on `prefix`. Never throws. */
export const publishTrace = (prefix: string, report: EvalReport): void => {
  const set = channels.get(prefix);
  if (!set) return;
  for (const fn of set) {
    try {
      fn(report);
    } catch {
      /* a broken listener must not break the runtime */
    }
  }
};

/**
 * Whether anyone is listening on `prefix`. The ScenarioRunner guards its extra
 * trace-building on this so a production build with no panel pays nothing.
 */
export const hasTraceListeners = (prefix: string): boolean => (channels.get(prefix)?.size ?? 0) > 0;

/** Subscribe to reports on `prefix`; returns an unsubscribe function. */
export const subscribeTrace = (prefix: string, fn: Listener): (() => void) => {
  let set = channels.get(prefix);
  if (!set) {
    set = new Set();
    channels.set(prefix, set);
  }
  set.add(fn);
  return () => {
    set?.delete(fn);
    if (set && set.size === 0) channels.delete(prefix);
  };
};
