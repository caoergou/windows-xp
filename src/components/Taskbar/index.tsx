import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useWindowManager } from '../../context/WindowManagerContext';
import { useUserSession } from '../../context/UserSessionContext';
import { useModal } from '../../context/ModalContext';
import { APP_REGISTRY, getAppDisplayName } from '../../registry/apps';
import { sounds } from '../../utils/soundManager';
import { defaultPlugin } from '../../apps/BrowserPlugins';
import {
  getBrowserCultureProfile,
  getStartMenuProfile,
  normalizeCultureLang,
} from '../../data/culture';
import { getSystemPathTitle } from '../../data/systemPaths';
import { WindowState } from '../../types';
import { safeLocalStorage, getStorageKey, canUseDOM } from '../../utils/storage';
import StartButton from './StartButton';
import StartMenu from './StartMenu';
import TaskList from './TaskList';
import SystemTray from './SystemTray';
import TurnOffDialog from './TurnOffDialog';
import ContextMenu from '../ContextMenu';

const TaskbarContainer = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 30px;
  background: linear-gradient(
    to bottom,
    #1f2f86 0%,
    #3165c4 3%,
    #3682e5 6%,
    #4490e6 10%,
    #3883e5 12%,
    #2b71e0 15%,
    #2663da 18%,
    #235bd6 20%,
    #2258d5 23%,
    #2157d6 38%,
    #245ddb 54%,
    #2562df 86%,
    #245fdc 89%,
    #2158d4 92%,
    #1d4ec0 95%,
    #1941a5 98%
  );
  display: flex;
  align-items: center;
  z-index: 2147483647;
  border-top: 1px solid #1d4ec0;
`;

const Divider = styled.div`
  width: 5px;
  height: 100%;
  background: rgba(0, 0, 0, 0.1);
  margin-left: 5px;
