import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useContentPacks } from '../../context/ContentPackContext';
import { useXPEventBus } from '../../context/EventBusContext';
import { useStorage } from '../../context/StorageContext';
import { useCulture } from '../../context/CultureContext';
import { resolveOSTheme } from '../../themes/useOSTheme';
import { qqAvatar, qqImg } from './assets';
import type {
  QQArchive as QQArchiveData,
  QQArchiveConversation,
  QQArchiveMessage,
} from '../../data/qq/types';

const Root = styled.div`
  height: 100%;
  min-height: 330px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: ${({ theme }) => resolveOSTheme(theme).tokens.SURFACE};
  color: ${({ theme }) => resolveOSTheme(theme).tokens.BLACK};
  font: 12px ${({ theme }) => resolveOSTheme(theme).fonts.UI};
`;

const Toolbar = styled.div`
  min-height: 36px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 6px;
  border-top: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.WHITE};
  border-bottom: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.DIVIDER_GREY};
  background: ${({ theme }) => resolveOSTheme(theme).tokens.TOOLBAR_GRADIENT};
`;

const ToolButton = styled.button`
  min-width: 52px;
  height: 28px;
  padding: 1px 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font: inherit;
  img {
    width: 16px;
    height: 16px;
    object-fit: contain;
  }
`;

const Separator = styled.span`
  height: 27px;
  width: 1px;
  margin: 0 2px;
  border-left: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.DIVIDER_GREY};
  border-right: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.WHITE};
`;

const SearchWrap = styled.label`
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 4px;
  input {
    width: 180px;
    height: 22px;
    box-sizing: border-box;
    padding: 2px 5px;
    border: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.FIELD_BORDER};
    font: inherit;
  }
`;

const Workspace = styled.div`
  min-height: 0;
  flex: 1;
  display: grid;
  grid-template-columns: 218px minmax(0, 1fr);
  padding: 4px;
  gap: 4px;
`;

const Sidebar = styled.aside`
  min-height: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.BORDER_GREY};
  background: ${({ theme }) => resolveOSTheme(theme).tokens.WHITE};
`;

const Tabs = styled.div`
  height: 25px;
  display: flex;
  align-items: end;
  padding: 2px 3px 0;
  background: ${({ theme }) => resolveOSTheme(theme).tokens.SURFACE};
  border-bottom: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.BORDER_GREY};
`;

const Tab = styled.button<{ $active: boolean }>`
  height: 23px;
  min-width: 64px;
  padding: 0 8px;
  font: inherit;
  font-weight: ${({ $active }) => ($active ? 'bold' : 'normal')};
  position: relative;
  top: ${({ $active }) => ($active ? '1px' : '0')};
  background: ${({ theme, $active }) =>
    $active ? resolveOSTheme(theme).tokens.WHITE : resolveOSTheme(theme).tokens.SURFACE};
  border-bottom-color: ${({ theme, $active }) =>
    $active ? resolveOSTheme(theme).tokens.WHITE : resolveOSTheme(theme).tokens.BORDER_GREY};
`;

const TreeTitle = styled.div`
  padding: 5px 7px;
  font-weight: bold;
  color: ${({ theme }) => resolveOSTheme(theme).tokens.DIALOG_BLUE};
  border-bottom: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.BORDER_GREY_HILIGHT};
`;

const ConversationList = styled.div`
  min-height: 0;
  flex: 1;
  overflow: auto;
`;

const ConversationRow = styled.button<{ $active: boolean }>`
  width: 100%;
  min-height: 38px;
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr) auto;
  align-items: center;
  gap: 5px;
  padding: 3px 6px 3px 13px;
  border: 0;
  text-align: left;
  font: inherit;
  color: ${({ theme, $active }) =>
    $active ? resolveOSTheme(theme).tokens.WHITE : resolveOSTheme(theme).tokens.BLACK};
  background: ${({ theme, $active }) =>
    $active ? resolveOSTheme(theme).tokens.MENU_HIGHLIGHT : resolveOSTheme(theme).tokens.WHITE};
  img {
    width: 26px;
    height: 26px;
    object-fit: cover;
  }
  strong,
  small {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  small {
    color: inherit;
    opacity: 0.72;
    margin-top: 2px;
  }
  output {
    align-self: end;
    padding-bottom: 3px;
    color: inherit;
    opacity: 0.72;
  }
  &:focus-visible {
    outline: 1px dotted currentColor;
    outline-offset: -2px;
  }
`;

