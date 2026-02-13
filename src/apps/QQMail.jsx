import React, { useState, useMemo, useEffect } from 'react';
import styled from 'styled-components';
import { useUserProgress } from '../context/UserProgressContext';
import { EmailNotification } from '../components/EmailNotification';
import { EmailSendingAnimation, EmailReceivedAnimation } from '../components/EmailSendingAnimation';
import { playSendSound, playReceiveSound, playNotificationSound } from '../utils/emailSoundManager';
import { loadTextContent } from '../utils/contentLoader';

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
  flex: 1;
  background-color: white;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
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

const PreviewPane = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80%;
  max-width: 800px;
  height: 80%;
  background-color: white;
  border: 1px solid #E0E0E0;
  border-radius: 5px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  z-index: 1000;
`;

const PreviewOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0,0,0,0.5);
  z-index: 999;
`;

const PreviewHeader = styled.div`
  background-color: #FAFAFA;
  padding: 15px 20px;
  border-bottom: 1px solid #E0E0E0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;

  .close-btn {
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    color: #999;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      color: #333;
    }
  }
`;

const PreviewInfo = styled.div`
  flex: 1;

  .subject {
    font-weight: bold;
    font-size: 16px;
    margin-bottom: 10px;
    color: #333;
  }

  .meta {
    font-size: 12px;
    color: #666;
    margin-bottom: 3px;
  }
`;

const PreviewContent = styled.div`
  white-space: pre-wrap;
  word-break: break-word;
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  line-height: 1.6;
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
  const { progress, markEmailSent, markEmailRead, recordEmailTrigger, addInvestigationNote, hasShownNote } = useUserProgress();
  const [pendingResponse, setPendingResponse] = useState(null);
  const [notification, setNotification] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [showSendingAnimation, setShowSendingAnimation] = useState(false);
  const [showReceivedAnimation, setShowReceivedAnimation] = useState(false);
  const [receivedFromName, setReceivedFromName] = useState('');
  const [loadingContent, setLoadingContent] = useState(false);
  const [contentCache, setContentCache] = useState(new Map());

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
    'drafts': '草稿箱'
  };

  const folderIcons = {
    'inbox': '📥',
    'sent': '📤',
    'spam': '🗑️',
    'drafts': '📝'
  };

  const folders = Object.keys(allData);
  const [currentFolder, setCurrentFolder] = useState(folders[0] || 'inbox');
  const [selectedEmail, setSelectedEmail] = useState(null);

  const currentEmails = allData[currentFolder] || [];

  // Calculate unread count for each folder
  const getUnreadCount = (folder) => {
    const emails = allData[folder] || [];
    return emails.filter(email => !email.isDraft && email.id && !progress.emailRead?.includes(email.id)).length;
  };

  // Handle email selection
  const handleEmailSelect = async (email) => {
    setSelectedEmail(email);

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
    return !email.isDraft && email.id && !progress.emailRead?.includes(email.id);
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
          <EmailList>
            <EmailListHeader>
              <div className="checkbox">☐</div>
              <div className="from">发件人</div>
              <div className="subject">主题</div>
              <div className="date">时间</div>
            </EmailListHeader>
            {currentEmails.map((email, idx) => (
              <EmailRow
                key={email.id || idx}
                $selected={selectedEmail === email}
                $unread={isUnread(email)}
                onClick={() => handleEmailSelect(email)}
              >
                <div className="checkbox">☐</div>
                <div className="from">{email.from}</div>
                <div className="subject">{email.subject}</div>
                <div className="date">{email.date}</div>
              </EmailRow>
            ))}
          </EmailList>
        </ContentArea>
      </MainArea>

      {/* Email preview modal */}
      {selectedEmail && (
        <>
          <PreviewOverlay onClick={() => setSelectedEmail(null)} />
          <PreviewPane>
            <PreviewHeader>
              <PreviewInfo>
                <div className="subject">{selectedEmail.subject}</div>
                <div className="meta"><b>发件人:</b> {selectedEmail.from}</div>
                <div className="meta"><b>收件人:</b> {selectedEmail.to}</div>
                <div className="meta"><b>时间:</b> {selectedEmail.date}</div>
              </PreviewInfo>
              <button className="close-btn" onClick={() => setSelectedEmail(null)}>×</button>
            </PreviewHeader>
            <PreviewContent>
              {loadingContent ? (
                <div style={{color: '#888', padding: '20px', textAlign: 'center'}}>
                  正在加载内容...
                </div>
              ) : (
                selectedEmail.content
              )}
            </PreviewContent>
            {selectedEmail.isDraft && (
              <SendButton
                onClick={() => sendDraft(selectedEmail.draftData)}
                disabled={isSending}
              >
                {isSending ? '发送中...' : '发送邮件'}
              </SendButton>
            )}
          </PreviewPane>
        </>
      )}

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
    </Container>
  );
};

export default QQMail;