`;

const Taskbar = () => {
  const { t, i18n } = useTranslation();
  const {
    windows,
    activeWindowId,
    focusWindow,
    minimizeWindow,
    maximizeWindow,
    openWindow,
    closeWindow,
    setWindowTitle,
  } = useWindowManager();
  const startMenuProfile = getStartMenuProfile(i18n.language);
  const cultureKey = normalizeCultureLang(i18n.language);
  const { logout, user } = useUserSession();
  const { showModal } = useModal();
  const [startOpen, setStartOpen] = useState<boolean>(false);
  const [showTurnOff, setShowTurnOff] = useState<boolean>(false);
  const [taskContextMenu, setTaskContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [taskbarContextMenu, setTaskbarContextMenu] = useState<{ x: number; y: number } | null>(
    null
  );
  const [selectedWindow, setSelectedWindow] = useState<WindowState | null>(null);
  const startMenuRef = useRef<HTMLDivElement>(null);
  const startButtonRef = useRef<HTMLButtonElement>(null);
  const taskContextMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    windows.forEach(win => {
      const app = APP_REGISTRY[win.appId];
      if (app?.locales && !app.locales.includes(cultureKey)) {
        closeWindow(win.id);
        return;
      }
      if (app && !['Explorer', 'Notepad', 'FileProperties'].includes(win.appId)) {
        const nextTitle = getAppDisplayName(app, t);
        if (win.title !== nextTitle) setWindowTitle(win.id, nextTitle);
      }
    });
  }, [closeWindow, cultureKey, setWindowTitle, t, windows]);

  const handleLogout = useCallback(() => {
    safeLocalStorage.removeItem(getStorageKey('open_windows'));
    logout();
  }, [logout]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        startOpen &&
        startMenuRef.current &&
        !startMenuRef.current.contains(event.target as Node) &&
        startButtonRef.current &&
        !startButtonRef.current.contains(event.target as Node)
      ) {
        setStartOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [startOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        taskContextMenu &&
        taskContextMenuRef.current &&
        !taskContextMenuRef.current.contains(event.target as Node)
      ) {
        setTaskContextMenu(null);
        setSelectedWindow(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [taskContextMenu]);

  const handleTaskContextMenu = useCallback(
    (e: React.MouseEvent, win: WindowState) => {
      e.preventDefault();
      e.stopPropagation();
      setSelectedWindow(win);
      setTaskContextMenu({ x: e.clientX, y: e.clientY });
      focusWindow(win.id);
    },
    [focusWindow]
  );

  const handleTaskbarContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setTaskContextMenu(null);
    setSelectedWindow(null);
    setTaskbarContextMenu({ x: event.clientX, y: event.clientY });
  }, []);

  const handleTaskMenuAction = useCallback(
    (action: string) => {
      if (!selectedWindow) return;
      setTaskContextMenu(null);
      setSelectedWindow(null);

      switch (action) {
        case 'close':
          closeWindow(selectedWindow.id);
          break;
        case 'minimize':
          minimizeWindow(selectedWindow.id);
          break;
        case 'maximize':
        case 'restore':
          maximizeWindow(selectedWindow.id);
          break;
      }
    },
    [selectedWindow, closeWindow, minimizeWindow, maximizeWindow]
  );

  const toggleStart = useCallback(() => setStartOpen(prev => !prev), []);

  const handleStartButtonClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      if (!startOpen) {
        sounds.menuCommand();
      }
      toggleStart();
    },
    [startOpen, toggleStart]
  );

  const handleTaskClick = useCallback(
    (win: WindowState) => {
      if (activeWindowId === win.id && !win.isMinimized) {
        sounds.minimize();
        minimizeWindow(win.id);
      } else {
        if (win.isMinimized) {
          sounds.restore();
        }
        focusWindow(win.id);
      }
    },
    [activeWindowId, focusWindow, minimizeWindow]
  );

  const handleLaunch = useCallback(
    (appName: string, path?: string[]) => {
      setStartOpen(false);
      const ie = APP_REGISTRY.InternetExplorer;
      const explorer = APP_REGISTRY.Explorer;

      if (appName === 'InternetExplorer') {
        const homepage = getBrowserCultureProfile(i18n.language).homepage;
        openWindow(
          'InternetExplorer',
          'Internet Explorer',
          ie.restore({ url: homepage, plugin: defaultPlugin }),
          ie.icon,
          { isMaximized: true }
        );
      } else if (appName === 'QQMail') {
        openWindow(
          'qqmail-browser',
          'QQ邮箱',
          ie.restore({ url: 'http://mail.qq.com', plugin: defaultPlugin }),
          ie.icon,
          { width: 1000, height: 700 }
        );
      } else if (appName === 'Explorer') {
        if (!path) return;
        const title = getSystemPathTitle(path, t);
        openWindow(
          'Explorer',
          title,
          explorer.restore({ initialPath: path }),
          'folder',
          explorer.defaultWindowProps
        );
      } else if (appName === 'RunDialog') {
        openWindow(
          'RunDialog',
          t('startMenu.run'),
          APP_REGISTRY.RunDialog.restore({}),
          'run',
          APP_REGISTRY.RunDialog.window
        );
      } else if (appName === 'HelpAndSupport') {
        const help = APP_REGISTRY.HelpAndSupport;
        openWindow(
          'HelpAndSupport',
          t('helpAndSupport.title'),
          help.restore({}),
          'help',
          help.window
        );
      } else if (appName === 'Search') {
        showModal(t('startMenu.search'), t('apps.comingSoon'), 'info');
      } else if (appName === 'PrintersAndFaxes') {
        showModal(t('startMenu.printersAndFaxes'), t('apps.comingSoon'), 'info');
      } else if (appName === 'AllPrograms') {
        showModal(t('startMenu.allPrograms'), t('apps.comingSoon'), 'info');
      } else if (appName in APP_REGISTRY) {
        const app = APP_REGISTRY[appName];
        const existing = windows.find(w => w.appId === app.id);
        if (existing && app.window?.singleton) {
          focusWindow(existing.id);
        } else {
          openWindow(app.id, getAppDisplayName(app, t), app.restore({}), app.icon, app.window);
        }
      }
    },
    [openWindow, windows, focusWindow, t, showModal, i18n.language]
  );

  const performPowerAction = useCallback((state: 'shutdown' | 'restart') => {
    safeLocalStorage.removeItem(getStorageKey('open_windows'));
    safeLocalStorage.setItem(getStorageKey('power_state'), state);
    sounds.shutdown();
    if (canUseDOM) {
      // Give the shutdown sound a moment to start before the page reloads.
      setTimeout(() => window.location.reload(), 600);
    }
  }, []);

  const handleLogoutWithSound = useCallback(() => {
    sounds.logoff();
    handleLogout();
  }, [handleLogout]);

  return (
    <>
      <TurnOffDialog
        visible={showTurnOff}
        title={t('shutdown.title')}
        message={t('shutdown.message')}
        standbyLabel={t('shutdown.standBy')}
        turnOffLabel={t('shutdown.turnOff')}
        restartLabel={t('shutdown.restart')}
        cancelLabel={t('shutdown.cancel')}
        onShutdown={() => performPowerAction('shutdown')}
        onRestart={() => performPowerAction('restart')}
        onCancel={() => setShowTurnOff(false)}
      />

      <StartMenu
        isOpen={startOpen}
        menuRef={startMenuRef}
        userName={user.name}
        startMenuProfile={startMenuProfile}
        language={i18n.language}
        onLaunch={handleLaunch}
        onTurnOff={() => {
          setStartOpen(false);
          setShowTurnOff(true);
        }}
        onLogout={handleLogoutWithSound}
        t={t}
      />

      <TaskbarContainer
        data-testid="taskbar"
        data-xp-context-boundary="true"
        onClick={() => setStartOpen(false)}
        onContextMenu={handleTaskbarContextMenu}
      >
        <StartButton
          label={t('taskbar.start')}
          isActive={startOpen}
          buttonRef={startButtonRef}
          onClick={handleStartButtonClick}
        />
        <Divider />
        <TaskList
          windows={windows}
          activeWindowId={activeWindowId}
          onTaskClick={handleTaskClick}
          onTaskContextMenu={handleTaskContextMenu}
          contextMenu={taskContextMenu}
          selectedWindow={selectedWindow}
          contextMenuRef={taskContextMenuRef}
          onCloseContextMenu={() => {
            setTaskContextMenu(null);
            setSelectedWindow(null);
          }}
          onTaskMenuAction={handleTaskMenuAction}
          t={t}
        />
        <SystemTray />
      </TaskbarContainer>
      <ContextMenu
        visible={Boolean(taskbarContextMenu)}
        x={taskbarContextMenu?.x || 0}
        y={taskbarContextMenu?.y || 0}
        onClose={() => setTaskbarContextMenu(null)}
        menuItems={[
          {
            label: t('taskbar.context.toolbars'),
            submenu: [{ label: t('taskbar.context.quickLaunch'), disabled: true }],
          },
          { type: 'separator' },
          { label: t('taskbar.context.cascade'), disabled: windows.length === 0 },
          { label: t('taskbar.context.tileHorizontally'), disabled: windows.length === 0 },
          { label: t('taskbar.context.tileVertically'), disabled: windows.length === 0 },
          {
            label: t('taskbar.context.showDesktop'),
            action: () =>
              windows
                .filter(window => !window.isMinimized)
                .forEach(window => minimizeWindow(window.id)),
          },
          { type: 'separator' },
          { label: t('taskbar.context.taskManager'), action: () => handleLaunch('TaskManager') },
          { type: 'separator' },
          { label: t('taskbar.context.lockTaskbar'), disabled: true },
          {
            label: t('taskbar.context.properties'),
            action: () => showModal(t('taskbar.context.properties'), t('apps.comingSoon'), 'info'),
          },
        ]}
      />
    </>
  );
};

export default React.memo(Taskbar);