const RecordArea = styled.section`
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.BORDER_GREY};
  background: ${({ theme }) => resolveOSTheme(theme).tokens.WHITE};
`;

const ConversationHeader = styled.header`
  min-height: 48px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border-bottom: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.DIVIDER_GREY};
  background: ${({ theme }) => resolveOSTheme(theme).tokens.TOOLBAR_GRADIENT};
  img {
    width: 36px;
    height: 36px;
    object-fit: cover;
  }
  strong {
    color: ${({ theme }) => resolveOSTheme(theme).tokens.DIALOG_BLUE};
  }
  small {
    display: block;
    margin-top: 3px;
    color: ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_SHADOW};
  }
`;

const DateBar = styled.div`
  min-height: 25px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 7px;
  border-bottom: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.BORDER_GREY_HILIGHT};
  background: ${({ theme }) => resolveOSTheme(theme).tokens.SURFACE};
  select {
    height: 20px;
    font: inherit;
  }
  span:last-child {
    margin-left: auto;
    color: ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_SHADOW};
  }
`;

const History = styled.div`
  min-height: 0;
  flex: 1;
  overflow: auto;
  padding: 7px 10px 16px;
  background: ${({ theme }) => resolveOSTheme(theme).tokens.WHITE};
`;

const Day = styled.div`
  margin: 5px 0 9px;
  display: flex;
  align-items: center;
  gap: 7px;
  color: ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_SHADOW};
  &::before,
  &::after {
    content: '';
    height: 1px;
    flex: 1;
    background: ${({ theme }) => resolveOSTheme(theme).tokens.BORDER_GREY_HILIGHT};
  }
`;

const Message = styled.div`
  padding: 3px 4px 7px;
  cursor: default;
  &:focus-visible {
    outline: 1px dotted ${({ theme }) => resolveOSTheme(theme).tokens.BLACK};
  }
`;

const Sender = styled.div<{ $mine: boolean }>`
  font-weight: bold;
  color: ${({ theme, $mine }) =>
    $mine
      ? resolveOSTheme(theme).tokens.PERF_GRAPH_GRID
      : resolveOSTheme(theme).tokens.DIALOG_BLUE};
  time {
    margin-left: 8px;
    font-weight: normal;
    color: ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_SHADOW};
  }
`;

const Body = styled.p`
  margin: 4px 0 0 12px;
  line-height: 1.55;
  white-space: pre-wrap;
`;

const Attachment = styled.button`
  display: block;
  margin: 5px 0 0 12px;
  padding: 2px 5px;
  border: 0;
  background: transparent;
  color: ${({ theme }) => resolveOSTheme(theme).tokens.DIALOG_BLUE};
  text-decoration: underline;
  font: inherit;
  cursor: pointer;
`;

const Empty = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_SHADOW};
  img {
    width: 32px;
    height: 32px;
    opacity: 0.65;
  }
`;

const Pager = styled.footer`
  min-height: 29px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: 2px 6px;
  border-top: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.DIVIDER_GREY};
  background: ${({ theme }) => resolveOSTheme(theme).tokens.SURFACE};
  button {
    min-width: 45px;
    height: 22px;
    font: inherit;
  }
  output {
    margin: 0 5px;
  }
