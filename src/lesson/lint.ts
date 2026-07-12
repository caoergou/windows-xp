/**
 * Lesson-pack linter (#141 Phase 2).
 *
 * A lesson is a contract with the learner: every required step must be
 * spotlightable (`anchor`), verifiable (`expect`), and un-stuckable (a hint
 * ladder). This catches authoring gaps mechanically — the same "every required
 * step declares its ladder" rule PUZZLE-DESIGN §M12 argues for. Pure and
 * dependency-free so it runs in tests, CI, or a dev-mode warning.
 */
import type { Lesson } from './types';

export interface LintIssue {
  /** Step index the issue is about, or -1 for lesson-level issues. */
  step: number;
  /** Severity: `error` breaks the contract; `warn` is a smell. */
  level: 'error' | 'warn';
  message: string;
}

/**
 * Lint one lesson. `errors` block a usable lesson (no anchor / no expect / no
 * hint); `warn`s flag likely-unintended authoring. Optionally pass `hasI18nKey`
 * (e.g. `i18n.exists`) to check that instruction/hint/title keys resolve.
 */
export const lintLesson = (lesson: Lesson, hasI18nKey?: (key: string) => boolean): LintIssue[] => {
  const issues: LintIssue[] = [];
  const key = (k: string) => (hasI18nKey && k.includes('.') ? hasI18nKey(k) : true);

  if (!lesson.id) issues.push({ step: -1, level: 'error', message: 'lesson is missing an `id`' });
  if (!lesson.title) issues.push({ step: -1, level: 'error', message: 'lesson is missing a `title`' });
  else if (!key(lesson.title)) issues.push({ step: -1, level: 'warn', message: `title i18n key "${lesson.title}" has no translation` });
  if (!lesson.steps?.length) issues.push({ step: -1, level: 'error', message: 'lesson has no steps' });

  (lesson.steps ?? []).forEach((step, i) => {
    if (!step.anchor) issues.push({ step: i, level: 'warn', message: 'step has no `anchor` — nothing to spotlight' });
    if (!step.expect || !step.expect.on) {
      issues.push({ step: i, level: 'error', message: 'step has no `expect.on` — it can never advance' });
    }
    if (!step.instruction) issues.push({ step: i, level: 'error', message: 'step has no `instruction`' });
    else if (!key(step.instruction)) issues.push({ step: i, level: 'warn', message: `instruction i18n key "${step.instruction}" has no translation` });
    if (!step.hints?.length) {
      issues.push({ step: i, level: 'warn', message: 'step has no hints — the learner can get stuck (M12)' });
    } else {
      step.hints.forEach(h => {
        if (h.text && !key(h.text)) issues.push({ step: i, level: 'warn', message: `hint i18n key "${h.text}" has no translation` });
      });
    }
    // A step with no demonstrate can't be auto-played in Watch mode.
    if (!step.demonstrate) issues.push({ step: i, level: 'warn', message: 'step has no `demonstrate` — Watch mode cannot auto-play it' });
  });

  return issues;
};

/** Convenience: does the lesson have any `error`-level issues? */
export const isLessonValid = (lesson: Lesson): boolean =>
  !lintLesson(lesson).some(i => i.level === 'error');
