import React from 'react';
import styled, { keyframes, css } from 'styled-components';
import { TFunction } from 'i18next';
import { WindowState } from '../../types';
import XPIcon from '../XPIcon';
import ContextMenu from '../ContextMenu';
import { APP_REGISTRY, getAppDisplayName } from '../../registry/apps';
import { buildTaskbarEntries } from '../../utils/taskbarGrouping';
import { COLORS } from '../../constants';

const TaskItems = styled.div`
  flex: 1;
  display: flex;
  padding-left: 5px;
  gap: 2px;
  overflow-x: hidden;
  overflow-y: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const TaskLabel = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const GroupArrow = styled.span`
  width: 0;
  height: 0;
  margin-left: auto;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 5px solid currentColor;
  flex: none;
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
  color: ${COLORS.WHITE};
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
  onTaskContextMenu: (e: React.MouseEvent, windows: WindowState[]) => void;
  contextMenu: { x: number; y: number } | null;
  selectedWindows: WindowState[];
  contextMenuRef: React.RefObject<HTMLDivElement>;
  onCloseContextMenu: () => void;
  onTaskMenuAction: (action: string) => void;
  registerTaskTarget: (id: string, element: HTMLElement | null) => void;
  onGroupWindowClick: (win: WindowState) => void;
  t: TFunction;
}

const TaskList: React.FC<TaskListProps> = ({
  windows,
  activeWindowId,
  onTaskClick,
  onTaskContextMenu,
  contextMenu,
  selectedWindows,
  contextMenuRef,
  onCloseContextMenu,
  onTaskMenuAction,
  registerTaskTarget,
  onGroupWindowClick,
  t,
}) => {
  const taskItemsRef = React.useRef<HTMLDivElement>(null);
  const [availableWidth, setAvailableWidth] = React.useState(0);
  const [openGroup, setOpenGroup] = React.useState<{
    appId: string;
    x: number;
    y: number;
  } | null>(null);

  React.useLayoutEffect(() => {
    const element = taskItemsRef.current;
    if (!element) return;
    const measure = () => setAvailableWidth(element.clientWidth);
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const entries = React.useMemo(
    () => buildTaskbarEntries(windows, availableWidth),
    [availableWidth, windows]
  );
  const groupedWindows = openGroup
    ? entries.find(entry => entry.grouped && entry.windows[0]?.appId === openGroup.appId)?.windows
    : undefined;

  return (
    <>
      <TaskItems ref={taskItemsRef}>
        {entries.map(entry => {
          if (entry.grouped) {
            const groupWindows = entry.windows;
            const representative = groupWindows[0];
            const app = APP_REGISTRY[representative.appId];
            const appName = app ? getAppDisplayName(app, t) : representative.title;
            const active = groupWindows.some(
              window => activeWindowId === window.id && !window.isMinimized
            );
            return (
              <TaskItem
                key={entry.key}
                ref={element =>
                  groupWindows.forEach(window => registerTaskTarget(window.id, element))
                }
                $active={active}
                $flashing={groupWindows.some(window => window.isFlashing)}
                title={`${groupWindows.length} ${appName}`}
                data-testid={`task-group-${representative.appId}`}
                onClick={event => {
                  event.stopPropagation();
                  const rect = event.currentTarget.getBoundingClientRect();
                  setOpenGroup({ appId: representative.appId, x: rect.left, y: rect.top });
                }}
                onContextMenu={event => onTaskContextMenu(event, groupWindows)}
              >
                <XPIcon
                  name={representative.icon || 'app_window'}
                  size={16}
                  className="task-icon"
                />
                <TaskLabel>
                  {groupWindows.length} {appName}
                </TaskLabel>
                <GroupArrow aria-hidden="true" />
              </TaskItem>
            );
          }

          const win = entry.windows[0];
          return (
            <TaskItem
              key={win.id}
              ref={element => registerTaskTarget(win.id, element)}
              data-testid={`task-button-${win.id}`}
              $active={activeWindowId === win.id && !win.isMinimized}
              $flashing={win.isFlashing}
              title={win.title}
              onClick={e => {
                e.stopPropagation();
                onTaskClick(win);
              }}
              onContextMenu={e => onTaskContextMenu(e, [win])}
            >
              <XPIcon name={win.icon || 'app_window'} size={16} className="task-icon" />
              <TaskLabel>{win.title}</TaskLabel>
            </TaskItem>
          );
        })}
      </TaskItems>

      {openGroup && groupedWindows && (
        <ContextMenu
          visible
          x={openGroup.x}
          y={openGroup.y}
          onClose={() => setOpenGroup(null)}
          menuItems={groupedWindows.map(window => ({
            label: window.title,
            icon: window.icon || 'app_window',
            action: () => onGroupWindowClick(window),
          }))}
        />
      )}

      {contextMenu && (
        <ContextMenu
          ref={contextMenuRef}
          x={contextMenu.x}
          y={contextMenu.y}
          visible={true}
          onClose={onCloseContextMenu}
          menuItems={
            selectedWindows.length > 1
              ? [
                  {
                    label: t('window.minimizeGroup'),
                    action: () => onTaskMenuAction('minimize-group'),
                  },
                  { type: 'separator' },
                  {
                    label: t('window.closeGroup'),
                    action: () => onTaskMenuAction('close-group'),
                  },
                ]
              : [
                  {
                    label: selectedWindows[0]?.isMaximized
                      ? t('window.restore')
                      : t('window.maximize'),
                    action: () => onTaskMenuAction('maximize'),
                  },
                  { label: t('window.minimize'), action: () => onTaskMenuAction('minimize') },
                  { type: 'separator' },
                  { label: t('window.close'), action: () => onTaskMenuAction('close') },
                ]
          }
        />
      )}
    </>
  );
};

export default TaskList;
