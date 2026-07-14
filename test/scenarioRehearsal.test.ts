/**
 * Rehearsal / deterministic seek (#207) — pure-logic layer. Proves that
 * replaying a walkthrough prefix through the solver reconstructs the same state
 * as playing there, that every replayed journal entry is stamped
 * `rehearsal: true`, and that `seekTo('finale')` lands on the finale.
 */
import { describe, it, expect } from 'vitest';
import { prologueGraph, prologueGraphScenario } from '../src/data/scenarios/prologueGraph';
import { buildTape, beatIndex, seekResult, fsTreeToSolveNodes } from '../src/scenario/rehearsal';
import { solveScenario } from '../src/scenario/solver';
import { solvedFlag } from '../src/scenario/puzzleGraph';
import type { XPEvent } from '../src/events';

const tape = buildTape(prologueGraphScenario.rehearsal);

describe('rehearsal seek — pure logic', () => {
  it('flattens the plan into an event tape with beat indices', () => {
    expect(tape.events).toHaveLength(4);
    expect(tape.beats).toEqual({ intro: 0, letter: 1, chat: 2, finale: 3 });
    expect(beatIndex(tape, 'finale')).toBe(3);
    expect(beatIndex(tape, 'nope')).toBe(-1);
  });

  it("seekTo('finale') reaches the same flags as a full normal playthrough", () => {
    const seek = seekResult(prologueGraphScenario, tape, beatIndex(tape, 'finale'));
    // Every puzzle solved, exactly as if played start-to-finish.
    for (const id of ['intro', 'read-letter', 'read-chat', 'unlock-windows']) {
      expect(seek.flags[solvedFlag(id)]).toBe(true);
    }
    // Parity with a direct solve over the raw walkthrough (strip provenance).
    const normal = solveScenario(prologueGraphScenario, tape.events);
    expect(seek.flags).toEqual(normal.flags);
    const stripped = seek.journal.map(({ rehearsal, ...e }) => {
      void rehearsal;
      return e as XPEvent;
    });
    expect(stripped).toEqual(normal.journal);
  });

  it('stamps every replayed journal entry with rehearsal: true', () => {
    const seek = seekResult(prologueGraphScenario, tape, beatIndex(tape, 'finale'));
    expect(seek.journal.length).toBeGreaterThan(0);
    expect(seek.journal.every(e => (e as { rehearsal?: boolean }).rehearsal === true)).toBe(true);
  });

  it('a shorter prefix is the earlier state ("回到上一拍")', () => {
    const atChat = seekResult(prologueGraphScenario, tape, beatIndex(tape, 'chat'));
    expect(atChat.flags[solvedFlag('read-chat')]).toBe(true);
    // The finale is one step later — not yet solved at the chat beat.
    expect(atChat.flags[solvedFlag('unlock-windows')]).toBeUndefined();
    expect(atChat.index).toBe(2);
  });

  it('index < 0 is the pristine initial state', () => {
    const pristine = seekResult(prologueGraphScenario, tape, -1);
    expect(pristine.journal).toEqual([]);
    expect(pristine.flags[solvedFlag('intro')]).toBeUndefined();
  });

  it('walks a filesystem tree into flat solver seeds', () => {
    const seeds = fsTreeToSolveNodes({
      type: 'root',
      name: 'root',
      children: {
        C: {
          type: 'drive',
          name: 'C',
          children: {
            'secret.txt': { type: 'file', name: 'secret.txt', locked: true, content: 'hi' },
          },
        },
      },
    });
    expect(seeds).toContainEqual({ path: ['C'], locked: false });
    expect(seeds).toContainEqual({ path: ['C', 'secret.txt'], locked: true, content: 'hi' });
  });
});
