import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../hooks/useApp';
import { useCulture } from '../../context/CultureContext';
import { useContentPacks } from '../../context/ContentPackContext';
import { useWindowId } from '../../context/WindowIdContext';
import { useWindowManager } from '../../context/WindowManagerContext';
import { defaultQQProfile } from '../../data/qq/defaultProfile';
import type {
  QQArchive,
  QQArchiveConversation,
  QQArchiveMessage,
  QQBuddy,
} from '../../data/qq/types';
import { renderMessageNodes } from './emojiRenderer';
import { qqAvatar, qqImg } from './assets';
import QQArchiveView from './QQArchive';
import QQFrame from './QQFrame';
import { ChatRoot } from './styles';

interface QQGroupChatProps {
  archiveId?: string;
  conversationId?: string;
  windowId?: string;
}

interface GroupConversationMatch {
  archive: QQArchive;
  conversation: QQArchiveConversation;
}

interface GroupMember {
  id: string;
  name: string;
  avatar: number | string;
}

/**
 * Resolve a group conversation from mounted archives. Explicit ids win; omitted
 * ids fall back to the first authored group so the classic panel has a useful,
 * backward-compatible default route.
 */
export const findQQGroupConversation = (
  archives: QQArchive[],
  archiveId?: string,
  conversationId?: string
): GroupConversationMatch | undefined => {
  const candidates = archiveId ? archives.filter(archive => archive.id === archiveId) : archives;

  if (conversationId) {
    for (const archive of candidates) {
      const conversation = archive.conversations.find(
        item => item.id === conversationId && item.kind === 'group'
      );
      if (conversation) return { archive, conversation };
    }
    return undefined;
  }

  for (const archive of candidates) {
    const conversation = archive.conversations.find(item => item.kind === 'group');
    if (conversation) return { archive, conversation };
  }

  return undefined;
};

const messageTime = (sentAt: string): string => {
  const authored = sentAt.match(/T(\d{2}:\d{2}(?::\d{2})?)/)?.[1];
  if (authored) return authored;
  const parsed = new Date(sentAt);
  return Number.isNaN(parsed.getTime()) ? sentAt : parsed.toLocaleTimeString([], { hour12: false });
};

const memberName = (
  memberId: string,
  buddies: QQBuddy[],
  messages: QQArchiveMessage[],
  me: { number: string; nickname: string }
): string =>
  (memberId === me.number ? me.nickname : buddies.find(buddy => buddy.id === memberId)?.nickname) ??
  messages.find(message => message.senderId === memberId)?.senderName ??
  memberId;