`;

const StatusBar = styled.div`
  min-height: 20px;
  display: flex;
  align-items: center;
  padding: 0 7px;
  border-top: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.WHITE};
  color: ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_SHADOW};
  span:last-child {
    margin-left: auto;
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

const dayKey = (iso: string): string => iso.slice(0, 10);

const QQArchive: React.FC<{ archiveId?: string }> = ({ archiveId }) => {
  const { t, i18n } = useTranslation();
  const content = useContentPacks();
  const { culture } = useCulture();
  const bus = useXPEventBus();
  const storage = useStorage();
  const archive = content.qqArchives.find(item => item.id === archiveId) ?? content.qqArchives[0];
  const key = storage.key(`qq_archive_${archive?.id ?? 'empty'}_query`);
  const [query, setQuery] = useState(() => storage.local.getItem(key) ?? '');
  const [kind, setKind] = useState<'direct' | 'group'>('direct');
  const [conversationId, setConversationId] = useState(archive?.conversations[0]?.id ?? '');
  const resultIds = useMemo(
    () => new Set(archive ? searchQQArchive(archive, query).map(item => item.id) : []),
    [archive, query]
  );
  const conversations = useMemo(
    () =>
      (archive?.conversations ?? []).filter(item => {
        if (item.kind !== kind) return false;
        return !query || item.messages.some(message => resultIds.has(message.id));
      }),
    [archive, kind, query, resultIds]
  );
  const conversation = conversations.find(item => item.id === conversationId) ?? conversations[0];
  const messages = (conversation?.messages ?? []).filter(message => resultIds.has(message.id));
  const myId = culture.qq?.me.number;
  const buddyFor = (item?: QQArchiveConversation) =>
    culture.qq?.buddies.find(buddy => item?.memberIds.includes(buddy.id));
  const avatarFor = (item?: QQArchiveConversation) => {
    if (item?.kind === 'group') return qqImg('ChatRoomButton.png') || qqImg('im/icon.png');
    return qqAvatar(buddyFor(item)?.avatar ?? 1);
  };

  useEffect(() => {
    if (archive) bus.emit({ type: 'qq:archive-open', archiveId: archive.id });
  }, [archive, bus]);

  const updateQuery = (value: string) => {
    setQuery(value);
    storage.local.setItem(key, value);
    if (archive) {
      bus.emit({
        type: 'qq:archive-search',
        archiveId: archive.id,
        query: value,
        resultCount: searchQQArchive(archive, value).length,
      });
    }
  };

  const selectConversation = (item: QQArchiveConversation) => {
    setConversationId(item.id);
    if (archive)
      bus.emit({ type: 'qq:archive-open', archiveId: archive.id, conversationId: item.id });
  };

  let previousDay = '';
  return (
    <Root data-testid="qq-archive">
      <Toolbar>
        <ToolButton disabled title={t('qq.archive.importHint')}>
          <img src={qqImg('im/IMBigToolbarSendFile.png')} alt="" />
          {t('qq.archive.import')}
        </ToolButton>
        <ToolButton disabled title={t('qq.archive.exportHint')}>
          <img src={qqImg('panel-bar/NetDiskButton.png')} alt="" />
          {t('qq.archive.export')}
        </ToolButton>
        <Separator />
        <ToolButton disabled>{t('qq.archive.delete')}</ToolButton>
        <SearchWrap>
          <span>{t('qq.archive.searchLabel')}</span>
          <input
            data-testid="qq-archive-search"
            aria-label={t('qq.archive.search')}
            placeholder={t('qq.archive.searchPlaceholder')}
            value={query}
            onChange={event => updateQuery(event.target.value)}
          />
        </SearchWrap>
      </Toolbar>

      <Workspace>
        <Sidebar>
          <Tabs role="tablist">
            <Tab
              role="tab"
              aria-selected={kind === 'direct'}
              $active={kind === 'direct'}
              onClick={() => setKind('direct')}
            >
              {t('qq.archive.contacts')}
            </Tab>
            <Tab
              role="tab"
              aria-selected={kind === 'group'}
              $active={kind === 'group'}
              onClick={() => setKind('group')}
            >
              {t('qq.archive.groups')}
            </Tab>
          </Tabs>
          <TreeTitle>{archive?.title ?? t('qq.archive.localRecords')}</TreeTitle>
          <ConversationList data-testid="qq-archive-conversations">
            {conversations.map(item => {
              const count = query
                ? item.messages.filter(message => resultIds.has(message.id)).length
                : item.messages.length;
              return (
                <ConversationRow
                  key={item.id}
                  $active={item.id === conversation?.id}
                  onClick={() => selectConversation(item)}
                >
                  <img src={avatarFor(item)} alt="" />
                  <span>
                    <strong>{item.title}</strong>
                    <small>
                      {item.kind === 'group' ? t('qq.archive.groupChat') : t('qq.archive.friend')}
                    </small>
                  </span>
                  <output>{count}</output>
                </ConversationRow>
              );
            })}
          </ConversationList>
        </Sidebar>

        <RecordArea>
          <ConversationHeader>
            <img src={avatarFor(conversation)} alt="" />
            <div>
              <strong>{conversation?.title ?? t('qq.archive.noConversation')}</strong>
              <small>
                {conversation
                  ? t('qq.archive.recordCount', { count: messages.length })
                  : t('qq.archive.selectConversation')}
              </small>
            </div>
          </ConversationHeader>
          <DateBar>
            <span>{t('qq.archive.view')}</span>
            <select aria-label={t('qq.archive.dateRange')} defaultValue="all">
              <option value="all">{t('qq.archive.allRecords')}</option>
            </select>
            <span>
              {query
                ? t('qq.archive.searchResults', { count: messages.length })
                : t('qq.archive.localOnly')}
            </span>
          </DateBar>
          <History data-testid="qq-archive-history">
            {messages.map(message => {
              const day = dayKey(message.sentAt);
              const showDay = day !== previousDay;
              previousDay = day;
              const mine = message.senderId === myId;
              return (
                <React.Fragment key={message.id}>
                  {showDay && (
                    <Day>{new Date(message.sentAt).toLocaleDateString(i18n.language)}</Day>
                  )}
                  <Message
                    role="button"
                    tabIndex={0}
                    data-testid={`qq-archive-message-${message.id}`}
                    onClick={() => {
                      if (archive && conversation)
                        bus.emit({
                          type: 'qq:archive-message-open',
                          archiveId: archive.id,
                          conversationId: conversation.id,
                          messageId: message.id,
                        });
                    }}
                    onKeyDown={event => {
                      if (event.key !== 'Enter' && event.key !== ' ') return;
                      event.preventDefault();
                      if (archive && conversation)
                        bus.emit({
                          type: 'qq:archive-message-open',
                          archiveId: archive.id,
                          conversationId: conversation.id,
                          messageId: message.id,
                        });
                    }}
                  >
                    <Sender $mine={mine}>
                      {message.senderName}
                      <time>{new Date(message.sentAt).toLocaleTimeString(i18n.language)}</time>
                    </Sender>
                    <Body>{message.text}</Body>
                    {message.attachments?.map(attachment => (
                      <Attachment
                        key={attachment.id}
                        onClick={event => {
                          event.stopPropagation();
                          if (archive && conversation)
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
                      </Attachment>
                    ))}
                  </Message>
                </React.Fragment>
              );
            })}
            {messages.length === 0 && (
              <Empty>
                <img src={qqImg('MsgManagerButton.png') || qqImg('im/icon.png')} alt="" />
                <strong>{archive ? t('qq.archive.noMatches') : t('qq.archive.empty')}</strong>
                <span>{archive ? t('qq.archive.noMatchesHint') : t('qq.archive.emptyHint')}</span>
              </Empty>
            )}
          </History>
          <Pager>
            <button disabled>{t('qq.archive.firstPage')}</button>
            <button disabled>{t('qq.archive.previousPage')}</button>
            <output>1 / 1</output>
            <button disabled>{t('qq.archive.nextPage')}</button>
            <button disabled>{t('qq.archive.lastPage')}</button>
          </Pager>
        </RecordArea>
      </Workspace>
      <StatusBar>
        <span>{t('qq.archive.status')}</span>
        <span>
          {t('qq.archive.totalMessages', {
            count: archive ? searchQQArchive(archive, '').length : 0,
          })}
        </span>
      </StatusBar>
    </Root>
  );
};

export default QQArchive;
