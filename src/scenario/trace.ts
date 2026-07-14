/**
 * Condition tracing (#209) — the "why didn't it fire?" companion to
 * {@link evaluateCondition}. Pure, no React: given the same condition + context,
 * it returns a tree mirroring the condition with each node's truth value and a
 * human-readable label, so the DevTools trigger tab can point at the exact
 * sub-predicate that was false.
 *
 * Leaf truth is delegated to `evaluateCondition` so the trace can never disagree
 * with the real evaluator; composites (`all`/`any`/`not`) derive from children.
 */
import type { Condition, FlagValue } from './types';
import { evaluateCondition, type EvalContext } from './engine';

export interface ConditionTrace {
  /** One-line human-readable description of this predicate. */
  label: string;
  /** Whether this node held. */
  held: boolean;
  /** Children for the composite predicates `all` / `any` / `not`. */
  children?: ConditionTrace[];
}

const fmt = (v: FlagValue | undefined): string =>
  v === undefined ? 'undefined' : typeof v === 'string' ? `"${v}"` : String(v);

const path = (p: string[]): string => p.join('/');

/** Describe a leaf (non-composite) predicate for the trace label. */
const leafLabel = (condition: Condition, ctx: EvalContext): string => {
  if ('flag' in condition) {
    const cur = fmt(ctx.flags[condition.flag]);
    if (condition.eq !== undefined)
      return `flag ${condition.flag} (${cur}) == ${fmt(condition.eq)}`;
    if (condition.gte !== undefined) return `flag ${condition.flag} (${cur}) >= ${condition.gte}`;
    if (condition.lte !== undefined) return `flag ${condition.flag} (${cur}) <= ${condition.lte}`;
    return `flag ${condition.flag} (${cur}) is truthy`;
  }
  if ('event' in condition) {
    const want = Object.entries(condition.event)
      .map(([k, v]) => `${k}=${Array.isArray(v) ? `[${v.join('/')}]` : String(v)}`)
      .join(' ');
    return `event matches ${want || '(any)'}`;
  }
  if ('happened' in condition) {
    return `happened ${condition.happened.type}${condition.happened.match ? ' (filtered)' : ''}`;
  }
  if ('count' in condition) {
    const bound = [
      condition.eq !== undefined ? `== ${condition.eq}` : '',
      condition.gte !== undefined ? `>= ${condition.gte}` : '',
      condition.lte !== undefined ? `<= ${condition.lte}` : '',
    ]
      .filter(Boolean)
      .join(' ');
    return `count ${condition.count.type} ${bound}`;
  }
  if ('exists' in condition) return `exists ${path(condition.exists)}`;
  if ('unlocked' in condition) return `unlocked ${path(condition.unlocked)}`;
  if ('contentContains' in condition) {
    return `contentContains ${path(condition.contentContains.path)} ⊃ "${condition.contentContains.contains}"`;
  }
  if ('pinned' in condition) return `pinned ${condition.pinned}`;
  if ('linked' in condition) return `linked ${condition.linked.a} — ${condition.linked.b}`;
  if ('searched' in condition) return `searched "${condition.searched}"`;
  if ('found' in condition) return `found ${condition.found}`;
  return 'unknown predicate';
};

/** Build the truth-annotated trace tree for a condition. */
export const traceCondition = (
  condition: Condition | undefined,
  ctx: EvalContext
): ConditionTrace => {
  if (!condition) return { label: '(no condition)', held: true };

  if ('all' in condition) {
    const children = condition.all.map(c => traceCondition(c, ctx));
    return { label: `AND (${children.length})`, held: children.every(c => c.held), children };
  }
  if ('any' in condition) {
    const children = condition.any.map(c => traceCondition(c, ctx));
    return { label: `OR (${children.length})`, held: children.some(c => c.held), children };
  }
  if ('not' in condition) {
    const child = traceCondition(condition.not, ctx);
    return { label: 'NOT', held: !child.held, children: [child] };
  }

  return { label: leafLabel(condition, ctx), held: evaluateCondition(condition, ctx) };
};
