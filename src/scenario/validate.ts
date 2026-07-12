/**
 * Scenario validation (#208) — hand-written, zero-dependency runtime checks for
 * the otherwise-untyped JSON a story author (or a shared save) hands the engine.
 * TS only guards code; a `.json` scenario file has no compile-time safety, so a
 * typo (`setFlags` for `setFlag`, an unknown event domain, a flag read but never
 * set) would fail silently or throw deep in the runtime. This turns those into
 * up-front, path-named errors and warnings.
 *
 * Errors mean "won't run correctly" (the ScenarioRunner ignores an invalid
 * scenario rather than half-applying it); warnings mean "probably a mistake"
 * (an unknown event domain, a dangling flag reference) but still run.
 */
import type { Scenario } from './types';

/**
 * Reject a scenario larger than this — a sanity ceiling on untrusted
 * hand-written/loaded JSON, not a quota guard (a scenario object isn't persisted
 * to storage; only its derived flags/journal are). Generous on purpose: an
 * author may inline file contents via `writeFile`/`addFile`, so a real
 * content-heavy story can run to hundreds of KB. 2 MB catches pathological input
 * while comfortably fitting any genuine scenario.
 */
export const SCENARIO_MAX_BYTES = 2 * 1024 * 1024;

/** Event domains the engine emits (the prefix before `:`). Keep in sync with `events.ts`. */
const KNOWN_EVENT_DOMAINS = new Set([
  'app', 'cmd', 'contextmenu', 'deduction', 'evidence', 'file', 'flag', 'folder', 'game', 'ie',
  'install', 'lesson', 'link', 'media', 'notification', 'password', 'qq', 'recyclebin',
  'screensaver', 'search', 'session', 'startmenu', 'time', 'ui', 'user', 'wallpaper', 'window',
]);

/** Known action keys and the required shape of each (beyond the discriminant). */
const ACTION_KEYS = new Set([
  'setFlag', 'incFlag', 'unlock', 'addFile', 'removeFile', 'writeFile', 'notify',
  'qqMessage', 'qqOnline', 'openApp', 'openFile', 'playSound', 'emit', 'alert',
  'note', 'removeNote', 'after',
]);

const CONDITION_KEYS = new Set([
  'all', 'any', 'not', 'flag', 'event', 'happened', 'count', 'exists', 'unlocked',
  'contentContains', 'pinned', 'linked', 'searched', 'found',
]);

export interface ScenarioValidation {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

export class ScenarioValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ScenarioValidationError';
  }
}

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every(x => typeof x === 'string');
const desc = (v: unknown): string =>
  v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v === 'undefined' ? 'undefined' : typeof v;

/**
 * Validate a scenario object. Returns collected `errors` / `warnings`, each
 * prefixed with the offending path (e.g. `triggers[0].do[1]`). Never throws.
 */
