/**
 * Scenario author toolchain — Layer 3: the Puzzle Dependency Graph (PUZZLE-DESIGN §4).
 *
 * Ron Gilbert's Puzzle Dependency Charts as the *authoring model*, not just a
 * diagram. Authors declare puzzle nodes with `requires` / `solvedWhen` / `grants`;
 * {@link compilePuzzleGraph} derives the Layer-1 triggers (gating + reveals) that
 * run on the shipped scenario runtime (#84); {@link lintPuzzleGraph} checks what
 * PDCs were invented to catch — unreachable puzzles, dependency cycles, gate
 * bypasses, required steps with no hint ladder — and reports "bushiness" (how
 * many puzzles are open in parallel at each depth) for pacing.
 */
import type { XPEventType } from '../events';
import { all, flag, setFlag } from './builder';
import type { Action, Condition, FlagValue, Scenario, Trigger } from './types';

/** A hint rung for a puzzle's anti-stuck ladder (M12). */
export interface PuzzleHint {
  afterMs?: number;
  text: string;
}

/** One node in the dependency graph. */
export interface PuzzleNode {
  /** Stable id (referenced by other nodes' `requires`). */
  id: string;
  /** Puzzle ids that must be solved before this one can be solved. */
  requires?: string[];
  /**
   * Event type(s) that re-check `solvedWhen`. Derived from `solvedWhen`'s
   * `happened`/`count` types when omitted; required when `solvedWhen` only reads
   * flags/FS/the triggering event's payload.
   */
  on?: XPEventType | XPEventType[];
  /** The condition that marks this puzzle solved. */
  solvedWhen: Condition;
  /** Actions performed once, when the puzzle is solved (reveals, unlocks). */
  grants?: Action[];
  /** Hint ladder (M12 anti-stuck contract; checked by the linter). */
  hints?: PuzzleHint[];
  /** Marks an act bottleneck: everything "after" it must transitively require it. */
  gate?: boolean;
}

/** A complete puzzle dependency graph. */
export interface PuzzleGraph {
  /** Scenario id of the compiled output. */
  id: string;
  initialFlags?: Record<string, FlagValue>;
  puzzles: PuzzleNode[];
}

/** The flag a solved puzzle sets (and that dependents gate on). */
export const solvedFlag = (puzzleId: string): string => `solved:${puzzleId}`;

/** Collect the event types a condition observes (for deriving a trigger's `on`). */
const collectEventTypes = (c: Condition, acc: Set<XPEventType>): void => {
  if ('all' in c) c.all.forEach(x => collectEventTypes(x, acc));
  else if ('any' in c) c.any.forEach(x => collectEventTypes(x, acc));
  else if ('not' in c) collectEventTypes(c.not, acc);
  else if ('happened' in c) acc.add(c.happened.type);
  else if ('count' in c) acc.add(c.count.type);
};

const deriveOn = (node: PuzzleNode): XPEventType[] => {
  if (node.on) return Array.isArray(node.on) ? node.on : [node.on];
  const acc = new Set<XPEventType>();
  collectEventTypes(node.solvedWhen, acc);
  return [...acc];
};

/**
 * Compile a puzzle graph to the Layer-1 {@link Scenario}. Each puzzle becomes a
 * fire-once trigger gated on `requires` (solved flags) + `solvedWhen`, whose
 * actions set the puzzle's solved flag and run its `grants`.
 */
export const compilePuzzleGraph = (graph: PuzzleGraph): Scenario => {
  const triggers: Trigger[] = graph.puzzles.map(p => {
    const reqConds = (p.requires ?? []).map(r => flag(solvedFlag(r)));
    const conds = [...reqConds, p.solvedWhen];
    const when = conds.length === 1 ? conds[0] : all(...conds);
    return {
      id: `puzzle:${p.id}`,
      on: deriveOn(p),
      once: true,
      when,
      do: [setFlag(solvedFlag(p.id)), ...(p.grants ?? [])],
    };
  });
  return {
    id: graph.id,
    ...(graph.initialFlags ? { initialFlags: graph.initialFlags } : {}),
    triggers,
  };
};

export interface GraphLintIssue {
  puzzle?: string;
  level: 'error' | 'warn' | 'info';
  message: string;
}

export interface PuzzleGraphReport {
  issues: GraphLintIssue[];
  /** Count of puzzles at each dependency depth (0 = roots). Pacing/"bushiness". */
  bushiness: number[];
  /** The widest level — the most puzzles a player can juggle at once. */
  maxParallel: number;
  /** True when there are no error-level issues. */
  ok: boolean;
}

/**
 * Statically analyse a puzzle graph. Errors (missing requires, cycles,
 * unreachable, no trigger event) mean the graph can't run correctly; warnings
 * (no hint ladder, gate bypass) are design smells. Also computes bushiness.
 */
