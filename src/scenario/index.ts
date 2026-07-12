export * from './types';
export { evaluateEvent, evalCondition, matchesEvent, initialState } from './engine';

import type { Scenario } from './types';

/**
 * Identity helper for authoring a {@link Scenario} with types + light dev
 * validation (#84). Warns on duplicate trigger ids, which would corrupt
 * `once`/`max` bookkeeping.
 */
const IS_DEV = import.meta.env?.DEV ?? true;

export function defineScenario(scenario: Scenario): Scenario {
  if (IS_DEV) {
    const seen = new Set<string>();
    for (const trigger of scenario.triggers ?? []) {
      if (!trigger.id) {
        console.warn('[windows-xp] defineScenario: a trigger is missing its `id`.');
      } else if (seen.has(trigger.id)) {
        console.warn(`[windows-xp] defineScenario: duplicate trigger id "${trigger.id}".`);
      }
      if (trigger.id) seen.add(trigger.id);
      if (!trigger.on) console.warn(`[windows-xp] defineScenario: trigger "${trigger.id}" has no \`on\`.`);
    }
  }
  return scenario;
}
