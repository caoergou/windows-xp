import type { JsonValue } from '../types';
import type {
  EventPattern,
  Scenario,
  ScenarioAction,
  ScenarioCondition,
  ScenarioEvent,
  ScenarioState,
  ScenarioTrigger,
} from './types';

/** Max journal entries kept for history predicates (bounds persisted size). */
export const JOURNAL_LIMIT = 500;

const valueEquals = (a: JsonValue, b: JsonValue): boolean => {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((v, i) => valueEquals(v as JsonValue, b[i] as JsonValue));
  }
  return false;
};

/** Does `event` match `pattern` — type (exact or `foo*` glob) + field equalities? */
export function matchesEvent(pattern: EventPattern, event: ScenarioEvent): boolean {
  const evt = event as unknown as Record<string, JsonValue>;
  const t = pattern.type;
  if (t.endsWith('*')) {
    if (!String(evt.type).startsWith(t.slice(0, -1))) return false;
  } else if (evt.type !== t) {
    return false;
  }
  for (const [key, expected] of Object.entries(pattern)) {
    if (key === 'type') continue;
    if (!valueEquals(evt[key], expected)) return false;
  }
  return true;
}

const countMatches = (pattern: EventPattern, journal: ScenarioEvent[]): number =>
  journal.reduce((n, e) => (matchesEvent(pattern, e) ? n + 1 : n), 0);

/** Context a condition is evaluated against. */
interface EvalCtx {
  flags: Record<string, JsonValue>;
  journal: ScenarioEvent[];
  event: ScenarioEvent;
}

/** Evaluate a scenario condition. An absent/empty condition is `true`. */
export function evalCondition(cond: ScenarioCondition | undefined, ctx: EvalCtx): boolean {
  if (!cond) return true;
  const evt = ctx.event as unknown as Record<string, JsonValue>;

  if (cond.allOf && !cond.allOf.every(c => evalCondition(c, ctx))) return false;
  if (cond.anyOf && !cond.anyOf.some(c => evalCondition(c, ctx))) return false;
  if (cond.not && evalCondition(cond.not, ctx)) return false;

  if (cond.flag !== undefined && !ctx.flags[cond.flag]) return false;
  if (cond.flagEquals && !valueEquals(ctx.flags[cond.flagEquals.flag], cond.flagEquals.value)) {
    return false;
  }
  if (cond.happened && countMatches(cond.happened, ctx.journal) === 0) return false;
  if (cond.count) {
    const n = countMatches(cond.count.event, ctx.journal);
    if (cond.count.gte !== undefined && n < cond.count.gte) return false;
    if (cond.count.lte !== undefined && n > cond.count.lte) return false;
  }
  if (cond.match) {
    for (const [key, expected] of Object.entries(cond.match)) {
      if (!valueEquals(evt[key], expected)) return false;
    }
  }
  return true;
}

/** True when `trigger.on` selects `event.type` (exact or `foo*` glob). */
export function triggerListensTo(trigger: ScenarioTrigger, event: ScenarioEvent): boolean {
  const type = (event as { type: string }).type;
  return trigger.on.endsWith('*') ? type.startsWith(trigger.on.slice(0, -1)) : trigger.on === type;
}

/** Has this trigger exhausted its `once`/`max` budget given prior fire counts? */
export function triggerExhausted(trigger: ScenarioTrigger, fireCounts: Record<string, number>): boolean {
  const fired = fireCounts[trigger.id] ?? 0;
  if (trigger.once && fired >= 1) return true;
  if (trigger.max !== undefined && fired >= trigger.max) return true;
  return false;
}

/**
 * Pure evaluation: given the scenario, the current event, and the current
 * state, return the actions to run (in trigger order) and the trigger ids that
 * fired. The caller applies the actions and increments fire counts.
 */
export function evaluateEvent(
  scenario: Scenario,
  event: ScenarioEvent,
  state: ScenarioState
): { actions: ScenarioAction[]; firedTriggerIds: string[] } {
  const actions: ScenarioAction[] = [];
  const firedTriggerIds: string[] = [];
  for (const trigger of scenario.triggers) {
    if (!triggerListensTo(trigger, event)) continue;
    if (triggerExhausted(trigger, state.fireCounts)) continue;
    if (!evalCondition(trigger.when, { flags: state.flags, journal: state.journal, event })) {
      continue;
    }
    actions.push(...trigger.actions);
    firedTriggerIds.push(trigger.id);
  }
  return { actions, firedTriggerIds };
}

/** Append an event to the journal, keeping it bounded. */
export function appendJournal(journal: ScenarioEvent[], event: ScenarioEvent): ScenarioEvent[] {
  const next = journal.length >= JOURNAL_LIMIT ? journal.slice(journal.length - JOURNAL_LIMIT + 1) : journal.slice();
  next.push(event);
  return next;
}

/** Build the initial state from a scenario (used when no persisted state exists). */
export function initialState(scenario: Scenario): ScenarioState {
  return { flags: { ...(scenario.flags ?? {}) }, journal: [], fireCounts: {} };
}
