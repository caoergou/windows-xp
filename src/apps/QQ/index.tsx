import React from 'react';
import QQClient from './QQClient';
import QQChat from './QQChat';
import QQArchive from './QQArchive';

/**
 * QQ Messenger (#119) - a **single app** (appId 'QQ'), not split into multiple registry entries.
 *
 * The same registry entry dispatches views by props:
 *   - view='chat' + buddyId -> chat window;
 *   - otherwise -> client main flow (login -> logging-in -> main panel, morphing in the same window).
 *
 * The main panel and each chat window share appId 'QQ' and the same runtime store (qqStore),
 * restored precisely from persisted componentProps after refresh.
 */
export interface QQProps {
  windowId?: string;
  /** View dispatch identifier (for persistence). */
  view?: 'client' | 'chat' | 'archive';
  /** Chat target when view='chat'. */
  buddyId?: string;
  /** "Version too low" easter egg switch (off by default). */
  versionEgg?: boolean;
  archiveId?: string;
}

const QQ: React.FC<QQProps> = ({ view, buddyId, windowId, versionEgg, archiveId }) => {
  if (view === 'chat' && buddyId) {
    return <QQChat buddyId={buddyId} windowId={windowId} />;
  }
  if (view === 'archive') return <QQArchive archiveId={archiveId} />;
  return <QQClient windowId={windowId} versionEgg={versionEgg} />;
};

export default QQ;
