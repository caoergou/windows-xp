import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useWindowManager } from '../context/WindowManagerContext';
import XPIcon from '../components/XPIcon';

const Container = styled.div`
  box-sizing: border-box;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #ece9d8;
  font:
    11px Tahoma,
    'Microsoft YaHei',
    sans-serif;
`;

const MenuBar = styled.div`
  display: flex;
  gap: 18px;
  height: 22px;
  align-items: center;
  padding: 0 7px;
  border-bottom: 1px solid #aca899;
`;

const Tabs = styled.div`
  display: flex;
  padding: 8px 8px 0;
`;

const Tab = styled.div<{ $active?: boolean }>`
  padding: 4px 10px;
  border: 1px solid #919b9c;
  border-bottom-color: ${({ $active }) => ($active ? '#fff' : '#919b9c')};
  background: ${({ $active }) => ($active ? '#fff' : '#ece9d8')};
  position: relative;
  z-index: ${({ $active }) => ($active ? 2 : 1)};
`;

const TaskPane = styled.div`
  margin: -1px 8px 8px;
  border: 1px solid #919b9c;
  background: #fff;
  flex: 1;
  min-height: 0;
  overflow: auto;
`;

const HeaderRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 90px;
  background: #ece9d8;
  border-bottom: 1px solid #919b9c;
  font-weight: bold;

  span {
    padding: 4px 6px;
    border-right: 1px solid #aca899;
  }
`;

const TaskRow = styled.div<{ $selected?: boolean }>`
  display: grid;
  grid-template-columns: 1fr 90px;
  background: ${({ $selected }) => ($selected ? '#316ac5' : '#fff')};
  color: ${({ $selected }) => ($selected ? '#fff' : '#000')};

  > span {
    min-height: 24px;
    padding: 3px 6px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
`;

const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 0 8px 8px;

  button {
    min-width: 82px;
    height: 24px;
    font: inherit;
  }
`;

const TaskManager = () => {
  const { t } = useTranslation();
  const { windows, activeWindowId, focusWindow, closeWindow } = useWindowManager();
  const [selectedId, setSelectedId] = useState<string | null>(activeWindowId);

  useEffect(() => {
    if (selectedId && !windows.some(window => window.id === selectedId)) {
      setSelectedId(null);
    }
  }, [selectedId, windows]);

  const selectedWindow = windows.find(window => window.id === selectedId);

  return (
    <Container>
      <MenuBar>
        <span>{t('taskManager.menu.file')}</span>
        <span>{t('taskManager.menu.options')}</span>
        <span>{t('taskManager.menu.view')}</span>
        <span>{t('taskManager.menu.windows')}</span>
        <span>{t('taskManager.menu.help')}</span>
      </MenuBar>
      <Tabs>
        <Tab $active>{t('taskManager.applications')}</Tab>
        <Tab>{t('taskManager.processes')}</Tab>
        <Tab>{t('taskManager.performance')}</Tab>
      </Tabs>
      <TaskPane>
        <HeaderRow>
          <span>{t('taskManager.task')}</span>
          <span>{t('taskManager.status')}</span>
        </HeaderRow>
        {windows.map(window => (
          <TaskRow
            key={window.id}
            $selected={selectedId === window.id}
            onClick={() => setSelectedId(window.id)}
            onDoubleClick={() => focusWindow(window.id)}
          >
            <span>
              <XPIcon name={window.icon || 'app_window'} size={16} />
              {window.title}
            </span>
            <span>{t('taskManager.running')}</span>
          </TaskRow>
        ))}
      </TaskPane>
      <Footer>
        <button
          type="button"
          disabled={!selectedWindow}
          onClick={() => selectedWindow && focusWindow(selectedWindow.id)}
        >
          {t('taskManager.switchTo')}
        </button>
        <button
          type="button"
          disabled={!selectedWindow}
          onClick={() => selectedWindow && closeWindow(selectedWindow.id)}
        >
          {t('taskManager.endTask')}
        </button>
      </Footer>
    </Container>
  );
};

export default TaskManager;
