import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useWindowManager } from '../context/WindowManagerContext';
import { useUserProgress } from '../context/UserProgressContext';
import Explorer from '../apps/Explorer';

const NoteContainer = styled.div`
  position: absolute;
  top: 80px;
  right: 20px;
  width: 220px;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  padding: 16px;
  box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.3), inset 0 0 40px rgba(255, 255, 255, 0.3);
  transform: rotate(-2deg);
  font-family: 'Comic Sans MS', 'Microsoft YaHei', cursive, sans-serif;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  z-index: 100;

  /* 首次登录时的闪烁效果 */
  ${props => props.$isGlowing && `
    animation: glow 2s ease-in-out infinite;

    @keyframes glow {
      0%, 100% {
        box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.3),
                    inset 0 0 40px rgba(255, 255, 255, 0.3),
                    0 0 20px rgba(251, 191, 36, 0.6);
      }
      50% {
        box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.3),
                    inset 0 0 40px rgba(255, 255, 255, 0.3),
                    0 0 40px rgba(251, 191, 36, 0.9);
      }
    }
  `}

  &:hover {
    transform: rotate(0deg) scale(1.02);
    box-shadow: 3px 3px 15px rgba(0, 0, 0, 0.4), inset 0 0 40px rgba(255, 255, 255, 0.3);
  }

  &:active {
    transform: rotate(0deg) scale(0.98);
  }

  /* 便签胶带效果 */
  &::before {
    content: '';
    position: absolute;
    top: -12px;
    left: 50%;
    transform: translateX(-50%);
    width: 80px;
    height: 24px;
    background: rgba(255, 255, 255, 0.4);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    border-left: 2px solid rgba(255, 255, 255, 0.3);
    border-right: 2px solid rgba(255, 255, 255, 0.3);
  }
`;

const NoteTitle = styled.div`
  font-size: 13px;
  font-weight: bold;
  color: #92400e;
  margin-bottom: 10px;
  border-bottom: 1px dashed #d97706;
  padding-bottom: 6px;
`;

const NoteContent = styled.div`
  font-size: 14px;
  line-height: 1.7;
  color: #78350f;
  white-space: pre-wrap;
  word-wrap: break-word;
`;

const HighlightText = styled.span`
  background-color: rgba(251, 191, 36, 0.4);
  padding: 1px 3px;
  border-radius: 2px;
  font-weight: 600;
`;

const StickyNote = () => {
  const { openWindow } = useWindowManager();
  const { progress, markStickyNoteRead } = useUserProgress();
  const [isGlowing, setIsGlowing] = useState(false);

  // 首次登录时添加闪烁效果吸引注意
  useEffect(() => {
    if (progress.firstLogin && !progress.stickyNoteRead) {
      setIsGlowing(true);
      // 10秒后停止闪烁
      const timer = setTimeout(() => setIsGlowing(false), 10000);
      return () => clearTimeout(timer);
    }
  }, [progress.firstLogin, progress.stickyNoteRead]);

  const handleClick = () => {
    // 标记便签已读
    markStickyNoteRead();
    setIsGlowing(false);

    // 打开文件管理器到D盘路径
    openWindow(
      'explorer-d-drive',
      '本地磁盘 (D:)',
      <Explorer initialPath={['My Computer', 'Local Disk (D:)']} />,
      'drive',
      {
        width: 600,
        height: 450,
        left: 100,
        top: 50
      }
    );
  };

  return (
    <NoteContainer
      onClick={handleClick}
      title="点击查看父亲留下的内容"
      $isGlowing={isGlowing}
    >
      <NoteTitle>给小灯 {isGlowing && '👆'}</NoteTitle>
      <NoteContent>
        小灯：

        爸爸等不到你放假回来了。
        D盘的东西，本来想当面跟你说的，现在只能你自己看了。
        密码是<HighlightText>你的生日</HighlightText>。

        我对不起那个孩子，也对不起你。
        你要活得比我明白。

        存折在床头柜第二层，密码是你妈生日。
        冬天记得穿厚点，别学你妈逞强。

        爸走了。
      </NoteContent>
    </NoteContainer>
  );
};

export default StickyNote;
