import { describe, expect, it } from 'vitest';
import { searchQQArchive } from '../src/apps/QQ/QQArchive';
import type { QQArchive } from '../src/data/qq/types';

const archive: QQArchive = {
  id: 'case-chat',
  conversations: [
    {
      id: 'group-1',
      title: 'Old classmates',
      kind: 'group',
      memberIds: ['alice', 'bob'],
      messages: [
        {
          id: 'm1',
          senderId: 'alice',
          senderName: 'Alice',
          sentAt: '2006-08-12T12:00:00Z',
          text: 'Meet at the station.',
        },
        {
          id: 'm2',
          senderId: 'bob',
          senderName: 'Bob',
          sentAt: '2006-08-12T12:02:00Z',
          text: 'I sent the photo.',
          attachments: [{ id: 'a1', name: 'platform.jpg', content: { asset: 'platform-photo' } }],
        },
      ],
    },
  ],
};

describe('QQ archive search (#280)', () => {
  it('searches sender, body, and attachment names deterministically', () => {
    expect(searchQQArchive(archive, 'alice').map(item => item.id)).toEqual(['m1']);
    expect(searchQQArchive(archive, 'STATION').map(item => item.id)).toEqual(['m1']);
    expect(searchQQArchive(archive, 'platform.jpg').map(item => item.id)).toEqual(['m2']);
  });
});
