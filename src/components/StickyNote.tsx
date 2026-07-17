import React, { useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useWindowManagerActions } from '../context/WindowManagerContext';
import { useCulture } from '../context/CultureContext';
import { APP_REGISTRY } from '../registry/apps';
import { SYSTEM_PATHS } from '../data/systemPaths';

/* brand-palette:start — centrally declared app-identity colours (#213 batch 4).
   Exempt from the guard:purity hex ratchet; NOT COLORS tokens on purpose: this
   app keeps its own period look even if the OS theme is swapped (#143). */
const PALETTE = {
  orange700: '#78350F',
  orange7002: '#92400E',
  orange600: '#B45309',
  orange6002: '#D97706',
  yellow200: '#FDE68A',
  yellow100: '#FEF3C7',
};
/* brand-palette:end */

const NoteContainer = styled.div`
  position: absolute;
  top: 80px;
  right: 20px;
  width: 210px;
  background: linear-gradient(135deg, ${PALETTE.yellow100} 0%, ${PALETTE.yellow200} 100%);
  padding: 14px 14px 12px;
  box-shadow:
    2px 2px 10px rgba(0, 0, 0, 0.3),
    inset 0 0 40px rgba(255, 255, 255, 0.3);
  transform: rotate(-2deg);
  font-family: 'Comic Sans MS', 'SimSun', '微软雅黑', cursive, sans-serif;
  cursor: default;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
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
    background: rgba(255, 255, 255, 0.45);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  }

  &:hover {
    transform: rotate(0deg) scale(1.02);
    box-shadow:
      3px 3px 15px rgba(0, 0, 0, 0.35),
      inset 0 0 40px rgba(255, 255, 255, 0.3);
  }
`;

const NoteTitle = styled.div`
  font-size: 13px;
  font-weight: bold;
  color: ${PALETTE.orange7002};
  margin-bottom: 8px;
  border-bottom: 1px dashed ${PALETTE.orange6002};
  padding-bottom: 5px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const CloseBtn = styled.span`
  font-size: 12px;
  color: ${PALETTE.orange600};
  cursor: pointer;
  line-height: 1;
  padding: 0 2px;
  &:hover {
    color: ${PALETTE.orange7002};
  }
`;

const NoteContent = styled.div`
  font-size: 12px;
  line-height: 1.75;
  color: ${PALETTE.orange700};
  white-space: pre-wrap;
`;

const StickyNote = () => {
  const { t } = useTranslation();
  const { openWindow } = useWindowManagerActions();
  const { culture } = useCulture();
  const [visible, setVisible] = useState<boolean>(true);
  const stickyNote = culture.stickyNote ?? { title: 'Memo', content: '' };

  if (!visible) return null;

  const docsPath = t('startMenu.myDocuments');
  const handleOpenDocuments = () => {
    openWindow(
      'Explorer',
      docsPath,
      APP_REGISTRY.Explorer.restore({ initialPath: [...SYSTEM_PATHS.myDocuments] }),
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
      <NoteContent style={{ cursor: 'pointer' }} onDoubleClick={handleOpenDocuments}>
        {stickyNote.content.replace('{{docsPath}}', docsPath)}
      </NoteContent>
    </NoteContainer>
  );
};

export default StickyNote;
