/**
 * Scenario author toolchain — Layer 3: Puzzle Dependency Graph (PUZZLE-DESIGN §4).
 * Tests the compiler (→ Layer-1 triggers), an end-to-end run through the headless
 * solver, and the graph linter (cycles, reachability, gates, hints, bushiness).
 */
import { describe, it, expect } from 'vitest';
import { compilePuzzleGraph, lintPuzzleGraph, solvedFlag, type PuzzleGraph } from '../src/scenario/puzzleGraph';
import { solveScenario, ranAction } from '../src/scenario/solver';
import { eventMatch, happened, unlock, flag } from '../src/scenario/builder';
import type { XPEvent } from '../src/events';

const openFileEvent = (name: string): XPEvent => ({ type: 'file:open', path: [name], name, nodeType: 'file' });

describe('compilePuzzleGraph', () => {
  it('compiles a node to a fire-once gated trigger', () => {
    const graph: PuzzleGraph = {
      id: 'g',
      puzzles: [
        { id: 'a', on: 'file:open', solvedWhen: eventMatch({ name: 'x' }), hints: [{ text: 'h' }] },
        { id: 'b', requires: ['a'], on: 'file:open', solvedWhen: eventMatch({ name: 'y' }), grants: [unlock(['D', 'z'])], hints: [{ text: 'h' }] },
      ],
    };
    const scenario = compilePuzzleGraph(graph);
    expect(scenario.triggers[0]).toEqual({
      id: 'puzzle:a',
      on: ['file:open'],
      once: true,
      when: { event: { name: 'x' } },
      do: [{ setFlag: 'solved:a' }],
    });
    expect(scenario.triggers[1]).toEqual({
      id: 'puzzle:b',
      on: ['file:open'],
      once: true,
      when: { all: [{ flag: 'solved:a' }, { event: { name: 'y' } }] },
      do: [{ setFlag: 'solved:b' }, { unlock: ['D', 'z'] }],
    });
  });

  it('derives `on` from happened/count when omitted', () => {
    const scenario = compilePuzzleGraph({
      id: 'g',
      puzzles: [{ id: 'a', solvedWhen: happened('file:unlock', { name: 'W' }), hints: [{ text: 'h' }] }],
    });
    expect(scenario.triggers[0].on).toEqual(['file:unlock']);
  });
});

describe('compile → solve (end to end)', () => {
  const graph: PuzzleGraph = {
    id: 'story',
    puzzles: [
      { id: 'diary', on: 'file:open', solvedWhen: eventMatch({ name: 'diary.txt' }), hints: [{ text: 'h' }] },
      { id: 'chat', requires: ['diary'], on: 'file:open', solvedWhen: eventMatch({ name: 'chat.txt' }), grants: [unlock(['D', '私人'])], hints: [{ text: 'h' }] },
    ],
  };
  const scenario = compilePuzzleGraph(graph);

  it('enforces the dependency order', () => {
    // chat before diary: nothing solves (the gate holds)
    const early = solveScenario(scenario, [openFileEvent('chat.txt')]);
    expect(early.flags[solvedFlag('chat')]).toBeUndefined();
    expect(early.flags[solvedFlag('diary')]).toBeUndefined();
  });

  it('reaches the ending via the intended walkthrough', () => {
    const r = solveScenario(scenario, [openFileEvent('chat.txt'), openFileEvent('diary.txt'), openFileEvent('chat.txt')]);
    expect(r.flags[solvedFlag('diary')]).toBe(true);
    expect(r.flags[solvedFlag('chat')]).toBe(true);
    expect(ranAction(r, 'unlock')).toBe(true);
  });
});

