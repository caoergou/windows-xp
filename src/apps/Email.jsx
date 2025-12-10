import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import XPIcon from '../components/XPIcon';

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
  font-family: 'Tahoma', sans-serif;
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
`;

const EmailList = styled.div`
  flex: 1;
  background-color: white;
  border: 1px solid ${BORDER_COLOR};
  overflow-y: auto;
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
  height: 200px;
  background-color: white;
  border: 1px solid ${BORDER_COLOR};
  padding: 10px;
  overflow-y: auto;
  font-family: 'Times New Roman', serif;
  font-size: 14px;
`;

const PreviewHeader = styled.div`
  background-color: #e0e0e0;
  padding: 5px;
  margin-bottom: 10px;
  border-bottom: 1px solid #ccc;
  font-family: 'Tahoma', sans-serif;
  font-size: 12px;

  div {
    margin-bottom: 2px;
  }

  .subject {
    font-weight: bold;
    font-size: 14px;
    margin-bottom: 5px;
  }
`;

const Email = () => {
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

    // Sort folders? Maybe fixed list: inbox, sent, drafts, etc.
    // But dynamic is fine.
    return result;
  }, []);

  const folders = Object.keys(data);
  const [currentFolder, setCurrentFolder] = useState(folders[0] || 'inbox');
  const [selectedEmail, setSelectedEmail] = useState(null);

  const currentEmails = data[currentFolder] || [];

  return (
    <Container>
      <Toolbar>
         <ToolbarButton onClick={() => alert('New Mail feature not implemented')}>
            <XPIcon name="file" size={24} />
            <span>Create Mail</span>
         </ToolbarButton>
         <ToolbarButton onClick={() => alert('Reply feature not implemented')}>
            <XPIcon name="paste" size={24} />
            <span>Reply</span>
         </ToolbarButton>
         <div style={{flex:1}}></div>
         <XPIcon name="windows" size={24} />
      </Toolbar>

      <MainArea>
        <Sidebar>
          <div style={{padding: '5px', fontWeight: 'bold'}}>Folders</div>
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
              <span style={{textTransform: 'capitalize'}}>{folder}</span>
            </FolderItem>
          ))}
        </Sidebar>

        <ContentArea>
           <EmailList>
              <EmailListHeader>
                 <div className="from">From</div>
                 <div className="subject">Subject</div>
                 <div className="date">Received</div>
              </EmailListHeader>
              {currentEmails.map((email, idx) => (
                 <EmailRow
                    key={idx}
                    $selected={selectedEmail === email}
                    onClick={() => setSelectedEmail(email)}
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
                    <div><b>From:</b> {selectedEmail.from}</div>
                    <div><b>To:</b> {selectedEmail.to}</div>
                    <div><b>Date:</b> {selectedEmail.date}</div>
                  </PreviewHeader>
                  <div style={{whiteSpace: 'pre-wrap'}}>
                    {selectedEmail.content}
                  </div>
                </>
              ) : (
                <div style={{color: '#888', padding: '20px', textAlign: 'center'}}>
                  Select an email to view its content.
                </div>
              )}
           </PreviewPane>
        </ContentArea>
      </MainArea>
    </Container>
  );
};

export default Email;
