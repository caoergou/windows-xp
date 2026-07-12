/**
 * Deduction Sheet — pure judging (#219, mechanic M3).
 *
 * The Golden-Idol / Obra-Dinn verifier: the player fills word-bank slots, and
 * the sheet judges in **batches** (a group verifies only when all its slots are
 * filled, and only reports correct/incorrect per group — never per slot). That
 * batching is the anti-brute-force policy — a player can't binary-search one
 * slot at a time. No React here so the rule is unit-testable.
 */
export interface DeductionSlot {
  id: string;
  label?: string;
}

export interface DeductionGroup {
  id: string;
  /** Slot ids judged together as one batch. */
  slots: string[];
}

/** slot id → chosen word. */
export type Assignment = Record<string, string>;

export interface JudgeResult {
  /** Group ids whose every slot is filled and correct. */
  verified: string[];
  /** Group ids fully filled but wrong. */
  failed: string[];
}

const filled = (v: string | undefined): v is string => v !== undefined && v !== '';

/** Judge each fully-filled group as correct/incorrect; partial groups are skipped. */
export const judgeGroups = (
  assignment: Assignment,
  groups: DeductionGroup[],
  solution: Record<string, string>
): JudgeResult => {
  const verified: string[] = [];
  const failed: string[] = [];
  for (const g of groups) {
    if (!g.slots.every(s => filled(assignment[s]))) continue; // incomplete → no verdict
    (g.slots.every(s => assignment[s] === solution[s]) ? verified : failed).push(g.id);
  }
  return { verified, failed };
};

/** Whether every group has been verified (the sheet is solved). */
export const allGroupsVerified = (groups: DeductionGroup[], verified: ReadonlySet<string>): boolean =>
  groups.length > 0 && groups.every(g => verified.has(g.id));
