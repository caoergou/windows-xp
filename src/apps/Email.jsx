import React, { useState, useMemo, useEffect } from 'react';
import styled from 'styled-components';
import XPIcon from '../components/XPIcon';
import { useUserProgress } from '../context/UserProgressContext';
import { EmailNotification } from '../components/EmailNotification';
import { EmailSendingAnimation, EmailReceivedAnimation } from '../components/EmailSendingAnimation';
import { playSendSound, playReceiveSound, playNotificationSound } from '../utils/emailSoundManager';
import { loadTextContent } from '../utils/contentLoader';

// XP Style Colors
const TB_BG = '#f0f0f0'; // Toolbar background
const BORDER_COLOR = '#808080';
const HIGHLIGHT_COLOR = '#316ac5';
const HIGHLIGHT_TEXT = '#ffffff';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background-color: #ece9d8;
  font-family: 'Tahoma', 'SimSun', sans-serif;
  font-size: 11px;
`;

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  padding: 2px;
  background-color: ${TB_BG};
  border-bottom: 1px solid ${BORDER_COLOR};
  gap: 10px;
`;

const ToolbarButton = styled.button`
  background: none;
  border: 1px solid transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2px 5px;
  cursor: pointer;
  font-size: 11px;
  font-family: 'Tahoma', 'SimSun', sans-serif;

  &:hover {
    border: 1px solid #cecece;
    background-color: #fcfcfc;
  }

  &:active {
    border: 1px solid #808080;
    background-color: #ece9d8;
  }

  img, svg {
    margin-bottom: 2px;
  }
`;

const MainArea = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
`;

const Sidebar = styled.div`
  width: 150px;
  background-color: white;
  border: 1px solid ${BORDER_COLOR};
  margin: 2px;
  display: flex;
  flex-direction: column;
`;

const FolderItem = styled.div`
  padding: 4px 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;

  background-color: ${props => props.$active ? '#e0e0e0' : 'transparent'};
  font-weight: ${props => props.$active ? 'bold' : 'normal'};

  &:hover {
    text-decoration: underline;
  }
`;

const ContentArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  margin: 2px;
  gap: 2px;
  overflow: hidden;
`;

const EmailList = styled.div`
  flex: 0 0 40%;
  background-color: white;
  border: 1px solid ${BORDER_COLOR};
  overflow-y: auto;
  display: flex;
  flex-direction: column;
`;

const EmailListHeader = styled.div`
  display: flex;
  background-color: #ece9d8;
  border-bottom: 1px solid ${BORDER_COLOR};
  padding: 2px;
  font-weight: bold;

  div {
    padding: 0 5px;
    border-right: 1px solid #d4d0c8;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .from { width: 25%; }
  .subject { width: 50%; }
  .date { width: 25%; }
`;

const EmailRow = styled.div`
  display: flex;
  cursor: pointer;
  background-color: ${props => props.$selected ? HIGHLIGHT_COLOR : 'white'};
  color: ${props => props.$selected ? HIGHLIGHT_TEXT : 'black'};

  &:hover {
    text-decoration: ${props => props.$selected ? 'none' : 'underline'};
  }

  div {
    padding: 2px 5px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .from { width: 25%; }
  .subject { width: 50%; }
  .date { width: 25%; }
`;

const PreviewPane = styled.div`
  flex: 1;
  background-color: white;
  border: 1px solid ${BORDER_COLOR};
  overflow: hidden;
  font-family: 'Times New Roman', 'SimSun', serif;
  font-size: 14px;
  display: flex;
  flex-direction: column;
`;

const PreviewHeader = styled.div`
  background-color: #e0e0e0;
  padding: 10px;
  border-bottom: 1px solid #ccc;
  font-family: 'Tahoma', 'SimSun', sans-serif;
  font-size: 12px;
  flex-shrink: 0;

  div {
    margin-bottom: 2px;
  }

  .subject {
    font-weight: bold;
    font-size: 14px;
    margin-bottom: 5px;
  }
`;

