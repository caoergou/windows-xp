/**
 * Scenario string tables (#207) — "one graph, two skins". A scenario's *logic*
 * (triggers, puzzle graph) is culture-neutral; its *beat text* (balloon titles,
 * QQ lines, note bodies) lives in a per-locale string table so a writer can
 * localize/polish it without touching the rulebook.
 *
 * Actions reference a table entry by key (`titleKey`, `bodyKey`, …); the runtime
 * resolves the key against the active UI locale at fire time. Inline literals are
 * still allowed for quick prototyping (the linter nudges extraction once a table
 * exists).
 */

/** locale → key → text. e.g. `{ zh: { 'hint.door': '看便签' }, en: { 'hint.door': 'Check the note' } }`. */
export type ScenarioStrings = Partial<Record<string, Record<string, string>>>;

/**
 * Resolve a string key against the active `locale`, falling back to any other
 * table that defines it, then to the key itself (so an unresolved key is
 * visible rather than blank).
 */
export const resolveText = (
  strings: ScenarioStrings | undefined,
  locale: string,
  key: string
): string => {
  if (!strings) return key;
  const direct = strings[locale]?.[key];
  if (direct !== undefined) return direct;
  for (const table of Object.values(strings)) {
    if (table && key in table) return table[key];
  }
  return key;
};

/** Pick a literal or a resolved key — `key` wins when present. */
export const pickText = (
  strings: ScenarioStrings | undefined,
  locale: string,
  literal: string | undefined,
  key: string | undefined
): string | undefined => (key !== undefined ? resolveText(strings, locale, key) : literal);
