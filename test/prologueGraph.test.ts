/**
 * The reference Puzzle Dependency Graph demo (PUZZLE-DESIGN §4). Doubles as "CI
 * for stories": the graph must lint clean, its walkthrough must reach the ending
 * through the headless solver, and out-of-order play must NOT sequence-break the
 * gate. A story whose walkthrough breaks fails CI like any other regression.
 */
import { describe, it, expect } from 'vitest';
import { prologueGraph, prologueGraphScenario } from '../src/data/scenarios/prologueGraph';
import { lintPuzzleGraph, solvedFlag } from '../src/scenario/puzzleGraph';
import { solveScenario, ranAction } from '../src/scenario/solver';
import type { XPEvent } from '../src/events';

const boot: XPEvent = { type: 'session:boot-complete' };
const open = (name: string): XPEvent => ({
  type: 'file:open',
  path: [name],
  name,
  nodeType: 'file',
});
const unlockWindows: XPEvent = { type: 'file:unlock', name: 'WINDOWS' };

const WALKTHROUGH: XPEvent[] = [
  boot,
  open('写给未来的信.txt'),
  open('聊天记录.txt'),
  unlockWindows,
];

describe('prologue PDG demo', () => {
  it('lints with zero issues (reachable, hinted, gated)', () => {
    const report = lintPuzzleGraph(prologueGraph);
    expect(report.issues).toEqual([]);
    expect(report.ok).toBe(true);
    // A linear four-node chain: one puzzle open at each depth.
    expect(report.bushiness).toEqual([1, 1, 1, 1]);
    expect(report.maxParallel).toBe(1);
  });

  it('completes via the intended walkthrough (CI for stories)', () => {
    const r = solveScenario(prologueGraphScenario, WALKTHROUGH);
    for (const id of ['intro', 'read-letter', 'read-chat', 'unlock-windows']) {
      expect(r.flags[solvedFlag(id)]).toBe(true);
    }
    // The finale's reveals ran (planted clue + epilogue files, the QQ nudge).
    expect(ranAction(r, 'addFile')).toBe(true);
    expect(ranAction(r, 'qqMessage')).toBe(true);
  });

  it('cannot be sequence-broken: the gate holds out of order', () => {
    const r = solveScenario(prologueGraphScenario, [
      unlockWindows,
      open('聊天记录.txt'),
      open('写给未来的信.txt'),
    ]);
    // Nothing downstream of the boot/letter gate should have solved.
    expect(r.flags[solvedFlag('unlock-windows')]).toBeUndefined();
    expect(r.flags[solvedFlag('read-chat')]).toBeUndefined();
  });

  it('needs each prerequisite: skipping the letter blocks the chat step', () => {
    const r = solveScenario(prologueGraphScenario, [boot, open('聊天记录.txt')]);
    expect(r.flags[solvedFlag('intro')]).toBe(true);
    expect(r.flags[solvedFlag('read-chat')]).toBeUndefined();
  });
});
