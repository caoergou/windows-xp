/**
 * Scenario engine — pure evaluation (#84).
 *
 * No React, no side effects: given a condition and an {@link EvalContext}, decide
 * whether it holds. Kept separate from the runtime so it is exhaustively
 * unit-testable and so the "judging" logic has one home.
 */
import type { XPEvent } from '../events';
import type { Condition, FlagValue, Scalar } from './types';

/** World state a condition is evaluated against. */
export interface EvalContext {
  /** Current scenario flags. */
  flags: Record<string, FlagValue>;
  /** The event that triggered this evaluation (for `event` payload matching). */
  event?: XPEvent;
  /** Bounded, persisted event history (for `happened` / `count`). */
  journal: XPEvent[];
  /** Filesystem predicates. */
  fs: {
    exists: (path: string[]) => boolean;
    unlocked: (path: string[]) => boolean;
    content: (path: string[]) => string | null;
  };
}

/** Deep-equal for the scalar / scalar[] values allowed in matchers. */
const valueEquals = (a: unknown, b: unknown): boolean => {
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((v, i) => valueEquals(v, b[i]));
  }
  return a === b;
};

/**
 * Whether `record`'s fields all match `event`'s fields. Used for `event`
 * payload matching and `happened`/`count` match filters.
 */
const matchesPayload = (
  match: Record<string, Scalar | Scalar[]> | undefined,
  event: Record<string, unknown> | undefined
): boolean => {
  if (!match) return true;
  if (!event) return false;
  return Object.entries(match).every(([key, want]) => valueEquals(event[key], want));
};

/** Whether a trigger's `on` (a type or list of types) includes `eventType`. */
export const matchOn = (on: string | string[], eventType: string): boolean =>
  Array.isArray(on) ? on.includes(eventType) : on === eventType;

/** Evaluate a condition tree against the world state. Absent condition = true. */
export const evaluateCondition = (condition: Condition | undefined, ctx: EvalContext): boolean => {
  if (!condition) return true;

  if ('all' in condition) return condition.all.every(c => evaluateCondition(c, ctx));
  if ('any' in condition) return condition.any.some(c => evaluateCondition(c, ctx));
  if ('not' in condition) return !evaluateCondition(condition.not, ctx);

  if ('flag' in condition) {
    const value = ctx.flags[condition.flag];
    if ('eq' in condition && condition.eq !== undefined) return valueEquals(value, condition.eq);
    if ('gte' in condition && condition.gte !== undefined) {
      return typeof value === 'number' && value >= condition.gte;
    }
    if ('lte' in condition && condition.lte !== undefined) {
      return typeof value === 'number' && value <= condition.lte;
    }
    return Boolean(value);
  }

  if ('event' in condition) {
    return matchesPayload(condition.event, ctx.event as unknown as Record<string, unknown>);
  }

  if ('happened' in condition) {
    const { type, match } = condition.happened;
    return ctx.journal.some(
      e => e.type === type && matchesPayload(match, e as unknown as Record<string, unknown>)
    );
  }

  if ('count' in condition) {
    const { type, match } = condition.count;
    const n = ctx.journal.filter(
      e => e.type === type && matchesPayload(match, e as unknown as Record<string, unknown>)
    ).length;
    if (condition.eq !== undefined) return n === condition.eq;
    let ok = true;
    if (condition.gte !== undefined) ok = ok && n >= condition.gte;
    if (condition.lte !== undefined) ok = ok && n <= condition.lte;
    return ok;
  }

  if ('exists' in condition) return ctx.fs.exists(condition.exists);
  if ('unlocked' in condition) return ctx.fs.unlocked(condition.unlocked);
  if ('contentContains' in condition) {
    const text = ctx.fs.content(condition.contentContains.path);
    return typeof text === 'string' && text.includes(condition.contentContains.contains);
  }
  if ('pinned' in condition) return isPinned(ctx.journal, condition.pinned);
  if ('linked' in condition) {
    const { a, b } = condition.linked;
    return isPinned(ctx.journal, a) && isPinned(ctx.journal, b) && hasLink(ctx.journal, a, b);
  }

  return false;
};

/** Board state is derived from the journal: an item is pinned when its `evidence:pin`s outnumber its `evidence:unpin`s. */
export const isPinned = (journal: XPEvent[], itemId: string): boolean => {
  let net = 0;
  for (const e of journal) {
    if (e.type === 'evidence:pin' && e.itemId === itemId) net += 1;
    else if (e.type === 'evidence:unpin' && e.itemId === itemId) net -= 1;
  }
  return net > 0;
};

/** Whether an `evidence:link` between `a` and `b` (either direction) is in the journal. */
export const hasLink = (journal: XPEvent[], a: string, b: string): boolean =>
  journal.some(
    e =>
      e.type === 'evidence:link' &&
      ((e.sourceId === a && e.targetId === b) || (e.sourceId === b && e.targetId === a))
  );

/** Append an event to a bounded journal (newest last), capping total length. */
export const appendJournal = (journal: XPEvent[], event: XPEvent, cap = 500): XPEvent[] => {
  const next = journal.length >= cap ? journal.slice(journal.length - cap + 1) : journal.slice();
  next.push(event);
  return next;
};
