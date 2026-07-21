import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useWindowManager } from '../../context/WindowManagerContext';
import { useWindowId } from '../../context/WindowIdContext';
import { useModal } from '../../context/ModalContext';
import { useUserSession } from '../../context/UserSessionContext';
import { APP_REGISTRY, getAppDisplayName } from '../../registry/apps';
import {
  XPMenuBar,
  XPMenuBarItem,
  XPMenuSlot,
  XPMenuDropdown,
  XPMenuDropdownItem,
  XPMenuSeparator,
  XPMenuMark,
} from '../../components/XPMenuBar';
import { XPButton } from '../../components/XPButton';
import XPIcon from '../../components/XPIcon';
import { buildProcessRows } from './data';
import { useSystemStats } from './useSystemStats';
import Processes from './Processes';
import Performance from './Performance';
import {
  Container,
  Tabs,
  ListFrame,
  GroupLabel,
  AppHeaderRow,
  AppRow,
  Actions,
  StatusBar,
  StatusCell,
  AboutOverlay,
  AboutBox,
  AboutText,
  AboutActions,
} from './styled';

type TabId = 'applications' | 'processes' | 'performance';
type MenuId = 'file' | 'options' | 'view' | 'windows' | 'help' | null;

const TaskManager: React.FC = () => {
  const { t } = useTranslation();
  const { windows, activeWindowId, focusWindow, closeWindow, openWindow } = useWindowManager();
  const selfWindowId = useWindowId();
  const { showConfirm } = useModal();
  const { user } = useUserSession();

  const [tab, setTab] = useState<TabId>('applications');
  const [selectedAppId, setSelectedAppId] = useState<string | null>(activeWindowId);
  const [selectedProcKey, setSelectedProcKey] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<MenuId>(null);
  const [aboutOpen, setAboutOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const processRows = useMemo(() => buildProcessRows(windows, user.name), [windows, user.name]);
  const stats = useSystemStats(processRows.length);

  // Drop a stale selection when its window/process disappears.
  useEffect(() => {
    if (selectedAppId && !windows.some(w => w.id === selectedAppId)) {
      setSelectedAppId(null);
    }
  }, [selectedAppId, windows]);
  useEffect(() => {
    if (selectedProcKey && !processRows.some(p => p.key === selectedProcKey)) {
      setSelectedProcKey(null);
    }
  }, [selectedProcKey, processRows]);

  // Close any open menu when clicking elsewhere.
  useEffect(() => {
    const onDocMouseDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, []);

  const selectedWindow = windows.find(w => w.id === selectedAppId);
  const selectedProc = processRows.find(p => p.key === selectedProcKey);

  const openRunDialog = useCallback(() => {
    setOpenMenu(null);
    const runApp = APP_REGISTRY.RunDialog;
    openWindow(
      runApp.id,
      getAppDisplayName(runApp, t),
      runApp.restore({}),
      runApp.icon,
      runApp.window
    );
  }, [openWindow, t]);

  const exitTaskManager = useCallback(() => {
    setOpenMenu(null);
    if (selfWindowId) closeWindow(selfWindowId);
  }, [closeWindow, selfWindowId]);

  const endSelectedProcess = useCallback(async () => {
    if (!selectedProc) return;
    if (selectedProc.system) {
      const ok = await showConfirm(
        t('taskManager.warning.title'),
        t('taskManager.warning.message'),
        'warning',
        t('taskManager.warning.confirm'),
        t('common.cancel', 'Cancel')
      );
      if (!ok) return;
      // System processes can't actually be killed here — the warning is the
      // whole point (faithful to XP). Clear the selection and move on.
      setSelectedProcKey(null);
      return;
    }
    if (selectedProc.windowId) {
      closeWindow(selectedProc.windowId);
      setSelectedProcKey(null);
    }
  }, [selectedProc, showConfirm, closeWindow, t]);

  const toggleMenu = (id: Exclude<MenuId, null>) =>
    setOpenMenu(current => (current === id ? null : id));

  const menuGrey = { $disabled: true } as const;

  return (
    <Container onContextMenu={e => e.preventDefault()}>
      <XPMenuBar ref={menuRef}>
        {/* File */}
        <XPMenuSlot>
          <XPMenuBarItem
            type="button"
            $active={openMenu === 'file'}
            onClick={() => toggleMenu('file')}
          >
            {t('taskManager.menu.file')}
          </XPMenuBarItem>
          {openMenu === 'file' && (
            <XPMenuDropdown role="menu">
              <XPMenuDropdownItem type="button" role="menuitem" onClick={openRunDialog}>
                <XPMenuMark />
                {t('taskManager.menuItems.newTask')}
              </XPMenuDropdownItem>
              <XPMenuSeparator />
              <XPMenuDropdownItem type="button" role="menuitem" onClick={exitTaskManager}>
                <XPMenuMark />
                {t('taskManager.menuItems.exit')}
              </XPMenuDropdownItem>
            </XPMenuDropdown>
          )}
        </XPMenuSlot>

        {/* Options (all disabled — visual only) */}
        <XPMenuSlot>
          <XPMenuBarItem
            type="button"
            $active={openMenu === 'options'}
            onClick={() => toggleMenu('options')}
          >
            {t('taskManager.menu.options')}
          </XPMenuBarItem>
          {openMenu === 'options' && (
            <XPMenuDropdown role="menu">
              <XPMenuDropdownItem type="button" role="menuitem" {...menuGrey} aria-disabled>
                <XPMenuMark />
                {t('taskManager.menuItems.alwaysOnTop')}
              </XPMenuDropdownItem>
              <XPMenuDropdownItem type="button" role="menuitem" {...menuGrey} aria-disabled>
                <XPMenuMark />
                {t('taskManager.menuItems.minimizeOnUse')}
              </XPMenuDropdownItem>
              <XPMenuDropdownItem type="button" role="menuitem" {...menuGrey} aria-disabled>
                <XPMenuMark />
                {t('taskManager.menuItems.hideWhenMinimized')}
              </XPMenuDropdownItem>
            </XPMenuDropdown>
          )}
        </XPMenuSlot>

        {/* View (disabled placeholders) */}
        <XPMenuSlot>
          <XPMenuBarItem
            type="button"
            $active={openMenu === 'view'}
            onClick={() => toggleMenu('view')}
          >
            {t('taskManager.menu.view')}
          </XPMenuBarItem>
          {openMenu === 'view' && (
            <XPMenuDropdown role="menu">
              <XPMenuDropdownItem type="button" role="menuitem" {...menuGrey} aria-disabled>
                <XPMenuMark />
                {t('taskManager.menuItems.refreshNow')}
              </XPMenuDropdownItem>
              <XPMenuDropdownItem type="button" role="menuitem" {...menuGrey} aria-disabled>
                <XPMenuMark />
                {t('taskManager.menuItems.updateSpeed')}
              </XPMenuDropdownItem>
            </XPMenuDropdown>
          )}
        </XPMenuSlot>

        {/* Windows (disabled placeholders) */}
        <XPMenuSlot>
          <XPMenuBarItem
            type="button"
            $active={openMenu === 'windows'}
            onClick={() => toggleMenu('windows')}
          >
            {t('taskManager.menu.windows')}
          </XPMenuBarItem>
          {openMenu === 'windows' && (
            <XPMenuDropdown role="menu">
              <XPMenuDropdownItem type="button" role="menuitem" {...menuGrey} aria-disabled>
                <XPMenuMark />
                {t('taskManager.menuItems.tileHorizontally')}
              </XPMenuDropdownItem>
              <XPMenuDropdownItem type="button" role="menuitem" {...menuGrey} aria-disabled>
                <XPMenuMark />
                {t('taskManager.menuItems.tileVertically')}
              </XPMenuDropdownItem>
              <XPMenuDropdownItem type="button" role="menuitem" {...menuGrey} aria-disabled>
                <XPMenuMark />
                {t('taskManager.menuItems.cascade')}
              </XPMenuDropdownItem>
            </XPMenuDropdown>
          )}
        </XPMenuSlot>

        {/* Help */}
        <XPMenuSlot>
          <XPMenuBarItem
            type="button"
            $active={openMenu === 'help'}
            onClick={() => toggleMenu('help')}
          >
            {t('taskManager.menu.help')}
          </XPMenuBarItem>
          {openMenu === 'help' && (
            <XPMenuDropdown role="menu">
              <XPMenuDropdownItem type="button" role="menuitem" {...menuGrey} aria-disabled>
                <XPMenuMark />
                {t('taskManager.menuItems.helpTopics')}
              </XPMenuDropdownItem>
              <XPMenuSeparator />
              <XPMenuDropdownItem
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpenMenu(null);
                  setAboutOpen(true);
                }}
              >
                <XPMenuMark />
                {t('taskManager.menuItems.about')}
              </XPMenuDropdownItem>
            </XPMenuDropdown>
          )}
        </XPMenuSlot>
      </XPMenuBar>

      <Tabs
        activeId={tab}
        onChange={id => setTab(id as TabId)}
        tabs={[
          {
            id: 'applications',
            label: t('taskManager.applications'),
            testId: 'taskmgr-tab-applications',
            content: (
              <>
                <GroupLabel>{t('taskManager.tasksLabel')}</GroupLabel>
                <ListFrame data-testid="taskmgr-applications-list">
                  <AppHeaderRow>
                    <span>{t('taskManager.task')}</span>
                    <span>{t('taskManager.status')}</span>
                  </AppHeaderRow>
                  {windows.map(win => (
                    <AppRow
                      key={win.id}
                      $selected={selectedAppId === win.id}
                      onClick={() => setSelectedAppId(win.id)}
                      onDoubleClick={() => focusWindow(win.id)}
                      data-testid={`taskmgr-app-${win.id}`}
                    >
                      <span>
                        <XPIcon name={win.icon || 'app_window'} size={16} />
                        {win.title}
                      </span>
                      <span>{t('taskManager.running')}</span>
                    </AppRow>
                  ))}
                </ListFrame>
                <Actions>
                  <XPButton
                    type="button"
                    disabled={!selectedWindow}
                    onClick={() => selectedWindow && closeWindow(selectedWindow.id)}
                  >
                    {t('taskManager.endTask')}
                  </XPButton>
                  <XPButton
                    type="button"
                    disabled={!selectedWindow}
                    onClick={() => selectedWindow && focusWindow(selectedWindow.id)}
                  >
                    {t('taskManager.switchTo')}
                  </XPButton>
                  <XPButton type="button" data-testid="taskmgr-new-task" onClick={openRunDialog}>
                    {t('taskManager.newTask')}
                  </XPButton>
                </Actions>
              </>
            ),
          },
          {
            id: 'processes',
            label: t('taskManager.processes'),
            testId: 'taskmgr-tab-processes',
            content: (
              <>
                <ListFrame>
                  <Processes
                    rows={processRows}
                    stats={stats}
                    selectedKey={selectedProcKey}
                    onSelect={setSelectedProcKey}
                  />
                </ListFrame>
                <Actions>
                  <XPButton
                    type="button"
                    data-testid="taskmgr-end-process"
                    disabled={!selectedProc}
                    onClick={endSelectedProcess}
                  >
                    {t('taskManager.endProcess')}
                  </XPButton>
                </Actions>
              </>
            ),
          },
          {
            id: 'performance',
            label: t('taskManager.performance'),
            testId: 'taskmgr-tab-performance',
            content: <Performance stats={stats} processCount={processRows.length} />,
          },
        ]}
      />

      <StatusBar data-testid="taskmgr-statusbar">
        <StatusCell>
          {t('taskManager.statusBar.processes', { count: processRows.length })}
        </StatusCell>
        <StatusCell>{t('taskManager.statusBar.cpuUsage', { percent: stats.cpuUsage })}</StatusCell>
        <StatusCell>
          {t('taskManager.statusBar.commitCharge', {
            current: stats.commitCurrentMB,
            limit: stats.commitLimitMB,
          })}
        </StatusCell>
      </StatusBar>

      {aboutOpen && (
        <AboutOverlay
          onClick={() => setAboutOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={t('taskManager.about.title')}
        >
          <AboutBox onClick={e => e.stopPropagation()}>
            <AboutText>{t('taskManager.about.message')}</AboutText>
            <AboutActions>
              <XPButton type="button" autoFocus onClick={() => setAboutOpen(false)}>
                {t('common.ok', 'OK')}
              </XPButton>
            </AboutActions>
          </AboutBox>
        </AboutOverlay>
      )}
    </Container>
  );
};

export default TaskManager;
