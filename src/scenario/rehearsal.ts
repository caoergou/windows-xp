/**
 * Rehearsal / deterministic seek (#207) — the author's iteration-loop unlock.
 *
 * Because triggers and events are data, a scenario is a pure function of its
 * event tape: replaying the walkthrough prefix up to a beat through the headless
 * {@link solveScenario} reconstructs the *exact* state of having played there —
 * flags, journal, and per-trigger fire budgets included. `seekTo('finale')` is
 * therefore a solver call, not ten minutes of clicking.
 *
 * This module is pure (no React, no bus): it flattens a {@link RehearsalPlan}
 * into an event tape, resolves beat names to tape indices, and solves a prefix.
 * The runtime ({@link ../components/ScenarioRunner}) installs the result and
 * replays only the filesystem-shaped actions to the live desktop; observation
 * actions (notify/qq/sound/…) are recorded but never performed — that, plus the
 * `rehearsal: true` provenance stamped on every replayed journal entry, is how
 * seeking avoids the observer effect.
 *
 * Fidelity note: the solver models an in-memory filesystem. Seed it from the
 * pristine tree ({@link fsTreeToSolveNodes}) so `exists`/`unlocked`/`contentContains`
 * gates read the real starting world, then the walkthrough's own FS actions
 * evolve it. Delayed `after` actions collapse to "eventually" (no clock),
 * matching {@link solveScenario}.
 */
import type { XPEvent } from '../events';
import type { FileNode } from '../types';
import { isContainerNode, isFileContentNode } from '../types';
import { solveScenario, type SolveFsNode, type SolveResult } from './solver';
import type { RehearsalPlan, Scenario } from './types';

/** The flattened event tape plus a beat-name → step-index lookup. */
export interface RehearsalTape {
  /** The walkthrough events, in order. */
  events: XPEvent[];
  /** beat name → index of the step that reaches it. */
  beats: Record<string, number>;
}

/** Flatten a plan into an event tape + beat index map (empty when no plan). */
export const buildTape = (plan: RehearsalPlan | undefined): RehearsalTape => {
  const events: XPEvent[] = [];
  const beats: Record<string, number> = {};
  (plan?.walkthrough ?? []).forEach((step, i) => {
    events.push(step.event);
    if (step.beat) beats[step.beat] = i;
  });
  return { events, beats };
};

/** Resolve a beat name to its tape index, or −1 when unknown. */
export const beatIndex = (tape: RehearsalTape, beat: string): number =>
  beat in tape.beats ? (tape.beats[beat] as number) : -1;

/** The deterministic state of a seek, tagged with the tape index it lands on. */
export interface SeekResult extends SolveResult {
  /** The tape index this state corresponds to (−1 = before any step). */
  index: number;
}

/**
 * Solve the scenario over the tape prefix ending at (and including) `index`.
 * `index < 0` yields the pristine initial state (no events processed). Every
 * journal entry is stamped `rehearsal: true` for provenance. `fs` seeds the
 * solver's filesystem model for FS-predicate gates.
 */
export const seekResult = (
  scenario: Scenario,
  tape: RehearsalTape,
  index: number,
  fs?: SolveFsNode[]
): SeekResult => {
  const clamped = Math.min(index, tape.events.length - 1);
  const prefix = clamped < 0 ? [] : tape.events.slice(0, clamped + 1);
  const result = solveScenario(scenario, prefix, fs ? { fs } : {});
  const journal = result.journal.map(e => ({ ...e, rehearsal: true }) as XPEvent);
  return { ...result, journal, index: clamped };
};

/**
 * Walk a filesystem tree into the flat `{ path, locked, content }` seeds the
 * solver's FS model consumes, so seeking evaluates FS gates against the real
 * starting world rather than an empty disk.
 */
export const fsTreeToSolveNodes = (root: FileNode): SolveFsNode[] => {
  const out: SolveFsNode[] = [];
  const walk = (node: FileNode, path: string[]): void => {
    if (path.length > 0) {
      out.push({
        path,
        locked: node.locked ?? false,
        ...(isFileContentNode(node) && node.content !== undefined ? { content: node.content } : {}),
      });
    }
    if (isContainerNode(node)) {
      for (const [key, child] of Object.entries(node.children)) {
        walk(child, [...path, key]);
      }
    }
  };
  walk(root, []);
  return out;
};