describe('lintPuzzleGraph', () => {
  const hinted = (extra: Partial<PuzzleGraph['puzzles'][number]>) => ({ hints: [{ text: 'h' }], ...extra });

  it('passes a well-formed graph', () => {
    const report = lintPuzzleGraph({
      id: 'g',
      puzzles: [
        hinted({ id: 'a', on: 'file:open', solvedWhen: eventMatch({ name: 'x' }) }),
        hinted({ id: 'b', requires: ['a'], on: 'file:open', solvedWhen: eventMatch({ name: 'y' }) }),
      ] as PuzzleGraph['puzzles'],
    });
    expect(report.ok).toBe(true);
    expect(report.issues).toHaveLength(0);
  });

  it('errors on missing requires and self-reference', () => {
    const report = lintPuzzleGraph({
      id: 'g',
      puzzles: [hinted({ id: 'a', requires: ['ghost', 'a'], on: 'file:open', solvedWhen: eventMatch({ name: 'x' }) })] as PuzzleGraph['puzzles'],
    });
    expect(report.ok).toBe(false);
    expect(report.issues.some(i => i.message.includes('unknown puzzle "ghost"'))).toBe(true);
    expect(report.issues.some(i => i.message.includes('requires itself'))).toBe(true);
  });

  it('detects dependency cycles', () => {
    const report = lintPuzzleGraph({
      id: 'g',
      puzzles: [
        hinted({ id: 'a', requires: ['b'], on: 'file:open', solvedWhen: eventMatch({ name: 'x' }) }),
        hinted({ id: 'b', requires: ['a'], on: 'file:open', solvedWhen: eventMatch({ name: 'y' }) }),
      ] as PuzzleGraph['puzzles'],
    });
    expect(report.ok).toBe(false);
    expect(report.issues.filter(i => i.message.includes('cycle')).length).toBeGreaterThanOrEqual(1);
  });

  it('warns on a missing hint ladder (M12)', () => {
    const report = lintPuzzleGraph({
      id: 'g',
      puzzles: [{ id: 'a', on: 'file:open', solvedWhen: eventMatch({ name: 'x' }) }],
    });
    expect(report.issues.some(i => i.level === 'warn' && i.message.includes('hint ladder'))).toBe(true);
    expect(report.ok).toBe(true); // warning, not error
  });

  it('errors when a puzzle has no derivable trigger event', () => {
    const report = lintPuzzleGraph({
      id: 'g',
      puzzles: [hinted({ id: 'a', solvedWhen: flag('ready') }) as PuzzleGraph['puzzles'][number]],
    });
    expect(report.issues.some(i => i.message.includes('no trigger event'))).toBe(true);
    expect(report.ok).toBe(false);
  });

  it('warns when a puzzle bypasses a gate', () => {
    const report = lintPuzzleGraph({
      id: 'g',
      puzzles: [
        hinted({ id: 'intro', on: 'file:open', solvedWhen: eventMatch({ name: 'i' }) }),
        hinted({ id: 'gate', gate: true, requires: ['intro'], on: 'file:open', solvedWhen: eventMatch({ name: 'g' }) }),
        hinted({ id: 'proper', requires: ['gate'], on: 'file:open', solvedWhen: eventMatch({ name: 'p' }) }),
        hinted({ id: 'sneaky', requires: ['intro'], on: 'file:open', solvedWhen: eventMatch({ name: 's' }) }), // skips the gate
      ] as PuzzleGraph['puzzles'],
    });
    expect(report.issues.some(i => i.puzzle === 'sneaky' && i.message.includes('bypasses gate'))).toBe(true);
    expect(report.issues.some(i => i.puzzle === 'proper' && i.message.includes('bypasses'))).toBe(false);
  });

  it('reports bushiness by dependency depth', () => {
    const report = lintPuzzleGraph({
      id: 'g',
      puzzles: [
        hinted({ id: 'r1', on: 'file:open', solvedWhen: eventMatch({ name: '1' }) }),
        hinted({ id: 'r2', on: 'file:open', solvedWhen: eventMatch({ name: '2' }) }),
        hinted({ id: 'r3', on: 'file:open', solvedWhen: eventMatch({ name: '3' }) }),
        hinted({ id: 'leaf', requires: ['r1', 'r2'], on: 'file:open', solvedWhen: eventMatch({ name: '4' }) }),
      ] as PuzzleGraph['puzzles'],
    });
    expect(report.bushiness[0]).toBe(3); // three roots open in parallel
    expect(report.bushiness[1]).toBe(1); // one depth-1 puzzle
    expect(report.maxParallel).toBe(3);
  });
});
