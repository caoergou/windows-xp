/**
 * Condition tracing (#209): traceCondition mirrors evaluateCondition's verdict
 * and annotates every node so the DevTools can point at the false sub-predicate.
 */
import { describe, it, expect } from 'vitest';
import { traceCondition } from '../src/scenario/trace';
import { evaluateCondition, type EvalContext } from '../src/scenario/engine';
import type { Condition } from '../src/scenario/types';
import type { XPEvent } from '../src/events';

const ctx = (over: Partial<EvalContext> = {}): EvalContext => ({
  flags: {},
  journal: [],
  fs: { exists: () => false, unlocked: () => false, content: () => null },
  ...over,
});

describe('traceCondition', () => {
  it('agrees with evaluateCondition on the root verdict', () => {
    const conds: Condition[] = [
      { flag: 'a' },
      { all: [{ flag: 'a' }, { flag: 'b' }] },
      { any: [{ flag: 'a' }, { flag: 'b' }] },
      { not: { flag: 'a' } },
    ];
    const c = ctx({ flags: { a: true } });
    for (const cond of conds) {
      expect(traceCondition(cond, c).held).toBe(evaluateCondition(cond, c));
    }
  });

  it('marks the failing child of an AND so it is findable', () => {
    const cond: Condition = { all: [{ flag: 'have_key' }, { flag: 'door_open' }] };
    const trace = traceCondition(cond, ctx({ flags: { have_key: true } }));
    expect(trace.held).toBe(false);
    expect(trace.children).toHaveLength(2);
    expect(trace.children![0].held).toBe(true);
    expect(trace.children![1].held).toBe(false);
    expect(trace.children![1].label).toContain('door_open');
  });

  it('flag label shows the current value and comparator', () => {
    const trace = traceCondition({ flag: 'count', gte: 3 }, ctx({ flags: { count: 1 } }));
    expect(trace.held).toBe(false);
    expect(trace.label).toContain('count');
    expect(trace.label).toContain('>= 3');
  });

  it('NOT inverts and keeps the child', () => {
    const trace = traceCondition({ not: { flag: 'blocked' } }, ctx());
    expect(trace.held).toBe(true);
    expect(trace.children).toHaveLength(1);
    expect(trace.children![0].held).toBe(false);
  });

  it('traces journal predicates (happened)', () => {
    const j: XPEvent[] = [{ type: 'file:open', path: ['a'], name: 'a', nodeType: 'file' }];
    const held = traceCondition({ happened: { type: 'file:open' } }, ctx({ journal: j }));
    expect(held.held).toBe(true);
    expect(held.label).toContain('happened');
    const miss = traceCondition({ happened: { type: 'cmd:exec' } }, ctx({ journal: j }));
    expect(miss.held).toBe(false);
  });

  it('empty condition is a held leaf', () => {
    expect(traceCondition(undefined, ctx()).held).toBe(true);
  });
});
