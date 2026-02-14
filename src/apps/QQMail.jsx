import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import { useUserProgress } from '../context/UserProgressContext';
import { EmailNotification } from '../components/EmailNotification';
import { EmailSendingAnimation, EmailReceivedAnimation } from '../components/EmailSendingAnimation';
import { playSendSound, playReceiveSound, playNotificationSound } from '../utils/emailSoundManager';
import { loadTextContent } from '../utils/contentLoader';
import ContextMenu from '../components/ContextMenu';

// QQ Mail Colors
const QQ_BLUE = '#12B7F5';
const QQ_DARK_BLUE = '#0E9FD8';
const SIDEBAR_BG = '#F5F5F5';
const HOVER_BG = '#E8F4FD';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background-color: white;
  font-family: 'Microsoft YaHei', 'SimSun', sans-serif;
  font-size: 12px;
`;

const Header = styled.div`
  height: 50px;
  background: linear-gradient(to bottom, ${QQ_BLUE} 0%, ${QQ_DARK_BLUE} 100%);
  display: flex;
  align-items: center;
  padding: 0 20px;
  color: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: bold;

  img {
    width: 32px;
    height: 32px;
  }
`;

const UserInfo = styled.div`
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
`;

const MainArea = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
`;

const Sidebar = styled.div`
  width: 180px;
  background-color: ${SIDEBAR_BG};
  border-right: 1px solid #E0E0E0;
  display: flex;
  flex-direction: column;
  padding: 10px 0;
`;

const ComposeButton = styled.button`
  margin: 10px;
  padding: 10px;
  background: linear-gradient(to bottom, #FF6B00 0%, #FF5500 100%);
  color: white;
  border: none;
  border-radius: 3px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);

  &:hover {
    background: linear-gradient(to bottom, #FF7B10 0%, #FF6510 100%);
  }

  &:active {
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
  }
`;

const FolderItem = styled.div`
  padding: 8px 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: ${props => props.$active ? HOVER_BG : 'transparent'};
  border-left: 3px solid ${props => props.$active ? QQ_BLUE : 'transparent'};
  font-weight: ${props => props.$active ? 'bold' : 'normal'};
  color: ${props => props.$active ? QQ_BLUE : '#333'};

  &:hover {
    background-color: ${HOVER_BG};
  }

  .unread-badge {
    margin-left: auto;
    background: #FF5500;
    color: white;
    padding: 2px 6px;
    border-radius: 10px;
    font-size: 11px;
    font-weight: bold;
  }
`;

const ContentArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const EmailList = styled.div`
  flex: ${props => props.$hasPreview ? '0 0 45%' : '1'};
  background-color: white;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  border-bottom: ${props => props.$hasPreview ? '1px solid #E0E0E0' : 'none'};
`;

const EmailListHeader = styled.div`
  display: flex;
  background-color: #FAFAFA;
  border-bottom: 1px solid #E0E0E0;
  padding: 10px 15px;
  font-weight: bold;
  color: #666;

  div {
    padding: 0 5px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .checkbox { width: 30px; }
  .star { width: 30px; cursor: pointer; }
  .from { width: 20%; }
  .subject { flex: 1; }
  .date { width: 150px; text-align: right; }
`;

const EmailRow = styled.div`
  display: flex;
  cursor: pointer;
  background-color: ${props => props.$selected ? '#FFF8E1' : props.$unread ? '#F9F9F9' : 'white'};
  border-bottom: 1px solid #F0F0F0;
  padding: 12px 15px;
  align-items: center;

  &:hover {
    background-color: ${props => props.$selected ? '#FFF8E1' : '#F5F5F5'};
  }

  div {
    padding: 0 5px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .checkbox { width: 30px; }
  .star {
    width: 30px;
    cursor: pointer;
    color: ${props => props.$starred ? '#FF9800' : '#CCC'};
    font-size: 14px;
    &:hover { color: #FF9800; }
  }
  .from {
    width: 20%;
    font-weight: ${props => props.$unread ? 'bold' : 'normal'};
  }
  .subject {
    flex: 1;
    font-weight: ${props => props.$unread ? 'bold' : 'normal'};
  }
  .date {
    width: 150px;
    text-align: right;
    color: #999;
    font-size: 11px;
  }
`;

