import React, { useState } from 'react';
import styled from 'styled-components';
import { useWindowManager } from '../context/WindowManagerContext';
import Explorer from '../apps/Explorer';

const NoteContainer = styled.div`
  position: absolute;
  top: 80px;
  right: 20px;
  width: 210px;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  padding: 14px 14px 12px;
  box-shadow: 2px 2px 10px rgba(0,0,0,0.3), inset 0 0 40px rgba(255,255,255,0.3);
  transform: rotate(-2deg);
  font-family: 'Comic Sans MS', '微软雅黑', cursive, sans-serif;
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
  const { openWindow } = useWindowManager();
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <NoteContainer>
      <NoteTitle>
        备忘录
        <CloseBtn onClick={() => setVisible(false)}>✕</CloseBtn>
      </NoteTitle>
      <NoteContent
        style={{ cursor: 'pointer' }}
        onDoubleClick={() =>
          openWindow('我的文档', '我的文档',
            <Explorer initialPath={['我的文档']} />, 'documents',
            { width: 700, height: 500 })
        }
      >{`📁 双击打开我的文档

☑ 电脑密码：password
☐ 更新 360 安全卫士
☐ 用迅雷下载暴风影音

💡 小贴士：
   右键桌面可刷新`}
      </NoteContent>
    </NoteContainer>
  );
};

export default StickyNote;
