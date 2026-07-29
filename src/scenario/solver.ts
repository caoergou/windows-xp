/**
 * Scenario author toolchain — headless solver ("CI for stories", PUZZLE-DESIGN §4).
 *
 * Because triggers and events are data, a scenario is testable without a browser:
 * feed the intended event sequence (a walkthrough) and assert the ending is
 * reached; fuzz alternate orderings to catch sequence-breaks. This runs the SAME
 * matching/gating/flag semantics as the live runtime (shared `evaluateCondition`
 * / `matchOn` / journal), against an in-memory virtual filesystem.
 *
 * Fidelity notes vs. the live runtime: delayed `after` actions are applied
 * immediately (headless has no clock — it models "eventually"), and
 * side-effecting actions (notify/qq/openApp/…) are recorded rather than
 * performed. Flag/journal/FS-condition semantics are identical.
 */
import type { XPEvent } from '../events';
import { appendJournal, evaluateCondition, matchOn, type EvalContext } from './engine';
import { resolveText } from './strings';
import type { Action, FlagValue, Scenario } from './types';

/** A seed node for the solver's virtual filesystem. */
export interface SolveFsNode {
  path: string[];
  locked?: boolean;
  content?: string;
}

export interface SolveOptions {
  /** Initial virtual filesystem for `exists`/`unlocked`/`contentContains` + FS actions. */
  fs?: SolveFsNode[];
  /** Cap on total processed events (guards against `emit` cycles). Default 10000. */
  maxEvents?: number;
}

export interface SolveResult {
  /** Final flag values. */
  flags: Record<string, FlagValue>;
  /** The (bounded) event journal, matching the runtime. */
  journal: XPEvent[];
  /** Per-trigger fire counts, keyed by trigger id or index. */
  fired: Record<string, number>;
  /** Non-flag side-effecting actions, in order (each `notify`/`unlock`/`emit`/…). */
  actions: Action[];
}

interface FsCell {
  exists: boolean;
  locked: boolean;
  content?: string;
}

const keyOf = (path: string[]) => path.join('/');

/**
 * Run a scenario headlessly over an event sequence and return the final state.
 * `emit` actions feed back into the trigger loop (cascades), capped by
 * `maxEvents`.
 */
export const solveScenario = (
  scenario: Scenario,
  events: XPEvent[],
  opts: SolveOptions = {}
): SolveResult => {
  const flags: Record<string, FlagValue> = { ...(scenario.initialFlags ?? {}) };
  let journal: XPEvent[] = [];
  const fired: Record<string, number> = {};
  const actions: Action[] = [];
  const cap = opts.maxEvents ?? 10000;

  const fs = new Map<string, FsCell>();
  (opts.fs ?? []).forEach(n =>
    fs.set(keyOf(n.path), { exists: true, locked: !!n.locked, content: n.content })
  );
  const setFs = (path: string[], update: (cell: FsCell) => FsCell) => {
    const k = keyOf(path);
    fs.set(k, update(fs.get(k) ?? { exists: false, locked: false }));
  };

  const fsPredicates: EvalContext['fs'] = {
    exists: path => fs.get(keyOf(path))?.exists ?? false,
    unlocked: path => {
      const c = fs.get(keyOf(path));
      return !!c && c.exists && !c.locked;
    },
    content: path => fs.get(keyOf(path))?.content ?? null,
  };

  const queue: XPEvent[] = [...events];

  const applyAction = (a: Action, event: XPEvent) => {
    if ('setFlag' in a) {
      const prev = flags[a.setFlag];
      const next = a.value ?? true;
      flags[a.setFlag] = next;
      if (prev !== next) queue.push({ type: 'flag:change', flag: a.setFlag, value: next });
    } else if ('incFlag' in a) {
      const prev = flags[a.incFlag];
      const next = (typeof prev === 'number' ? prev : 0) + (a.by ?? 1);
      flags[a.incFlag] = next;
      if (prev !== next) queue.push({ type: 'flag:change', flag: a.incFlag, value: next });
    } else if ('unlock' in a) {
      setFs(a.unlock, c => ({ ...c, exists: true, locked: false }));
      actions.push(a);
    } else if ('addFile' in a) {
      const node = a.addFile.node as { locked?: boolean; content?: string } | undefined;
      // A `contentKey` overrides inline content (#207). Headless has no active
      // locale, so `resolveText` falls back across every table that defines it.
      const content = a.addFile.contentKey
        ? resolveText(scenario.strings, '', a.addFile.contentKey)
        : node?.content;
      setFs(a.addFile.path, () => ({
        exists: true,
        locked: !!node?.locked,
        content,
      }));
      actions.push(a);
    } else if ('removeFile' in a) {
      setFs(a.removeFile, c => ({ ...c, exists: false }));
      actions.push(a);
    } else if ('writeFile' in a) {
      setFs(a.writeFile.path, c => ({ ...c, exists: true, content: a.writeFile.content }));
      actions.push(a);
    } else if ('emit' in a) {
      queue.push(a.emit);
      actions.push(a);
    } else if ('after' in a) {
      a.after.do.forEach(nested => applyAction(nested, event)); // headless: "eventually" = now
    } else {
      actions.push(a); // notify / qqMessage / qqOnline / openApp / openFile / playSound / alert
    }
  };

  let processed = 0;
  while (queue.length) {
    if (++processed > cap) {
      throw new Error(`solveScenario exceeded ${cap} events — likely an emit cycle`);
    }
    const event = queue.shift() as XPEvent;
    // Player-authored filesystem events happen before ScenarioRunner observes
    // them in the live desktop. Mirror that ordering so FS predicates can gate
    // the same trigger during headless rehearsal (#267).
    if (event.type === 'file:update' && event.content !== undefined) {
      setFs(event.path, cell => ({ ...cell, exists: true, content: event.content }));
    } else if (event.type === 'file:unlock') {
      // The public event predates path-aware events and only carries `name`.
      // Update every seeded node with that basename; duplicate names are
      // indistinguishable to the runtime event contract as well.
      fs.forEach((cell, key) => {
        const segments = key.split('/');
        if (segments[segments.length - 1] === event.name) {
          fs.set(key, { ...cell, exists: true, locked: false });
        }
      });
    }
    journal = appendJournal(journal, event);
    scenario.triggers.forEach((trigger, index) => {
      if (!matchOn(trigger.on, event.type)) return;
      const key = trigger.id ?? String(index);
      const c = fired[key] ?? 0;
      if (trigger.once && c >= 1) return;
      if (trigger.max !== undefined && c >= trigger.max) return;
      if (!evaluateCondition(trigger.when, { flags, event, journal, fs: fsPredicates })) return;
      fired[key] = c + 1;
      trigger.do.forEach(a => applyAction(a, event));
    });
  }

  return { flags, journal, fired, actions };
};

/** Whether the solved run ran at least one action of the given kind (e.g. `'unlock'`). */
export const ranAction = (result: SolveResult, kind: string): boolean =>
  result.actions.some(a => kind in a);
