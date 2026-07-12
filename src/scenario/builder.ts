/**
 * Scenario author toolchain — Layer 2: typed fluent builder (PUZZLE-DESIGN §4).
 *
 * A TypeScript API that compiles to the Layer-1 {@link Scenario} JSON (#84), so
 * developers get autocomplete over the event catalog and compile-time payload
 * checking, while non-programmers keep hand-writing the same JSON. Both audiences
 * share one runtime, one save format, one linter — no dual implementations.
 *
 *   const s = defineScenario('county-2007')
 *     .initialFlag('act', 1);
 *   s.on('file:open', { name: '日记.txt' })
 *     .when(not(flag('readDiary')))
 *     .once()
 *     .do(setFlag('readDiary'), after(ms('3s'), qqOnline('crystal')));
 *   export default s.build();
 */
import type { XPEvent, XPEventType } from '../events';
import type { FileNode } from '../types';
import type { Action, Condition, FlagValue, Scalar, Scenario, Trigger } from './types';

// ── condition helpers ───────────────────────────────────────────────────────
export const all = (...cs: Condition[]): Condition => ({ all: cs });
export const any = (...cs: Condition[]): Condition => ({ any: cs });
export const not = (c: Condition): Condition => ({ not: c });
export const flag = (name: string, cmp?: { eq?: FlagValue; gte?: number; lte?: number }): Condition => ({ flag: name, ...cmp });
export const eventMatch = (match: Record<string, Scalar | Scalar[]>): Condition => ({ event: match });
export const happened = (type: XPEventType, match?: Record<string, Scalar | Scalar[]>): Condition => ({ happened: { type, match } });
export const count = (type: XPEventType, cmp: { gte?: number; lte?: number; eq?: number }, match?: Record<string, Scalar | Scalar[]>): Condition => ({ count: { type, match }, ...cmp });
export const exists = (path: string[]): Condition => ({ exists: path });
export const unlocked = (path: string[]): Condition => ({ unlocked: path });
export const contentContains = (path: string[], contains: string): Condition => ({ contentContains: { path, contains } });
export const pinned = (itemId: string): Condition => ({ pinned: itemId });
export const linked = (a: string, b: string): Condition => ({ linked: { a, b } });

// ── action helpers ───────────────────────────────────────────────────────────
export const setFlag = (name: string, value?: FlagValue): Action => ({ setFlag: name, ...(value !== undefined ? { value } : {}) });
export const incFlag = (name: string, by?: number): Action => ({ incFlag: name, ...(by !== undefined ? { by } : {}) });
export const unlock = (path: string[]): Action => ({ unlock: path });
export const addFile = (path: string[], node?: Partial<FileNode>): Action => ({ addFile: { path, ...(node ? { node } : {}) } });
export const removeFile = (path: string[]): Action => ({ removeFile: path });
export const writeFile = (path: string[], content: string): Action => ({ writeFile: { path, content } });
export const notify = (opts: { title: string; body?: string; icon?: string; timeout?: number; anchorId?: string }): Action => ({ notify: opts });
export const qqMessage = (buddyId: string, text: string): Action => ({ qqMessage: { buddyId, text } });
export const qqOnline = (buddyId: string): Action => ({ qqOnline: buddyId });
export const openApp = (appId: string, props?: Record<string, unknown>): Action => ({ openApp: { appId, ...(props ? { props } : {}) } });
export const openFile = (path: string[]): Action => ({ openFile: path });
export const playSound = (name: string): Action => ({ playSound: name });
export const emit = (event: XPEvent): Action => ({ emit: event });
export const alert = (title: string, message: string): Action => ({ alert: { title, message } });
export const after = (delayMs: number, ...actions: Action[]): Action => ({ after: { ms: delayMs, do: actions } });

/** Parse a duration to milliseconds. Accepts a number (ms) or `'90s'`/`'10m'`/`'1h'`. */
export const ms = (spec: number | string): number => {
  if (typeof spec === 'number') return spec;
  const m = /^(\d+(?:\.\d+)?)\s*(ms|s|m|h)?$/.exec(spec.trim());
  if (!m) throw new Error(`invalid duration: ${spec}`);
  const factor: Record<string, number> = { ms: 1, s: 1000, m: 60000, h: 3600000 };
  return parseFloat(m[1] as string) * (factor[m[2] ?? 'ms'] ?? 1);
};

/** A trigger under construction; commit it with `.do(...)`. */
class TriggerBuilder {
  private whenCond?: Condition;
  private onceFlag = false;
  private maxN?: number;
  private triggerId?: string;

  constructor(
    private readonly parent: ScenarioBuilder,
    private readonly on: XPEventType | XPEventType[],
    private readonly matchCond?: Condition
  ) {}

  when(c: Condition): this {
    this.whenCond = c;
    return this;
  }
  once(): this {
    this.onceFlag = true;
    return this;
  }
  max(n: number): this {
    this.maxN = n;
    return this;
  }
  id(name: string): this {
    this.triggerId = name;
    return this;
  }

  /** Commit the trigger with its action list and return the scenario for chaining. */
  do(...actions: Action[]): ScenarioBuilder {
    const conds = [this.matchCond, this.whenCond].filter(Boolean) as Condition[];
    const when = conds.length === 0 ? undefined : conds.length === 1 ? conds[0] : { all: conds };
    const trigger: Trigger = {
      ...(this.triggerId ? { id: this.triggerId } : {}),
      on: this.on,
      ...(when ? { when } : {}),
      do: actions,
      ...(this.onceFlag ? { once: true } : {}),
      ...(this.maxN !== undefined ? { max: this.maxN } : {}),
    };
    this.parent._push(trigger);
    return this.parent;
  }
}

/** A scenario under construction. Call `.build()` for the Layer-1 {@link Scenario}. */
export class ScenarioBuilder {
  private readonly initial: Record<string, FlagValue> = {};
  private readonly triggers: Trigger[] = [];

  constructor(private readonly scenarioId: string) {}

  /** Seed an initial flag value. */
  initialFlag(name: string, value: FlagValue): this {
    this.initial[name] = value;
    return this;
  }

  /**
   * Begin a trigger. An optional `match` becomes an implicit `event` payload
   * condition ANDed with any `.when(...)`.
   */
  on(on: XPEventType | XPEventType[], match?: Record<string, Scalar | Scalar[]>): TriggerBuilder {
    return new TriggerBuilder(this, on, match ? { event: match } : undefined);
  }

  /** @internal */
  _push(trigger: Trigger): void {
    this.triggers.push(trigger);
  }

  /** Compile to the Layer-1 Scenario JSON. */
  build(): Scenario {
    return {
      id: this.scenarioId,
      ...(Object.keys(this.initial).length ? { initialFlags: { ...this.initial } } : {}),
      triggers: this.triggers.slice(),
    };
  }
}

/** Start a fluent scenario definition (Layer 2). */
export const defineScenario = (id: string): ScenarioBuilder => new ScenarioBuilder(id);