export const validateScenario = (scenario: unknown): ScenarioValidation => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Size guard.
  try {
    const bytes = JSON.stringify(scenario)?.length ?? 0;
    if (bytes > SCENARIO_MAX_BYTES) {
      errors.push(`scenario is too large (${Math.round(bytes / 1024)} KB > ${SCENARIO_MAX_BYTES / 1024} KB limit)`);
      return { ok: false, errors, warnings };
    }
  } catch {
    errors.push('scenario is not JSON-serializable (circular reference?)');
    return { ok: false, errors, warnings };
  }

  if (!isObj(scenario)) {
    errors.push(`scenario: expected an object, got ${desc(scenario)}`);
    return { ok: false, errors, warnings };
  }
  if (typeof scenario.id !== 'string' || scenario.id === '') {
    errors.push('scenario.id: expected a non-empty string');
  }
  if (scenario.initialFlags !== undefined && !isObj(scenario.initialFlags)) {
    errors.push(`scenario.initialFlags: expected an object, got ${desc(scenario.initialFlags)}`);
  }
  if (!Array.isArray(scenario.triggers)) {
    errors.push(`scenario.triggers: expected an array, got ${desc(scenario.triggers)}`);
    return { ok: false, errors, warnings };
  }

  // String tables (#207): the keys defined across all locales, and whether the
  // author has opted into extraction at all.
  const stringKeys = new Set<string>();
  if (isObj(scenario.strings)) {
    for (const table of Object.values(scenario.strings)) {
      if (isObj(table)) Object.keys(table).forEach(k => stringKeys.add(k));
    }
  }
  const hasStrings = stringKeys.size > 0;
  let inlineTextCount = 0; // beat literals still inline once a string table exists

  // Check a beat action's text fields (#207): a `*Key` must resolve to a defined
  // string; remaining inline literals are counted for one summary nudge below.
  const checkText = (obj: Record<string, unknown>, path: string, pairs: [string, string][]): void => {
    for (const [literalField, keyField] of pairs) {
      const key = obj[keyField];
      if (typeof key === 'string' && !stringKeys.has(key)) {
        warnings.push(`${path}.${keyField}: references string key "${key}" not found in any locale table`);
      }
      if (hasStrings && key === undefined && typeof obj[literalField] === 'string') {
        inlineTextCount += 1;
      }
    }
  };

  // Flag reference consistency: collect what's set vs. what's read.
  const setFlags = new Set<string>(
    isObj(scenario.initialFlags) ? Object.keys(scenario.initialFlags) : []
  );
  const readFlags = new Set<string>();

  const checkCondition = (cond: unknown, path: string): void => {
    if (!isObj(cond)) {
      errors.push(`${path}: expected a condition object, got ${desc(cond)}`);
      return;
    }
    const keys = Object.keys(cond);
    const key = keys.find(k => CONDITION_KEYS.has(k));
    if (!key) {
      errors.push(`${path}: unknown condition — expected one of ${[...CONDITION_KEYS].join('/')}`);
      return;
    }
    if (key === 'all' || key === 'any') {
      if (!Array.isArray(cond[key])) errors.push(`${path}.${key}: expected an array of conditions`);
      else (cond[key] as unknown[]).forEach((c, i) => checkCondition(c, `${path}.${key}[${i}]`));
    } else if (key === 'not') {
      checkCondition(cond.not, `${path}.not`);
    } else if (key === 'flag') {
      if (typeof cond.flag !== 'string') errors.push(`${path}.flag: expected a string`);
      else readFlags.add(cond.flag);
    }
    // Other leaf predicates (event/happened/count/fs/board/search) are shape-light
    // by design; their misuse surfaces as a no-op, not a crash.
  };

  const checkActions = (actions: unknown, path: string): void => {
    if (!Array.isArray(actions)) {
      errors.push(`${path}: expected an array of actions, got ${desc(actions)}`);
      return;
    }
    actions.forEach((action, i) => {
      const ap = `${path}[${i}]`;
      if (!isObj(action)) {
        errors.push(`${ap}: expected an action object, got ${desc(action)}`);
        return;
      }
      const key = Object.keys(action).find(k => ACTION_KEYS.has(k));
      if (!key) {
        errors.push(`${ap}: unknown action — expected one of ${[...ACTION_KEYS].join('/')}`);
        return;
      }
      if (key === 'setFlag' || key === 'incFlag') {
        if (typeof action[key] !== 'string') errors.push(`${ap}.${key}: expected a flag name (string)`);
        else setFlags.add(action[key] as string);
      } else if (key === 'unlock' || key === 'removeFile' || key === 'openFile') {
        if (!isStringArray(action[key])) errors.push(`${ap}.${key}: expected a string[] path`);
      } else if (key === 'addFile' || key === 'writeFile') {
        const v = action[key];
        if (!isObj(v) || !isStringArray(v.path)) errors.push(`${ap}.${key}.path: expected a string[] path`);
        if (key === 'writeFile' && isObj(v) && typeof v.content !== 'string') {
          errors.push(`${ap}.writeFile.content: expected a string`);
        }
      } else if (key === 'note') {
        const v = action.note;
        if (!isObj(v) || typeof v.id !== 'string') errors.push(`${ap}.note.id: expected a string`);
        if (isObj(v) && typeof v.content !== 'string' && typeof v.contentKey !== 'string') {
          errors.push(`${ap}.note: needs a content or contentKey`);
        }
        if (isObj(v)) checkText(v, `${ap}.note`, [['title', 'titleKey'], ['content', 'contentKey']]);
      } else if (key === 'notify') {
        if (isObj(action.notify)) checkText(action.notify, `${ap}.notify`, [['title', 'titleKey'], ['body', 'bodyKey']]);
      } else if (key === 'alert') {
        if (isObj(action.alert)) checkText(action.alert, `${ap}.alert`, [['title', 'titleKey'], ['message', 'messageKey']]);
      } else if (key === 'qqMessage') {
        if (isObj(action.qqMessage)) checkText(action.qqMessage, `${ap}.qqMessage`, [['text', 'textKey']]);
      } else if (key === 'removeNote') {
        if (typeof action.removeNote !== 'string') errors.push(`${ap}.removeNote: expected a note id (string)`);
      } else if (key === 'openApp') {
        const v = action.openApp;
        if (!isObj(v) || typeof v.appId !== 'string') errors.push(`${ap}.openApp.appId: expected a string`);
      } else if (key === 'emit') {
        const v = action.emit;
        if (!isObj(v) || typeof v.type !== 'string') errors.push(`${ap}.emit.type: expected an event with a string type`);
      } else if (key === 'after') {
        const v = action.after;
        if (!isObj(v) || typeof v.ms !== 'number') errors.push(`${ap}.after.ms: expected a number`);
        else checkActions(v.do, `${ap}.after.do`);
      }
    });
  };

  scenario.triggers.forEach((trigger, i) => {
    const tp = `triggers[${i}]`;
    if (!isObj(trigger)) {
      errors.push(`${tp}: expected a trigger object, got ${desc(trigger)}`);
      return;
    }
    // `on`
    const on = trigger.on;
    const ons = typeof on === 'string' ? [on] : Array.isArray(on) ? on : null;
    if (!ons || ons.length === 0 || !ons.every(x => typeof x === 'string')) {
      errors.push(`${tp}.on: expected an event type or a non-empty array of them`);
    } else {
      for (const ev of ons) {
        if (!ev.includes(':')) errors.push(`${tp}.on: "${ev}" is not a "domain:action" event type`);
        else if (!KNOWN_EVENT_DOMAINS.has(ev.split(':')[0])) {
          warnings.push(`${tp}.on: "${ev}" has an unknown event domain — will never fire`);
        }
      }
    }
    // `when`
    if (trigger.when !== undefined) checkCondition(trigger.when, `${tp}.when`);
    // `do`
    if (trigger.do === undefined) errors.push(`${tp}.do: missing (a trigger needs at least one action)`);
    else checkActions(trigger.do, `${tp}.do`);
    // `once` / `max`
    if (trigger.once !== undefined && typeof trigger.once !== 'boolean') {
      errors.push(`${tp}.once: expected a boolean`);
    }
    if (trigger.max !== undefined && typeof trigger.max !== 'number') {
      errors.push(`${tp}.max: expected a number`);
    }
  });

  // Dangling flag references: read in a `when` but never set anywhere.
  for (const f of readFlags) {
    if (!setFlags.has(f)) {
      warnings.push(`flag "${f}" is read in a condition but never set (setFlag/incFlag/initialFlags) — the gate may never open`);
    }
  }

  // One nudge (not per-field spam): a string table exists but some beat text is
  // still inline — extract it so the whole script localizes (#207).
  if (inlineTextCount > 0) {
    warnings.push(`${inlineTextCount} beat text field(s) are still inline — extract to string keys so the whole script localizes`);
  }

  return { ok: errors.length === 0, errors, warnings };
};

/** Throw {@link ScenarioValidationError} (with all errors) if the scenario is invalid. */
export function assertValidScenario(scenario: unknown): asserts scenario is Scenario {
  const { ok, errors } = validateScenario(scenario);
  if (!ok) {
    throw new ScenarioValidationError(`Invalid scenario:\n- ${errors.join('\n- ')}`);
  }
}
