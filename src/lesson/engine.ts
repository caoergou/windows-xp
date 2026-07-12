/**
 * Lesson engine — pure matching & scoring (#141).
 *
 * The event bus is the action-verifier: a step advances when an event matches
 * its `expect` pattern. No React, no side effects — unit-testable in isolation.
 */
import type { XPEvent } from '../events';
import { matchOn } from '../scenario/engine';
import type { ExpectPattern } from './types';

const valueEquals = (a: unknown, b: unknown): boolean => {
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((v, i) => valueEquals(v, b[i]));
  }
  return a === b;
};

/** The payload fields of an expect pattern (everything but `on`). */
const payloadFields = (expect: ExpectPattern): [string, unknown][] =>
  Object.entries(expect).filter(([k]) => k !== 'on');

/** Whether `event` completes the step described by `expect` (type + payload match). */
export const expectMatches = (expect: ExpectPattern, event: XPEvent): boolean => {
  if (!matchOn(expect.on, event.type)) return false;
  const record = event as unknown as Record<string, unknown>;
  return payloadFields(expect).every(([key, want]) => valueEquals(record[key], want));
};

/**
 * A "wrong action" for the step: an event of the *expected type* whose payload
 * does not match (e.g. launched the wrong app). Events of unrelated types are
 * not wrong — they're just noise the learner is free to make.
 */
export const isWrongAction = (expect: ExpectPattern, event: XPEvent): boolean =>
  matchOn(expect.on, event.type) && !expectMatches(expect, event);

/** Score a completed Do-mode run: start at 100, penalize mistakes and hints. */
export const computeScore = (wrongActions: number, hintsUsed: number, timeMs: number): number => {
  void timeMs; // time is reported but not (yet) penalized
  return Math.max(0, 100 - wrongActions * 10 - hintsUsed * 5);
};
