import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useWindowManager } from '../../context/WindowManagerContext';
import { useShortcut } from '../../context/KeymapContext';
import { useUserSession } from '../../context/UserSessionContext';
import { useModal } from '../../context/ModalContext';
import { useModalInteraction } from '../../context/ModalContext';
import { useCulture } from '../../context/CultureContext';
import { APP_REGISTRY, getAppDisplayName } from '../../registry/apps';
import { sounds } from '../../utils/soundManager';
import { defaultPlugin } from '../../apps/BrowserPlugins';
import { getSystemPathTitle } from '../../data/systemPaths';
import { WindowState } from '../../types';
import { useOptionalPowerTransition } from '../../context/PowerTransitionContext';
import { useStorage } from '../../context/StorageContext';
import { useXPEventBus } from '../../context/EventBusContext';
import { canUseDOM } from '../../utils/storage';
import StartButton from './StartButton';
import StartMenu from './StartMenu';
import TaskList from './TaskList';
import SystemTray from './SystemTray';
import TurnOffDialog from './TurnOffDialog';
import ContextMenu from '../ContextMenu';
import { resolveOSTheme } from '../../themes/useOSTheme';

const TaskbarContainer = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 30px;
  background: ${({ theme }) => resolveOSTheme(theme).tokens.TASKBAR_GRADIENT};
  display: flex;
  align-items: center;
  z-index: 2147483647;
  border-top: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.TASKBAR_BORDER};
`;

const Divider = styled.div`
  width: 5px;
  height: 100%;
  background: rgba(0, 0, 0, 0.1);
  margin-left: 5px;
