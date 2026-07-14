import React from 'react';
import styled, { keyframes, css } from 'styled-components';
import { WindowState } from '../../types';
import XPIcon from '../XPIcon';
import ContextMenu from '../ContextMenu';

const TaskItems = styled.div`
  flex: 1;
  display: flex;
  padding-left: 5px;
  gap: 2px;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const taskFlash = keyframes`
  0%, 100% { background: #3c81f3; }
  50%       { background: #ff8c00; }
`;

const TaskItem = styled.div<{ $active?: boolean; $flashing?: boolean }>`
  flex: 1 1 auto;
  min-width: 40px;
  max-width: 150px;
  height: 22px;
  color: #fff;
  border-radius: 2px;
  margin-top: 2px;
  padding: 0 8px;
  font-size: 11px;
  background-color: ${props => (props.$active ? '#1e52b7' : '#3c81f3')};
  box-shadow: ${props =>
    props.$active
      ? 'inset 0 0 1px 1px rgba(0, 0, 0, 0.2), inset 1px 0 1px rgba(0, 0, 0, 0.7)'
      : 'inset -1px 0px rgba(0, 0, 0, 0.3), inset 1px 1px 1px rgba(255, 255, 255, 0.2)'};
  position: relative;
  display: flex;
  align-items: center;
  overflow: hidden;
  cursor: pointer;

  ${props =>
    props.$flashing &&
    css`
      animation: ${taskFlash} 0.5s ease-in-out 6;
    `}

  &:hover {
    background-color: ${props => (props.$active ? '#3576f3' : '#53a3ff')};
    box-shadow: ${props =>
      props.$active
        ? 'inset 0 0 1px 1px rgba(0, 0, 0, 0.2), inset 1px 0 1px rgba(0, 0, 0, 0.7)'
        : 'inset -1px 0px rgba(0, 0, 0, 0.3), inset 1px 1px 1px rgba(255, 255, 255, 0.2)'};
  }

  &:active {
    background-color: #1e52b7;
    box-shadow:
      inset 0 0 1px 1px rgba(0, 0, 0, 0.3),
      inset 1px 0 1px rgba(0, 0, 0, 0.7);
  }

  .task-icon {
    margin-right: 5px;
  }
`;

interface TaskListProps {
  windows: WindowState[];
  activeWindowId: string | null;
  onTaskClick: (win: WindowState) => void;
  onTaskContextMenu: (e: React.MouseEvent, win: WindowState) => void;
  contextMenu: { x: number; y: number } | null;
  selectedWindow: WindowState | null;
  contextMenuRef: React.RefObject<HTMLDivElement>;
  onCloseContextMenu: () => void;
  onTaskMenuAction: (action: string) => void;
  t: (key: string) => string;
}

const TaskList: React.FC<TaskListProps> = ({
  windows,
  activeWindowId,
  onTaskClick,
  onTaskContextMenu,
  contextMenu,
  selectedWindow,
  contextMenuRef,
  onCloseContextMenu,
  onTaskMenuAction,
  t,
}) => {
  return (
    <>
      <TaskItems>
        {windows.map(win => (
          <TaskItem
            key={win.id}
            $active={activeWindowId === win.id && !win.isMinimized}
            $flashing={win.isFlashing}
            title={win.title}
            onClick={e => {
              e.stopPropagation();
              onTaskClick(win);
            }}
            onContextMenu={e => onTaskContextMenu(e, win)}
          >
            <XPIcon name={win.icon || 'app_window'} size={16} className="task-icon" />
            {win.title}
          </TaskItem>
        ))}
      </TaskItems>

      {contextMenu && (
        <ContextMenu
          ref={contextMenuRef}
          x={contextMenu.x}
          y={contextMenu.y}
          visible={true}
          onClose={onCloseContextMenu}
          menuItems={[
            {
              label: selectedWindow?.isMaximized ? t('window.restore') : t('window.maximize'),
              action: () => onTaskMenuAction('maximize'),
            },
            { label: t('window.minimize'), action: () => onTaskMenuAction('minimize') },
            { type: 'separator' },
            { label: t('window.close'), action: () => onTaskMenuAction('close') },
          ]}
        />
      )}
    </>
  );
};

export default TaskList;
