export interface BuddyDefinition {
  id: string;
  value: Record<string, unknown>;
}

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Find declarative QQ buddies without depending on one content-pack nesting shape. */
export const collectBuddies = (value: unknown): BuddyDefinition[] => {
  const buddies = new Map<string, Record<string, unknown>>();
  const seen = new Set<unknown>();
  const visit = (node: unknown) => {
    if (typeof node !== 'object' || node === null || seen.has(node)) return;
    seen.add(node);
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    const record = node as Record<string, unknown>;
    if (typeof record.id === 'string' && isRecord(record.reply)) buddies.set(record.id, record);
    Object.values(record).forEach(visit);
  };
  visit(value);
  return [...buddies].map(([id, definition]) => ({ id, value: definition }));
};

/** Normalize string/script fallback shapes into deterministic reply text. */
export const replyTexts = (value: unknown): string[] => {
  if (typeof value === 'string' && value.trim()) return [value];
  if (Array.isArray(value)) return value.flatMap(replyTexts);
  if (!isRecord(value)) return [];
  if (typeof value.text === 'string' && value.text.trim()) return [value.text];
  if ('steps' in value) return replyTexts(value.steps);
  return [];
};

const QQ_STATUSES = new Set<QQStatus>(['online', 'offline', 'away', 'invisible', 'busy']);

/** Build a valid one-buddy profile when authored provider data is not in the active culture. */
export const buildRehearsalProfile = (buddy: BuddyDefinition): QQProfile => {
  const value = buddy.value;
  const status =
    typeof value.status === 'string' && QQ_STATUSES.has(value.status as QQStatus)
      ? (value.status as QQStatus)
      : 'online';
  return {
    me: {
      number: '10000',
      nickname: 'Scenario Author',
      avatar: 1,
      status: 'online',
    },
    groups: [{ id: 'scenario-authoring', name: 'Scenario' }],
    buddies: [
      {
        id: buddy.id,
        number: typeof value.number === 'string' ? value.number : buddy.id,
        nickname: typeof value.nickname === 'string' ? value.nickname : buddy.id,
        avatar:
          typeof value.avatar === 'string' || typeof value.avatar === 'number' ? value.avatar : 1,
        group: 'scenario-authoring',
        status,
      },
    ],
  };
};
import type { QQProfile, QQStatus } from '../../../src/data/qq/types';