const ThreadBadge = styled.span`
  display: inline-block;
  background: #E0E0E0;
  color: #666;
  padding: 1px 5px;
  border-radius: 8px;
  font-size: 10px;
  margin-left: 6px;
  font-weight: normal;
`;

const ThreadChildRow = styled(EmailRow)`
  background-color: ${props => props.$selected ? '#FFF8E1' : '#F5F9FF'};
  padding-left: 35px;
  border-left: 3px solid ${QQ_BLUE};

  &:hover {
    background-color: ${props => props.$selected ? '#FFF8E1' : '#EBF3FE'};
  }
`;

const InlinePreview = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: white;
`;

const InlinePreviewHeader = styled.div`
  background-color: #FAFAFA;
  padding: 12px 16px;
  border-bottom: 1px solid #E0E0E0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-shrink: 0;

  .close-btn {
    background: none;
    border: none;
    font-size: 16px;
    cursor: pointer;
    color: #999;
    padding: 2px 6px;

    &:hover {
      color: #333;
      background-color: #E0E0E0;
      border-radius: 3px;
    }
  }
`;

const InlinePreviewInfo = styled.div`
  flex: 1;

  .subject {
    font-weight: bold;
    font-size: 14px;
    margin-bottom: 6px;
    color: #333;
  }

  .meta {
    font-size: 11px;
    color: #666;
    margin-bottom: 2px;
  }
`;

const EmptyPreview = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #BBB;
  font-size: 13px;
`;

const PreviewContent = styled.div`
  white-space: pre-wrap;
  word-break: break-word;
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  line-height: 1.6;
  user-select: text;
  cursor: text;
`;

const SendButton = styled.button`
  margin: 15px 20px;
  padding: 10px 30px;
  background: linear-gradient(to bottom, ${QQ_BLUE} 0%, ${QQ_DARK_BLUE} 100%);
  color: white;
  border: none;
  border-radius: 3px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  align-self: flex-start;

  &:hover {
    background: linear-gradient(to bottom, #1AC7FF 0%, #12B7F5 100%);
  }

  &:active {
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const DraftFooter = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  border-top: 1px solid #E0E0E0;
  background-color: #FAFAFA;
`;

const DraftTextArea = styled.textarea`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  line-height: 1.6;
  border: none;
  resize: none;
  font-family: 'Microsoft YaHei', 'SimSun', sans-serif;
  font-size: 12px;
  outline: none;
`;

// 检查邮件触发条件
const checkEmailTrigger = (trigger, progress) => {
  const triggerMap = {
    'game_start': true,
    'player_view_qzone': progress.qqLoggedIn,
    'player_unlock_album': progress.albumUnlocked,
    'player_read_father_diary_layer1': progress.fatherLogLayer1Unlocked,
    'player_read_linxiaoyu_diary': progress.encryptedDiaryUnlocked,
    'player_read_father_diary_layer2': progress.fatherLogLayer2Unlocked
  };

  return triggerMap[trigger] || false;
};

