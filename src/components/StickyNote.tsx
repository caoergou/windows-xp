import React, { useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useWindowManager } from '../context/WindowManagerContext';
import { APP_REGISTRY } from '../registry/apps';
import { getStickyNote } from '../data/culture';

const NoteContainer = styled.div`
  position: absolute;
  top: 80px;
  right: 20px;
  width: 210px;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  padding: 14px 14px 12px;
  box-shadow: 2px 2px 10px rgba(0,0,0,0.3), inset 0 0 40px rgba(255,255,255,0.3);
  transform: rotate(-2deg);
  font-family: 'Comic Sans MS', 'SimSun', '微软雅黑', cursive, sans-serif;
  cursor: default;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  z-index: 100;
  user-select: none;

  &::before {
    content: '';
    position: absolute;
    top: -10px;
    left: 50%;
    transform: translateX(-50%);
    width: 70px;
    height: 20px;
    background: rgba(255,255,255,0.45);
    box-shadow: 0 1px 3px rgba(0,0,0,0.15);
  }

  &:hover {
    transform: rotate(0deg) scale(1.02);
    box-shadow: 3px 3px 15px rgba(0,0,0,0.35), inset 0 0 40px rgba(255,255,255,0.3);
  }
`;

const NoteTitle = styled.div`
  font-size: 13px;
  font-weight: bold;
  color: #92400e;
  margin-bottom: 8px;
  border-bottom: 1px dashed #d97706;
  padding-bottom: 5px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const CloseBtn = styled.span`
  font-size: 12px;
  color: #b45309;
  cursor: pointer;
  line-height: 1;
  padding: 0 2px;
  &:hover { color: #92400e; }
`;

const NoteContent = styled.div`
  font-size: 12px;
  line-height: 1.75;
  color: #78350f;
  white-space: pre-wrap;
`;

const StickyNote = () => {
  const { t, i18n } = useTranslation();
  const { openWindow } = useWindowManager();
  const [visible, setVisible] = useState<boolean>(true);
  const stickyNote = getStickyNote(i18n.language);

  if (!visible) return null;

  const docsPath = t('startMenu.myDocuments');
  const handleOpenDocuments = () => {
    openWindow(
      'Explorer',
      docsPath,
      APP_REGISTRY.Explorer.restore({ initialPath: [docsPath] }),
      'documents',
      APP_REGISTRY.Explorer.window
    );
  };

  return (
    <NoteContainer className="sticky-note">
      <NoteTitle>
        {stickyNote.title}
        <CloseBtn onClick={() => setVisible(false)}>×</CloseBtn>
      </NoteTitle>
      <NoteContent
        style={{ cursor: 'pointer' }}
        onDoubleClick={handleOpenDocuments}
      >{stickyNote.content.replace('{{docsPath}}', docsPath)}</NoteContent>
    </NoteContainer>
  );
};

export default StickyNote;