export const lintPuzzleGraph = (graph: PuzzleGraph): PuzzleGraphReport => {
  const issues: GraphLintIssue[] = [];
  const ids = new Set(graph.puzzles.map(p => p.id));
  const byId = new Map(graph.puzzles.map(p => [p.id, p]));
  const reqs = (id: string): string[] => byId.get(id)?.requires ?? [];

  // Missing / self references.
  graph.puzzles.forEach(p => {
    (p.requires ?? []).forEach(r => {
      if (r === p.id) issues.push({ puzzle: p.id, level: 'error', message: 'requires itself' });
      else if (!ids.has(r)) issues.push({ puzzle: p.id, level: 'error', message: `requires unknown puzzle "${r}"` });
    });
  });

  // Cycle detection (DFS colouring).
  const color = new Map<string, 0 | 1 | 2>();
  const inCycle = new Set<string>();
  const dfs = (id: string): boolean => {
    color.set(id, 1);
    for (const r of reqs(id)) {
      if (!ids.has(r)) continue;
      const c = color.get(r) ?? 0;
      if (c === 1) {
        inCycle.add(id);
        inCycle.add(r);
        return true;
      }
      if (c === 0 && dfs(r)) {
        inCycle.add(id);
        return true;
      }
    }
    color.set(id, 2);
    return false;
  };
  graph.puzzles.forEach(p => {
    if ((color.get(p.id) ?? 0) === 0) dfs(p.id);
  });
  inCycle.forEach(id => issues.push({ puzzle: id, level: 'error', message: 'is part of a dependency cycle (deadlock)' }));

  // Reachability: a puzzle is reachable if all its requires exist, are reachable,
  // and it is not in a cycle. Fixpoint iteration.
  const reachable = new Set<string>();
  let changed = true;
  while (changed) {
    changed = false;
    graph.puzzles.forEach(p => {
      if (reachable.has(p.id) || inCycle.has(p.id)) return;
      const ok = (p.requires ?? []).every(r => ids.has(r) && reachable.has(r) && !inCycle.has(r));
      if (ok) {
        reachable.add(p.id);
        changed = true;
      }
    });
  }
  graph.puzzles.forEach(p => {
    if (!reachable.has(p.id) && !inCycle.has(p.id)) {
      issues.push({ puzzle: p.id, level: 'error', message: 'is unreachable (a required puzzle is missing or unreachable)' });
    }
  });

  // Trigger event derivable?
  graph.puzzles.forEach(p => {
    if (deriveOn(p).length === 0) {
      issues.push({ puzzle: p.id, level: 'error', message: 'has no trigger event — set `on`, or use a `happened`/`count` condition so `solvedWhen` is re-checked' });
    }
  });

  // Hint ladder (M12): every puzzle should have hints.
  graph.puzzles.forEach(p => {
    if (!p.hints?.length) issues.push({ puzzle: p.id, level: 'warn', message: 'has no hint ladder (M12 anti-stuck contract)' });
  });

  // Transitive requires (only over reachable, acyclic edges).
  const transReqCache = new Map<string, Set<string>>();
  const transReq = (id: string, seen = new Set<string>()): Set<string> => {
    if (transReqCache.has(id)) return transReqCache.get(id) as Set<string>;
    if (seen.has(id)) return new Set();
    seen.add(id);
    const out = new Set<string>();
    for (const r of reqs(id)) {
      if (!ids.has(r)) continue;
      out.add(r);
      transReq(r, seen).forEach(x => out.add(x));
    }
    transReqCache.set(id, out);
    return out;
  };

  // Gate bypass: everything not upstream of a gate must transitively require it.
  graph.puzzles
    .filter(p => p.gate)
    .forEach(gate => {
      const upstream = transReq(gate.id); // gate's own prerequisites
      graph.puzzles.forEach(p => {
        if (p.id === gate.id || upstream.has(p.id)) return; // gate itself / its prereqs are fine
        if (!transReq(p.id).has(gate.id)) {
          issues.push({ puzzle: p.id, level: 'warn', message: `bypasses gate "${gate.id}" (does not transitively require it)` });
        }
      });
    });

  // Bushiness: depth = longest requires-chain; count puzzles per depth.
  const depthCache = new Map<string, number>();
  const depth = (id: string, seen = new Set<string>()): number => {
    if (depthCache.has(id)) return depthCache.get(id) as number;
    if (seen.has(id)) return 0; // cycle guard
    seen.add(id);
    const rs = reqs(id).filter(r => ids.has(r));
    const d = rs.length === 0 ? 0 : 1 + Math.max(...rs.map(r => depth(r, seen)));
    depthCache.set(id, d);
    return d;
  };
  const bushiness: number[] = [];
  graph.puzzles.forEach(p => {
    const d = inCycle.has(p.id) ? 0 : depth(p.id);
    bushiness[d] = (bushiness[d] ?? 0) + 1;
  });
  for (let i = 0; i < bushiness.length; i++) if (bushiness[i] === undefined) bushiness[i] = 0;
  const maxParallel = bushiness.length ? Math.max(...bushiness) : 0;

  return { issues, bushiness, maxParallel, ok: !issues.some(i => i.level === 'error') };
};