const PreviewContent = styled.div`
    white-space: pre-wrap;
    word-break: break-word;
    flex: 1;
    overflow-y: auto;
    padding: 10px;
`;

const SendButton = styled.button`
  margin: 10px;
  padding: 8px 20px;
  background: linear-gradient(180deg, #fff 0%, #e0e0e0 100%);
  border: 1px solid #808080;
  border-radius: 2px;
  font-family: 'Tahoma', 'SimSun', sans-serif;
  font-size: 11px;
  cursor: pointer;
  box-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);

  &:hover {
    background: linear-gradient(180deg, #fff 0%, #d0d0d0 100%);
  }

  &:active {
    background: linear-gradient(180deg, #d0d0d0 0%, #e0e0e0 100%);
    box-shadow: inset 1px 1px 2px rgba(0, 0, 0, 0.2);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// 检查邮件触发条件
const checkEmailTrigger = (trigger, progress) => {
  const triggerMap = {
    'game_start': true, // 游戏开始就可见
    'player_view_qzone': progress.qqLoggedIn, // 玩家登录QQ并查看空间
    'player_unlock_album': progress.albumUnlocked, // 玩家破解相册
    'player_read_father_diary_layer1': progress.fatherLogLayer1Unlocked, // 玩家解密父亲日志第一层
    'player_read_linxiaoyu_diary': progress.encryptedDiaryUnlocked, // 玩家阅读林晓宇日志
    'player_read_father_diary_layer2': progress.fatherLogLayer2Unlocked // 玩家解密父亲日志第二层
  };

  return triggerMap[trigger] || false;
};

const Email = () => {
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
  const emailInvestigationMapping = useMemo(() => {
    try {
      const mapping = require('../data/email_investigation_mapping.json');
      return mapping.email_investigation_triggers || [];
    } catch (e) {
      console.error('Failed to load email investigation mapping:', e);
      return [];
    }
  }, []);

  // Load email data from JSON files
  const data = useMemo(() => {
    // import.meta.glob is a Vite feature
    const modules = import.meta.glob('../data/email/*/*.json', { eager: true });
    const result = {};

    Object.keys(modules).forEach(path => {
      // path example: "../data/email/inbox/welcome.json"
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
    // Load Chen Mo emails using ES6 dynamic import
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

    // Play send sound
    playSendSound();

    // Mark as sent
    markEmailSent(draft.id);

    // Show sending animation for 1 second
    setTimeout(() => {
      setShowSendingAnimation(false);
      setIsSending(false);

      // Schedule response email
      if (draft.triggerResponse) {
        setTimeout(() => {
          // Record trigger time for response email
          recordEmailTrigger(draft.triggerResponse);

          // Play receive sound
          playReceiveSound();

          // Show received animation
          const responseEmail = chenMoEmails.find(e => e.id === draft.triggerResponse);
          if (responseEmail) {
            setReceivedFromName(responseEmail.fromName);
            setShowReceivedAnimation(true);

            // Hide received animation after 1.5 seconds
            setTimeout(() => {
              setShowReceivedAnimation(false);

              // Show notification after animation
              setTimeout(() => {
                // Play notification sound
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

  // Monitor for new emails and show notifications
  useEffect(() => {
    if (pendingResponse) {
      const timer = setTimeout(() => {
        setNotification({
          fromName: pendingResponse.fromName,
          subject: pendingResponse.subject
        });
        setPendingResponse(null);
      }, pendingResponse.delay);

      return () => clearTimeout(timer);
    }
  }, [pendingResponse]);

  // Merge Chen Mo emails into inbox and add drafts folder
  const allData = useMemo(() => {
    const merged = { ...data };

    // Convert Chen Mo emails to the format expected by the UI
    const formattedChenMoEmails = visibleChenMoEmails.map(email => ({
      id: email.id,
      from: email.fromName,
      to: email.toName,
      subject: email.subject,
      date: email.time,
      content: email.body
    }));

    // Add to inbox
    if (!merged.inbox) {
      merged.inbox = [];
    }
    merged.inbox = [...merged.inbox, ...formattedChenMoEmails];

    // Sort inbox by date (newest first)
    merged.inbox.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB - dateA;
    });

    // Add drafts folder
    const formattedDrafts = visibleDrafts.map(draft => ({
      id: draft.id,
      from: draft.fromName,
      to: draft.toName,
      subject: draft.subject,
      date: '草稿',
      content: draft.body,
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

  const folders = Object.keys(allData);
  const [currentFolder, setCurrentFolder] = useState(folders[0] || 'inbox');
  const [selectedEmail, setSelectedEmail] = useState(null);

  const currentEmails = allData[currentFolder] || [];

  // Handle email selection and trigger investigation note
  const handleEmailSelect = async (email) => {
    setSelectedEmail(email);

    // If email has contentPath and content is not loaded, load it dynamically
    if (email.contentPath && !email.content) {
      // Check cache first
      if (contentCache.has(email.contentPath)) {
        setSelectedEmail({ ...email, content: contentCache.get(email.contentPath) });
      } else {
        // Load content
        setLoadingContent(true);
        const content = await loadTextContent(email.contentPath);
        setContentCache(prev => new Map(prev).set(email.contentPath, content));
        setSelectedEmail({ ...email, content });
        setLoadingContent(false);
      }
    }

    // Mark email as read if it's not a draft
    if (!email.isDraft && email.id) {
      markEmailRead(email.id);

      // Check if this email should trigger an investigation note
      const mapping = emailInvestigationMapping.find(m => m.emailId === email.id);
      if (mapping && !hasShownNote(mapping.noteId)) {
        // Add investigation note after a short delay (simulate reading time)
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
        }, 2000); // 2 seconds delay
      }
    }
  };

  return (
    <Container>
      <Toolbar>
         <ToolbarButton>
            <XPIcon name="file" size={24} />
            <span>新建邮件</span>
         </ToolbarButton>
         <ToolbarButton>
            <XPIcon name="paste" size={24} />
            <span>回复</span>
         </ToolbarButton>
         <div style={{flex:1}}></div>
         <XPIcon name="windows" size={24} />
      </Toolbar>

      <MainArea>
        <Sidebar>
          <div style={{padding: '5px', fontWeight: 'bold'}}>文件夹</div>
          {folders.map(folder => (
            <FolderItem
              key={folder}
              $active={currentFolder === folder}
              onClick={() => {
                setCurrentFolder(folder);
                setSelectedEmail(null);
              }}
            >
              <XPIcon name={folder === currentFolder ? 'folder_open' : 'folder'} size={16} />
              <span style={{textTransform: 'capitalize'}}>{folderTranslations[folder] || folder}</span>
            </FolderItem>
          ))}
        </Sidebar>

        <ContentArea>
           <EmailList>
              <EmailListHeader>
                 <div className="from">发件人</div>
                 <div className="subject">主题</div>
                 <div className="date">接收时间</div>
              </EmailListHeader>
              {currentEmails.map((email, idx) => (
                 <EmailRow
                    key={email.id || idx}
                    $selected={selectedEmail === email}
                    onClick={() => handleEmailSelect(email)}
                 >
                    <div className="from">{email.from}</div>
                    <div className="subject">{email.subject}</div>
                    <div className="date">{email.date}</div>
                 </EmailRow>
              ))}
           </EmailList>

           <PreviewPane>
              {selectedEmail ? (
                <>
                  <PreviewHeader>
                    <div className="subject">{selectedEmail.subject}</div>
                    <div><b>发件人:</b> {selectedEmail.from}</div>
                    <div><b>收件人:</b> {selectedEmail.to}</div>
                    <div><b>日期:</b> {selectedEmail.date}</div>
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
                </>
              ) : (
                <div style={{color: '#888', padding: '20px', textAlign: 'center'}}>
                  选择一封邮件以查看内容。
                </div>
              )}
           </PreviewPane>
        </ContentArea>
      </MainArea>

      {/* Email notification */}
      {notification && (
        <EmailNotification
          email={notification}
          onClose={() => setNotification(null)}
          onClick={() => {
            setNotification(null);
            // Could open email window here if needed
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

export default Email;
