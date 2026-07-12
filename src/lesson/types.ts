/**
 * Guided lesson system — schema (#141).
 *
 * A lesson is a **linear scenario** with a pedagogy layer: each step names a UI
 * `anchor` to spotlight, an `expect` event pattern that advances it (the event
 * bus is the action-verifier — #76/#116/#130), a `hints` ladder, and an
 * `onWrongAction` policy. Three modes run over the same lesson (Watch-Try-Do):
 * `try` (event-gated, hinted) and `do` (gated, unhinted, scored) ship in Phase 1;
 * `watch` (auto-demonstrated) is planned. Authored as JSON, i18n-keyed — see
 * `docs/LESSONS.md`.
 */
import type { XPEventType } from '../events';
import type { Scalar } from '../scenario/types';

/**
 * The event that completes a step. `on` is the event type(s); every other field
 * is matched against the event's payload (e.g. `{ on: 'app:launch', appId:
 * 'Notepad' }` — mirrors the #141 authoring shape).
 */
export interface ExpectPattern {
  on: XPEventType | XPEventType[];
  [field: string]: Scalar | Scalar[] | XPEventType | XPEventType[] | undefined;
}

/** One rung of a step's hint ladder: shown once `afterMs` of inactivity elapse. */
export interface LessonHint {
  /** Milliseconds on the step before this hint appears. */
  afterMs: number;
  /** Hint text — an i18n key (resolved if present) or a literal string. */
  text: string;
}

/** What happens when the learner performs the wrong action for the step. */
export type WrongActionPolicy = 'nudge' | 'shield' | 'undo';

/** A single teachable step. */
export interface LessonStep {
  /** Instruction text — an i18n key (resolved if present) or a literal string. */
  instruction: string;
  /** Semantic UI anchor id to spotlight (e.g. `start-button`, `notepad.menu.file`). */
  anchor?: string;
  /** The verified action that advances the step. */
  expect: ExpectPattern;
  /** Escalating hints (Try mode only). */
  hints?: LessonHint[];
  /**
   * Reaction to a wrong action (an event of the expected type whose payload
   * doesn't match). Phase 1 implements `nudge`; `shield`/`undo` are planned.
   */
  onWrongAction?: WrongActionPolicy;
}

/** A complete lesson. */
export interface Lesson {
  /** Stable id (namespaces persisted progress). */
  id: string;
  /** Lesson title — an i18n key or literal. */
  title: string;
  /** Ordered steps. */
  steps: LessonStep[];
}

/** Watch-Try-Do. `watch` is planned; `try`/`do` ship in Phase 1. */
export type LessonMode = 'watch' | 'try' | 'do';

/** Score reported on completion (Do mode). */
export interface LessonScore {
  /** 0–100, penalized by wrong actions and hints used. */
  score: number;
  /** Wrong actions taken across the lesson. */
  wrongActions: number;
  /** Hints shown across the lesson. */
  hintsUsed: number;
  /** Wall-clock time on the lesson, ms. */
  timeMs: number;
}

/**
 * `defineLesson` — thin typed sugar over the JSON literal (identity at runtime),
 * giving autocomplete + compile-time checking without a second representation.
 */
export const defineLesson = (lesson: Lesson): Lesson => lesson;