const QQGroupChat: React.FC<QQGroupChatProps> = ({ archiveId, conversationId, windowId }) => {
  const { t } = useTranslation();
  const api = useApp(windowId);
  const contextWindowId = useWindowId();
  const currentWindowId = windowId ?? contextWindowId;
  const wm = useWindowManager();
  const content = useContentPacks();
  const { culture } = useCulture();
  const profile = culture.qq ?? defaultQQProfile;
  const match = useMemo(
    () => findQQGroupConversation(content.qqArchives, archiveId, conversationId),
    [archiveId, content.qqArchives, conversationId]
  );
  const conversation = match?.conversation;
  const [messages, setMessages] = useState<QQArchiveMessage[]>(conversation?.messages ?? []);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const localMessageId = useRef(0);
  const groupIcon = qqImg('ChatRoomButton.png') || qqImg('im/icon.png');

  useEffect(() => {
    setMessages(conversation?.messages ?? []);
  }, [conversation]);

  useEffect(() => {
    const title = conversation?.title ?? t('qq.groupChat.noConversationTitle');
    api.window.setTitle(t('qq.groupChat.windowTitle', { title }));
  }, [api, conversation?.title, t]);

  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages.length]);

  const members = useMemo<GroupMember[]>(
    () =>
      (conversation?.memberIds ?? []).map(id => {
        const buddy = profile.buddies.find(item => item.id === id);
        return {
          id,
          name: memberName(id, profile.buddies, conversation?.messages ?? [], profile.me),
          avatar: buddy?.avatar ?? (id === profile.me.number ? profile.me.avatar : 1),
        };
      }),
    [conversation, profile]
  );

  const send = () => {
    const text = inputRef.current?.value.trim() ?? '';
    if (!text || !conversation) return;
    localMessageId.current += 1;
    setMessages(current => [
      ...current,
      {
        id: `local-${currentWindowId}-${localMessageId.current}`,
        senderId: profile.me.number,
        senderName: profile.me.nickname,
        sentAt: new Date().toISOString(),
        text,
      },
    ]);
    if (inputRef.current) inputRef.current.value = '';
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  };

  const openArchive = () => {
    if (!match) return;
    const existing = wm.windows.find(window => {
      const props = window.componentProps as {
        view?: string;
        archiveId?: string;
        conversationId?: string;
      };
      return (
        window.appId === 'QQ' &&
        props.view === 'archive' &&
        props.archiveId === match.archive.id &&
        props.conversationId === match.conversation.id
      );
    });
    if (existing) {
      wm.focusWindow(existing.id);
      return;
    }
    wm.openWindow(
      'QQ',
      t('qq.archive.title'),
      <QQArchiveView archiveId={match.archive.id} conversationId={match.conversation.id} />,
      'qq',
      {
        width: 720,
        height: 520,
        minWidth: 620,
        minHeight: 420,
        componentProps: {
          view: 'archive',
          archiveId: match.archive.id,
          conversationId: match.conversation.id,
        },
      }
    );
  };

  const title = conversation?.title ?? t('qq.groupChat.noConversationTitle');

  return (
    <QQFrame
      variant="chat"
      title={t('qq.groupChat.windowTitle', { title })}
      onMinimize={() => api.window.minimize()}
      onMaximize={() => api.window.maximize()}
      onClose={() => api.window.close()}
    >
      <ChatRoot data-testid="qq-group-chat">
        <div className="qq-im-big-toolbar">
          <button className="im-big-msg" disabled={!conversation}>
            {t('qq.groupChat.groupInfo')}
          </button>
          <button className="im-big-file" disabled={!conversation}>
            {t('qq.groupChat.groupFiles')}
          </button>
          <button className="im-big-video" disabled={!conversation}>
            {t('qq.groupChat.groupAlbum')}
          </button>
          <button className="im-big-invite" disabled={!conversation}>
            {t('qq.groupChat.invite')}
          </button>
        </div>

        <div className="qq-im-contant">
          <div className="qq-im-main">
            <div className="qq-im-chat">
              <div className="qq-im-chat-msg">
                <div className="qq-im-friend-info" data-testid="qq-group-identity">
                  <img src={groupIcon} alt="" />
                  {conversation
                    ? t('qq.groupChat.identity', {
                        title: conversation.title,
                        count: members.length,
                      })
                    : t('qq.groupChat.noConversationHint')}
                </div>
                <ul className="qq-im-chat-msg-list" data-testid="qq-group-messages" ref={listRef}>
                  {!conversation && (
                    <li className="qq-group-empty">{t('qq.groupChat.noConversationHint')}</li>
                  )}
                  {conversation && messages.length === 0 && (
                    <li className="qq-group-empty">{t('qq.groupChat.noMessages')}</li>
                  )}
                  {messages.map(message => (
                    <li
                      key={message.id}
                      className={message.senderId === profile.me.number ? 'my' : ''}
                    >
                      <p>
                        {message.senderName}
                        <span>{messageTime(message.sentAt)}</span>
                      </p>
                      <p>{renderMessageNodes(message.text)}</p>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="qq-im-chat-toolbar">
                <button className="im-toolbar-font" title={t('qq.groupChat.font')} disabled />
                <button className="im-toolbar-face" title={t('qq.groupChat.emoji')} disabled />
                <span className="sep" />
                <button className="im-toolbar-picture" title={t('qq.groupChat.picture')} disabled />
                <button
                  className="im-toolbar-catch"
                  title={t('qq.groupChat.screenshot')}
                  disabled
                />
              </div>
              <textarea
                className="qq-im-chat-send"
                data-testid="qq-group-input"
                ref={inputRef}
                aria-label={t('qq.groupChat.composer')}
                disabled={!conversation}
                onKeyDown={onKeyDown}
              />
            </div>

            <div className="qq-im-btns">
              <button
                className="qq-btn"
                data-testid="qq-group-history"
                disabled={!conversation}
                onClick={openArchive}
              >
                {t('qq.groupChat.history')}
              </button>
              <button className="qq-btn" disabled>
                {t('qq.groupChat.messageMode')}
              </button>
              <span />
              <button className="qq-btn" onClick={() => api.window.close()}>
                {t('qq.groupChat.close')}
              </button>
              <button
                className="qq-btn"
                data-testid="qq-group-send"
                disabled={!conversation}
                onClick={send}
              >
                {t('qq.groupChat.send')}
              </button>
            </div>
          </div>

          <div className="qq-im-side">
            <button className="qq-im-side-btn">
              {t('qq.groupChat.members', { count: members.length })}
            </button>
            <div className="qq-group-member-list" data-testid="qq-group-members">
              {members.map(member => (
                <div className="qq-group-member" key={member.id}>
                  <img src={qqAvatar(member.avatar)} alt="" />
                  <span>{member.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ChatRoot>
    </QQFrame>
  );
};

export default QQGroupChat;