const QQMail = () => {
  const { progress, markEmailSent, markEmailRead, markEmailUnread, toggleEmailStar, recordEmailTrigger, addInvestigationNote, hasShownNote } = useUserProgress();
  const [pendingResponse, setPendingResponse] = useState(null);
  const [notification, setNotification] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [showSendingAnimation, setShowSendingAnimation] = useState(false);
  const [showReceivedAnimation, setShowReceivedAnimation] = useState(false);
  const [receivedFromName, setReceivedFromName] = useState('');
  const [loadingContent, setLoadingContent] = useState(false);
  const [contentCache, setContentCache] = useState(new Map());
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, menuItems: [] });
  const previewContentRef = useRef(null);
  const [draftContent, setDraftContent] = useState('');

  // Load email investigation mapping
  const [emailInvestigationMapping, setEmailInvestigationMapping] = useState([]);

  useEffect(() => {
    import('../data/email_investigation_mapping.json')
      .then(module => {
        setEmailInvestigationMapping(module.default.email_investigation_triggers || []);
      })
      .catch(e => {
        console.error('Failed to load email investigation mapping:', e);
        setEmailInvestigationMapping([]);
      });
  }, []);

  // Load email data from JSON files
  const data = useMemo(() => {
    const modules = import.meta.glob('../data/email/*/*.json', { eager: true });
    const result = {};

    Object.keys(modules).forEach(path => {
      const parts = path.split('/');
      const folderName = parts[parts.length - 2];
      const email = modules[path].default || modules[path];

      if (!result[folderName]) {
        result[folderName] = [];
      }
      result[folderName].push(email);
    });

    return result;
  }, []);

  // Load Chen Mo correspondence
  const [chenMoEmails, setChenMoEmails] = useState([]);
  const [drafts, setDrafts] = useState([]);

  useEffect(() => {
    import('../data/email/chenmo_correspondence.json')
      .then(module => {
        setChenMoEmails(module.default.correspondence || []);
        setDrafts(module.default.drafts || []);
      })
      .catch(e => {
        console.error('Failed to load Chen Mo emails:', e);
        setChenMoEmails([]);
        setDrafts([]);
      });
  }, []);

  // Filter Chen Mo emails based on game progress
  const visibleChenMoEmails = useMemo(() => {
    return chenMoEmails.filter(email => checkEmailTrigger(email.trigger, progress));
  }, [chenMoEmails, progress]);

  // Filter visible drafts
  const visibleDrafts = useMemo(() => {
    return drafts.filter(draft => {
      const triggered = checkEmailTrigger(draft.trigger, progress);
      const notSent = !progress.emailSent?.includes(draft.id);
      return triggered && notSent;
    });
  }, [drafts, progress]);

  // Handle sending draft email
  const sendDraft = (draft) => {
    setIsSending(true);
    setShowSendingAnimation(true);

    playSendSound();
    markEmailSent(draft.id);

    setTimeout(() => {
      setShowSendingAnimation(false);
      setIsSending(false);

      if (draft.triggerResponse) {
        setTimeout(() => {
          recordEmailTrigger(draft.triggerResponse);
          playReceiveSound();

          const responseEmail = chenMoEmails.find(e => e.id === draft.triggerResponse);
          if (responseEmail) {
            setReceivedFromName(responseEmail.fromName);
            setShowReceivedAnimation(true);

            setTimeout(() => {
              setShowReceivedAnimation(false);

              setTimeout(() => {
                playNotificationSound();
                setNotification({
                  fromName: responseEmail.fromName,
                  subject: responseEmail.subject
                });
              }, 300);
            }, 1500);
          }
        }, draft.responseDelay || 3000);
      }
    }, 1000);
  };

  // Merge Chen Mo emails into inbox and add drafts folder
  const allData = useMemo(() => {
    const merged = { ...data };

    const formattedChenMoEmails = visibleChenMoEmails.map(email => ({
      id: email.id,
      from: email.fromName,
      to: email.toName,
      subject: email.subject,
      date: email.time,
      content: email.body,
      contentPath: email.contentPath
    }));

    if (!merged.inbox) {
      merged.inbox = [];
    }
    merged.inbox = [...merged.inbox, ...formattedChenMoEmails];

    merged.inbox.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB - dateA;
    });

    const formattedDrafts = visibleDrafts.map(draft => ({
      id: draft.id,
      from: draft.fromName,
      to: draft.toName,
      subject: draft.subject,
      date: '草稿',
      content: draft.body,
      contentPath: draft.contentPath,
      isDraft: true,
      draftData: draft
    }));

    merged.drafts = formattedDrafts;

    return merged;
  }, [data, visibleChenMoEmails, visibleDrafts]);

  const folderTranslations = {
    'inbox': '收件箱',
    'sent': '已发送',
    'spam': '垃圾邮件',
    'drafts': '草稿箱',
    'starred': '已标星'
  };

  const folderIcons = {
    'inbox': '📥',
    'sent': '📤',
    'spam': '🗑️',
    'drafts': '📝',
    'starred': '★'
  };

  // Build starred virtual folder
  const allDataWithStarred = useMemo(() => {
    const starred = progress.emailStarred || [];
    if (starred.length === 0) return allData;
    const starredEmails = [];
    Object.values(allData).forEach(emails => {
      emails.forEach(email => {
        if (email.id && starred.includes(email.id)) {
          starredEmails.push(email);
        }
      });
    });
    return { ...allData, starred: starredEmails };
  }, [allData, progress.emailStarred]);

  const folders = Object.keys(allDataWithStarred);
  const [currentFolder, setCurrentFolder] = useState(folders[0] || 'inbox');
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [expandedThreads, setExpandedThreads] = useState(new Set());

  const currentEmails = allDataWithStarred[currentFolder] || [];

  // Thread grouping: merge sent emails into inbox threads
  const threadedEmails = useMemo(() => {
    // Only apply thread grouping to inbox folder
    if (currentFolder !== 'inbox') return currentEmails.map(e => ({ email: e, threadEmails: null }));

    const sentEmails = allDataWithStarred['sent'] || [];
    const allEmails = [...currentEmails, ...sentEmails];

    // Group by threadId
    const threadMap = new Map();
    const standalone = [];

    allEmails.forEach(email => {
      if (email.threadId) {
        if (!threadMap.has(email.threadId)) {
          threadMap.set(email.threadId, []);
        }
        threadMap.get(email.threadId).push(email);
      } else {
        standalone.push({ email, threadEmails: null });
      }
    });

    // Sort each thread by date (oldest first)
    const threaded = [];
    const processedThreads = new Set();

    // Walk through currentEmails in order, replacing thread members with grouped entries
    currentEmails.forEach(email => {
      if (!email.threadId) {
        threaded.push({ email, threadEmails: null });
        return;
      }
      if (processedThreads.has(email.threadId)) return;
      processedThreads.add(email.threadId);

      const threadEmails = threadMap.get(email.threadId) || [email];
      threadEmails.sort((a, b) => new Date(a.date) - new Date(b.date));
      const latest = threadEmails[threadEmails.length - 1];

      if (threadEmails.length > 1) {
        threaded.push({ email: latest, threadEmails });
      } else {
        threaded.push({ email: latest, threadEmails: null });
      }
    });

    return threaded;
  }, [currentEmails, currentFolder, allDataWithStarred]);

  const toggleThread = (threadId) => {
    setExpandedThreads(prev => {
      const next = new Set(prev);
      if (next.has(threadId)) {
        next.delete(threadId);
      } else {
        next.add(threadId);
      }
      return next;
    });
  };

  const isStarred = (email) => {
    return email.id && (progress.emailStarred || []).includes(email.id);
  };

  const handleStarClick = (e, email) => {
    e.stopPropagation();
    if (email.id) {
      toggleEmailStar(email.id);
    }
  };

  // Calculate unread count for each folder
  const getUnreadCount = (folder) => {
    const emails = allDataWithStarred[folder] || [];
    return emails.filter(email => isUnread(email)).length;
  };

  // Handle email selection
  const handleEmailSelect = async (email) => {
    setSelectedEmail(email);

    // Initialize draft content for editing
    if (email.isDraft) {
      setDraftContent(email.content || '');
    }

    if (email.contentPath && !email.content) {
      if (contentCache.has(email.contentPath)) {
        setSelectedEmail({ ...email, content: contentCache.get(email.contentPath) });
      } else {
        setLoadingContent(true);
        const content = await loadTextContent(email.contentPath);
        setContentCache(prev => new Map(prev).set(email.contentPath, content));
        setSelectedEmail({ ...email, content });
        setLoadingContent(false);
      }
    }

    if (!email.isDraft && email.id) {
      markEmailRead(email.id);

      const mapping = emailInvestigationMapping.find(m => m.emailId === email.id);
      if (mapping && !hasShownNote(mapping.noteId)) {
        setTimeout(() => {
          addInvestigationNote(mapping.noteId, {
            title: mapping.title,
            content: mapping.content,
            category: mapping.category,
            importance: mapping.importance,
            relatedClues: mapping.relatedClues,
            source: 'email',
            sourceId: email.id
          });
        }, 2000);
      }
    }
  };

  const isUnread = (email) => {
    if (email.isDraft || !email.id) return false;
    // JSON中标记为read的邮件（历史邮件）直接视为已读
    if (email.status === 'read') return false;
    // 其余邮件通过progress.emailRead判断
    return !progress.emailRead?.includes(email.id);
  };

  const closeContextMenu = () => {
    setContextMenu({ visible: false, x: 0, y: 0, menuItems: [] });
  };

  // Right-click on email list row
  const handleEmailContextMenu = (e, email) => {
    e.preventDefault();
    e.stopPropagation();
    const unread = isUnread(email);
    const items = [];

    items.push({
      label: '打开',
      action: () => handleEmailSelect(email),
    });
    items.push({ type: 'separator' });

    if (!email.isDraft && email.id) {
      items.push({
        label: unread ? '标记为已读' : '标记为未读',
        action: () => {
          if (unread) {
            markEmailRead(email.id);
          } else {
            markEmailUnread(email.id);
          }
        },
      });
      const starred = isStarred(email);
      items.push({
        label: starred ? '取消标星' : '标记星标',
        action: () => {
          toggleEmailStar(email.id);
        },
      });
      items.push({ type: 'separator' });
    }

    items.push({
      label: '复制主题',
      action: () => {
        navigator.clipboard.writeText(email.subject || '');
      },
    });
    items.push({
      label: '复制发件人',
      action: () => {
        navigator.clipboard.writeText(email.from || '');
      },
    });

    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, menuItems: items });
  };

  // Right-click on email preview content
  const handlePreviewContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const selection = window.getSelection();
    const hasSelection = selection && selection.toString().length > 0;

    const items = [
      {
        label: '复制(C)',
        disabled: !hasSelection,
        action: () => {
          if (hasSelection) {
            navigator.clipboard.writeText(selection.toString());
          }
        },
      },
      { type: 'separator' },
      {
        label: '全选(A)',
        action: () => {
          if (previewContentRef.current) {
            const range = document.createRange();
            range.selectNodeContents(previewContentRef.current);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
          }
        },
      },
    ];

    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, menuItems: items });
  };

  return (
    <Container>
      <Header>
        <Logo>
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Tencent_QQ_logo_2016.svg/1024px-Tencent_QQ_logo_2016.svg.png" alt="QQ" />
          <span>QQ邮箱</span>
        </Logo>
        <UserInfo>
          <span>1847592036@qq.com</span>
        </UserInfo>
      </Header>

      <MainArea>
        <Sidebar>
          <ComposeButton>写信</ComposeButton>
          {folders.map(folder => {
            const unreadCount = getUnreadCount(folder);
            return (
              <FolderItem
                key={folder}
                $active={currentFolder === folder}
                onClick={() => {
                  setCurrentFolder(folder);
                  setSelectedEmail(null);
                }}
              >
                <span>{folderIcons[folder] || '📁'}</span>
                <span>{folderTranslations[folder] || folder}</span>
                {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
              </FolderItem>
            );
          })}
        </Sidebar>

        <ContentArea>
          <EmailList $hasPreview={!!selectedEmail}>
            <EmailListHeader>
              <div className="checkbox">☐</div>
              <div className="star"></div>
              <div className="from">发件人</div>
              <div className="subject">主题</div>
              <div className="date">时间</div>
            </EmailListHeader>
            {threadedEmails.map(({ email, threadEmails }, idx) => {
              const hasThread = threadEmails && threadEmails.length > 1;
              const isExpanded = hasThread && expandedThreads.has(email.threadId);

              return (
                <React.Fragment key={email.id || idx}>
                  <EmailRow
                    $selected={selectedEmail === email}
                    $unread={isUnread(email)}
                    $starred={isStarred(email)}
                    onClick={() => {
                      if (hasThread) {
                        toggleThread(email.threadId);
                      } else {
                        handleEmailSelect(email);
                      }
                    }}
                    onContextMenu={(e) => handleEmailContextMenu(e, email)}
                  >
                    <div className="checkbox">☐</div>
                    <div className="star" onClick={(e) => handleStarClick(e, email)}>
                      {isStarred(email) ? '★' : '☆'}
                    </div>
                    <div className="from">{email.from}</div>
                    <div className="subject">
                      {email.subject}
                      {hasThread && <ThreadBadge>{threadEmails.length}</ThreadBadge>}
                    </div>
                    <div className="date">{email.date}</div>
                  </EmailRow>
                  {isExpanded && threadEmails.map((threadEmail, tIdx) => (
                    <ThreadChildRow
                      key={threadEmail.id || tIdx}
                      $selected={selectedEmail === threadEmail}
                      $unread={isUnread(threadEmail)}
                      $starred={isStarred(threadEmail)}
                      onClick={() => handleEmailSelect(threadEmail)}
                      onContextMenu={(e) => handleEmailContextMenu(e, threadEmail)}
                    >
                      <div className="checkbox">☐</div>
                      <div className="star" onClick={(e) => handleStarClick(e, threadEmail)}>
                        {isStarred(threadEmail) ? '★' : '☆'}
                      </div>
                      <div className="from">{threadEmail.from}</div>
                      <div className="subject">{threadEmail.subject}</div>
                      <div className="date">{threadEmail.date}</div>
                    </ThreadChildRow>
                  ))}
                </React.Fragment>
              );
            })}
          </EmailList>

          {selectedEmail ? (
            <InlinePreview>
              <InlinePreviewHeader>
                <InlinePreviewInfo>
                  <div className="subject">{selectedEmail.subject}</div>
                  <div className="meta"><b>发件人:</b> {selectedEmail.from}</div>
                  <div className="meta"><b>收件人:</b> {selectedEmail.to}</div>
                  <div className="meta"><b>时间:</b> {selectedEmail.date}</div>
                </InlinePreviewInfo>
                <button className="close-btn" onClick={() => setSelectedEmail(null)}>x</button>
              </InlinePreviewHeader>
              {selectedEmail.isDraft ? (
                <DraftTextArea
                  value={draftContent}
                  onChange={(e) => setDraftContent(e.target.value)}
                  placeholder="编辑邮件内容..."
                />
              ) : (
                <PreviewContent ref={previewContentRef} onContextMenu={handlePreviewContextMenu}>
                  {loadingContent ? (
                    <div style={{color: '#888', padding: '20px', textAlign: 'center'}}>
                      正在加载内容...
                    </div>
                  ) : (
                    selectedEmail.content
                  )}
                </PreviewContent>
              )}
              {selectedEmail.isDraft && (
                <DraftFooter>
                  <SendButton disabled>
                    发送邮件
                  </SendButton>
                </DraftFooter>
              )}
            </InlinePreview>
          ) : (
            <EmptyPreview>
              选择一封邮件以查看内容
            </EmptyPreview>
          )}
        </ContentArea>
      </MainArea>

      {/* Email notification */}
      {notification && (
        <EmailNotification
          email={notification}
          onClose={() => setNotification(null)}
          onClick={() => {
            setNotification(null);
          }}
        />
      )}

      {/* Sending animation */}
      <EmailSendingAnimation show={showSendingAnimation} duration={1000} />

      {/* Received animation */}
      <EmailReceivedAnimation show={showReceivedAnimation} fromName={receivedFromName} duration={1500} />

      {/* Context menu */}
      {createPortal(
        <ContextMenu
          visible={contextMenu.visible}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={closeContextMenu}
          menuItems={contextMenu.menuItems}
        />,
        document.body
      )}
    </Container>
  );
};

export default QQMail;
