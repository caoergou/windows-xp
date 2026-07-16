import scenarioSchema from '../../../schema/scenario.json';

const eventTypes = scenarioSchema.definitions.trigger.properties.on.oneOf[0].enum;

/** Exact event catalog generated from `src/events.ts` into the published Scenario Schema. */
export const KNOWN_EVENT_TYPES = new Set<string>(eventTypes);
