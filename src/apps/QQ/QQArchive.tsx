import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useContentPacks } from '../../context/ContentPackContext';
import { useXPEventBus } from '../../context/EventBusContext';
import { useStorage } from '../../context/StorageContext';
import { resolveOSTheme } from '../../themes/useOSTheme';
import type { QQArchive as QQArchiveData, QQArchiveMessage } from '../../data/qq/types';

const Root = styled.div`
  height: 100%;
  display: grid;
  grid-template-columns: 190px 1fr;
  background: ${({ theme }) => resolveOSTheme(theme).tokens.SURFACE};
  color: ${({ theme }) => resolveOSTheme(theme).tokens.BLACK};
  font: 12px ${({ theme }) => resolveOSTheme(theme).fonts.UI};
`;
const Sidebar = styled.div`
  padding: 6px;
  border-right: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.DIVIDER_GREY};
  input {
    width: 100%;
    box-sizing: border-box;
    margin-bottom: 6px;
  }
  button {
    display: block;
    width: 100%;
    text-align: left;
    margin-bottom: 2px;
  }
`;
const History = styled.div`
  overflow: auto;
  padding: 8px;
  background: ${({ theme }) => resolveOSTheme(theme).tokens.WHITE};
`;
const EmptyHistory = styled(History)`
  grid-column: 1 / -1;
`;
const Message = styled.button`
  display: block;
  width: 100%;
  border: 0;
  border-bottom: 1px dotted ${({ theme }) => resolveOSTheme(theme).tokens.DIVIDER_GREY};
  background: transparent;
  padding: 6px 2px;
  text-align: left;
  font: inherit;
  time {
    float: right;
    color: ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_SHADOW};
  }
  p {
    white-space: pre-wrap;
    margin: 4px 0;
  }
`;

export const searchQQArchive = (archive: QQArchiveData, query: string): QQArchiveMessage[] => {
  const needle = query.trim().toLocaleLowerCase();
  const messages = archive.conversations.flatMap(item => item.messages);
  if (!needle) return messages;
  return messages.filter(message =>
    [message.senderName, message.text, ...(message.attachments?.map(item => item.name) ?? [])]
      .join('\n')
      .toLocaleLowerCase()
      .includes(needle)
  );
};

const QQArchive: React.FC<{ archiveId?: string }> = ({ archiveId }) => {
  const { t } = useTranslation();
  const content = useContentPacks();
  const bus = useXPEventBus();
  const storage = useStorage();
  const archive = content.qqArchives.find(item => item.id === archiveId) ?? content.qqArchives[0];
  const key = storage.key(`qq_archive_${archive?.id ?? 'empty'}_query`);
  const [query, setQuery] = useState(() => storage.local.getItem(key) ?? '');
  const [conversationId, setConversationId] = useState(archive?.conversations[0]?.id ?? '');
  const conversation = archive?.conversations.find(item => item.id === conversationId);
  const resultIds = useMemo(
    () => new Set(archive ? searchQQArchive(archive, query).map(item => item.id) : []),
    [archive, query]
  );
  useEffect(() => {
    if (archive) bus.emit({ type: 'qq:archive-open', archiveId: archive.id });
  }, [archive, bus]);
  if (!archive)
    return (
      <Root data-testid="qq-archive">
        <EmptyHistory>{t('qq.archive.empty')}</EmptyHistory>
      </Root>
    );
  const updateQuery = (value: string) => {
    setQuery(value);
    storage.local.setItem(key, value);
    bus.emit({
      type: 'qq:archive-search',
      archiveId: archive.id,
      query: value,
      resultCount: searchQQArchive(archive, value).length,
    });
  };
  return (
    <Root data-testid="qq-archive">
      <Sidebar>
        <input
          aria-label={t('qq.archive.search')}
          placeholder={t('qq.archive.search')}
          value={query}
          onChange={event => updateQuery(event.target.value)}
        />
        {archive.conversations.map(item => (
          <button
            key={item.id}
            onClick={() => {
              setConversationId(item.id);
              bus.emit({ type: 'qq:archive-open', archiveId: archive.id, conversationId: item.id });
            }}
          >
            {item.kind === 'group' ? t('qq.archive.groupPrefix') : ''}
            {item.title}
          </button>
        ))}
      </Sidebar>
      <History>
        {conversation?.messages
          .filter(message => resultIds.has(message.id))
          .map(message => (
            <Message
              key={message.id}
              onClick={() =>
                bus.emit({
                  type: 'qq:archive-message-open',
                  archiveId: archive.id,
                  conversationId: conversation.id,
                  messageId: message.id,
                })
              }
            >
              <strong>{message.senderName}</strong>
              <time>{new Date(message.sentAt).toLocaleString()}</time>
              <p>{message.text}</p>
              {message.attachments?.map(attachment => (
                <span
                  key={attachment.id}
                  role="button"
                  tabIndex={0}
                  onClick={event => {
                    event.stopPropagation();
                    bus.emit({
                      type: 'qq:archive-attachment-open',
                      archiveId: archive.id,
                      conversationId: conversation.id,
                      messageId: message.id,
                      attachmentId: attachment.id,
                    });
                  }}
                >
                  {t('qq.archive.attachment', { name: attachment.name })}
                </span>
              ))}
            </Message>
          ))}
      </History>
    </Root>
  );
};

export default QQArchive;