`;

const Taskbar = () => {
  const { t } = useTranslation();
  const bus = useXPEventBus();
  const storage = useStorage();
  const {
    windows,
    activeWindowId,
    focusWindow,
    minimizeWindow,
    maximizeWindow,
    openWindow,
    closeWindow,
    setWindowTitle,
    arrangeWindows,
    registerTaskTarget,
  } = useWindowManager();
  const { culture, cultureKey } = useCulture();
  const startMenuProfile = culture.startMenu ?? { pinned: [], recent: [] };
  const { logout, user } = useUserSession();
  const { showModal } = useModal();
  const { blockedWindowId, signalBlockedInteraction } = useModalInteraction();
  const [startOpen, setStartOpen] = useState<boolean>(false);
  const [showTurnOff, setShowTurnOff] = useState<boolean>(false);
  const [taskContextMenu, setTaskContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [taskbarContextMenu, setTaskbarContextMenu] = useState<{ x: number; y: number } | null>(
    null
  );
  const [selectedWindows, setSelectedWindows] = useState<WindowState[]>([]);
  const startMenuRef = useRef<HTMLDivElement>(null);
  const startButtonRef = useRef<HTMLButtonElement>(null);
  const taskContextMenuRef = useRef<HTMLDivElement>(null);
  const taskbarRef = useRef<HTMLDivElement>(null);
  const showDesktopWindowsRef = useRef<string[] | null>(null);

  const arrangeVisibleWindows = useCallback(
    (arrangement: 'cascade' | 'tile-horizontal' | 'tile-vertical') => {
      const desktop = taskbarRef.current?.parentElement;
      if (!desktop) return;
      arrangeWindows(arrangement, {
        width: desktop.clientWidth,
        height: desktop.clientHeight - (taskbarRef.current?.offsetHeight ?? 30),
      });
      setTaskbarContextMenu(null);
    },
    [arrangeWindows]
  );

  const handleShowDesktop = useCallback(() => {
    const visibleWindows = windows
      .filter(window => !window.isMinimized && !window.isHidden && window.transition !== 'minimize')
      .sort((a, b) => a.zIndex - b.zIndex);
    const previousIds = showDesktopWindowsRef.current;

    if (previousIds && visibleWindows.length === 0) {
      const previousIdSet = new Set(previousIds);
      const restorable = windows
        .filter(
          window =>
            previousIdSet.has(window.id) &&
            (window.isMinimized || window.transition === 'minimize') &&
            !window.isHidden
        )
        .sort((a, b) => previousIds.indexOf(a.id) - previousIds.indexOf(b.id));
      showDesktopWindowsRef.current = null;
      if (restorable.length > 0) sounds.restore();
      restorable.forEach(window => focusWindow(window.id));
      setTaskbarContextMenu(null);
      return;
    }

    showDesktopWindowsRef.current = visibleWindows.map(window => window.id);
    visibleWindows.forEach(window => minimizeWindow(window.id));
    setTaskbarContextMenu(null);
  }, [focusWindow, minimizeWindow, windows]);

  // Ctrl+Esc opens the Start menu — the XP-native equivalent of the Win key,
  // which the browser doesn't intercept (#87 KBD-03; keymap #132).
  useShortcut(
    { id: 'startMenu.toggle', combo: 'Ctrl+Esc', scope: 'global', label: 'Open Start menu' },
    () => setStartOpen(prev => !prev)
  );

  // Announce Start-menu open/close from a single layer regardless of which
  // trigger toggled it (button, Ctrl+Esc, outside-click). The ref skips the
  // initial mount so a closed menu doesn't emit a spurious startmenu:close.
  const startOpenRef = useRef(startOpen);
  useEffect(() => {
    if (startOpen === startOpenRef.current) return;
    startOpenRef.current = startOpen;
    bus.emit({ type: startOpen ? 'startmenu:open' : 'startmenu:close' });
  }, [startOpen, bus]);

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
    storage.local.removeItem(storage.key('open_windows'));
    logout();
  }, [logout, storage]);

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
        setSelectedWindows([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [taskContextMenu]);

  const handleTaskContextMenu = useCallback(
    (e: React.MouseEvent, contextWindows: WindowState[]) => {
      e.preventDefault();
      e.stopPropagation();
      if (contextWindows.some(window => window.id === blockedWindowId)) {
        signalBlockedInteraction();
        return;
      }
      setSelectedWindows(contextWindows);
      setTaskContextMenu({ x: e.clientX, y: e.clientY });
      if (contextWindows.length === 1) focusWindow(contextWindows[0].id);
    },
    [blockedWindowId, focusWindow, signalBlockedInteraction]
  );

  const handleTaskbarContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setTaskContextMenu(null);
    setSelectedWindows([]);
    setTaskbarContextMenu({ x: event.clientX, y: event.clientY });
  }, []);

  const handleTaskMenuAction = useCallback(
    (action: string) => {
      if (selectedWindows.length === 0) return;
      setTaskContextMenu(null);
      setSelectedWindows([]);

      if (action === 'close-group') {
        selectedWindows.forEach(window => closeWindow(window.id));
        return;
      }
      if (action === 'minimize-group') {
        selectedWindows
          .filter(window => !window.isMinimized)
          .forEach(window => minimizeWindow(window.id));
        return;
      }

      const selectedWindow = selectedWindows[0];

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
    [selectedWindows, closeWindow, minimizeWindow, maximizeWindow]
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
      if (blockedWindowId === win.id) {
        signalBlockedInteraction();
        return;
      }
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
    [activeWindowId, blockedWindowId, focusWindow, minimizeWindow, signalBlockedInteraction]
  );

  const handleGroupWindowClick = useCallback(
    (win: WindowState) => {
      if (blockedWindowId === win.id) {
        signalBlockedInteraction();
        return;
      }
      if (win.isMinimized) sounds.restore();
      focusWindow(win.id);
    },
    [blockedWindowId, focusWindow, signalBlockedInteraction]
  );

  const handleLaunch = useCallback(
    (appName: string, path?: string[]) => {
      setStartOpen(false);
      const ie = APP_REGISTRY.InternetExplorer;
      const explorer = APP_REGISTRY.Explorer;

      if (appName === 'InternetExplorer') {
        const homepage = culture.browser?.homepage ?? 'about:blank';
        openWindow(
          'InternetExplorer',
          'Internet Explorer',
          ie.restore({ url: homepage, plugin: defaultPlugin }),
          ie.icon,
          // componentProps must carry the serializable launch state or the
          // window restores blank after a refresh (#81).
          { isMaximized: true, componentProps: { url: homepage } }
        );
      } else if (appName === 'QQMail') {
        openWindow(
          'InternetExplorer',
          t('startMenu.apps.qqMail'),
          ie.restore({ url: 'http://mail.qq.com', plugin: defaultPlugin }),
          ie.icon,
          { width: 1000, height: 700, componentProps: { url: 'http://mail.qq.com' } }
        );
      } else if (appName === 'Explorer') {
        if (!path) return;
        const title = getSystemPathTitle(path, t);
        openWindow('Explorer', title, explorer.restore({ initialPath: path }), 'folder', {
          ...explorer.window,
          componentProps: { initialPath: path },
        });
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
      } else if (appName === 'AllPrograms') {
        showModal(t('startMenu.allPrograms'), t('apps.comingSoon'), 'info');
      } else if (appName in APP_REGISTRY) {
        const app = APP_REGISTRY[appName];
        // Match only a singleton instance — a non-singleton child window (e.g. a
        // QQ chat) sharing this appId must not stand in for the client (#refine-qq).
        const existing = windows.find(w => w.appId === app.id && w.props?.singleton);
        if (existing && app.window?.singleton) {
          focusWindow(existing.id);
        } else {
          openWindow(app.id, getAppDisplayName(app, t), app.restore({}), app.icon, app.window);
        }
      }
    },
    [openWindow, windows, focusWindow, t, showModal, culture.browser?.homepage]
  );

  const power = useOptionalPowerTransition();
  const performPowerAction = useCallback(
    (state: 'shutdown' | 'restart') => {
      if (power) return power.request(state);
      storage.local.removeItem(storage.key('open_windows'));
      storage.local.setItem(storage.key('power_state'), state);
      bus.emit({ type: 'session:shutdown', mode: state });
      sounds.shutdown();
      if (canUseDOM) setTimeout(() => window.location.reload(), 600);
    },
    [bus, power, storage]
  );

  const handleLogoutWithSound = useCallback(() => {
    sounds.logoff();
    handleLogout();
  }, [handleLogout]);

  return (
    <>
      <TurnOffDialog
        visible={showTurnOff}
        title={t('shutdown.title')}
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
        cultureKey={cultureKey}
        onLaunch={handleLaunch}
        onTurnOff={() => {
          setStartOpen(false);
          setShowTurnOff(true);
        }}
        onLogout={handleLogoutWithSound}
        t={t}
      />

      <TaskbarContainer
        ref={taskbarRef}
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
          selectedWindows={selectedWindows}
          contextMenuRef={taskContextMenuRef}
          onCloseContextMenu={() => {
            setTaskContextMenu(null);
            setSelectedWindows([]);
          }}
          onTaskMenuAction={handleTaskMenuAction}
          registerTaskTarget={registerTaskTarget}
          onGroupWindowClick={handleGroupWindowClick}
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
          {
            label: t('taskbar.context.cascade'),
            action: () => arrangeVisibleWindows('cascade'),
            disabled: windows.filter(window => !window.isMinimized && !window.isHidden).length < 2,
          },
          {
            label: t('taskbar.context.tileHorizontally'),
            action: () => arrangeVisibleWindows('tile-horizontal'),
            disabled: windows.filter(window => !window.isMinimized && !window.isHidden).length < 2,
          },
          {
            label: t('taskbar.context.tileVertically'),
            action: () => arrangeVisibleWindows('tile-vertical'),
            disabled: windows.filter(window => !window.isMinimized && !window.isHidden).length < 2,
          },
          {
            label: t('taskbar.context.showDesktop'),
            action: handleShowDesktop,
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
