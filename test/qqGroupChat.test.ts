import { describe, expect, it } from 'vitest';
import { findQQGroupConversation } from '../src/apps/QQ/QQGroupChat';
import type { QQArchive } from '../src/data/qq/types';

const archives: QQArchive[] = [
  {
    id: 'one',
    conversations: [
      {
        id: 'direct',
        title: 'Direct',
        kind: 'direct',
        memberIds: ['alice'],
        messages: [],
      },
      {
        id: 'group-a',
        title: 'Group A',
        kind: 'group',
        memberIds: ['alice', 'bob'],
        messages: [],
      },
    ],
  },
  {
    id: 'two',
    conversations: [
      {
        id: 'group-b',
        title: 'Group B',
        kind: 'group',
        memberIds: ['carol'],
        messages: [],
      },
    ],
  },
];

describe('QQ group conversation routing (#311)', () => {
  it('falls back to the first authored group conversation', () => {
    expect(findQQGroupConversation(archives)).toMatchObject({
      archive: { id: 'one' },
      conversation: { id: 'group-a', kind: 'group' },
    });
  });

  it('honors serializable archive and conversation ids', () => {
    expect(findQQGroupConversation(archives, 'two', 'group-b')).toMatchObject({
      archive: { id: 'two' },
      conversation: { id: 'group-b' },
    });
    expect(findQQGroupConversation(archives, 'one', 'direct')).toBeUndefined();
  });
});
