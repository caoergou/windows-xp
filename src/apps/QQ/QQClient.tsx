import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../hooks/useApp';
import { useWindowManager } from '../../context/WindowManagerContext';
import { useTray } from '../../context/TrayContext';
import { useXPEventBus } from '../../context/EventBusContext';
import { useCulture } from '../../context/CultureContext';
import { defaultQQProfile } from '../../data/qq/defaultProfile';
import { qqStore, QQDriver } from './qqStore';
import { useQQStore } from './useQQStore';
import { qqAvatar } from './assets';
import { QQ_SELECTABLE_STATUS, QQ_STATUS_LABEL } from './statusMeta';
import QQLoginPanel from './QQLoginPanel';
import QQLoadingPanel from './QQLoadingPanel';
import QQBuddyList from './QQBuddyList';
import QQChat from './QQChat';
import QQCloseDialog, { QQCloseChoice } from './QQCloseDialog';
import type { MenuItem } from '../../types';
import type { QQStatus } from '../../data/qq/types';
import QQArchive from './QQArchive';

type Phase = 'login' | 'loading' | 'panel';

const SIZE = {
  login: { w: 352, h: 266 },
  panel: { w: 202, h: 600 },
  chat: { w: 540, h: 476 },
};

interface QQClientProps {
  windowId?: string;
  /**
   * "Version too low" easter egg (configurable). Off by default - on login success
   * the main panel opens; when set to true, a "version too low" prompt pops up
   * after login and returns to the login box (#119 requested downgrading the dead
   * end to a configurable option).
   */
  versionEgg?: boolean;
}

/**
 * QQ client main flow: login -> logging-in -> main panel, the three phases morph in-place
 * inside the *same* window (size/title switch with the phase), matching real QQ.
 * Chat windows open as independent windows of the same app (appId 'QQ').
 * This component is also the "runtime driver": it wires buddy online / incoming-message
 * side effects (sound, tray blink, taskbar flash, online balloon, event dispatch)
 * to the engine contexts.
 *
 * The main-panel phase also wires classic QQ window/tray behavior (#refine-qq):
 * minimize -> collapse to system tray (disappear from taskbar);
 * close -> show a "Hide to tray / Quit" confirmation dialog;
 * tray context menu can switch online status, open main panel, or quit.
 */
const QQClient: React.FC<QQClientProps> = ({ windowId, versionEgg = false }) => {
  const { t } = useTranslation();
  const api = useApp(windowId);
  const clientWindowId = api.window.id;
  const wm = useWindowManager();
  const wmRef = useRef(wm);
  wmRef.current = wm;
  const tray = useTray();
  const trayRef = useRef(tray);
  trayRef.current = tray;
  const bus = useXPEventBus();
  const { culture } = useCulture();
  const profile = culture.qq ?? defaultQQProfile;

  const [phase, setPhase] = useState<Phase>('login');
  const [closeAsk, setCloseAsk] = useState(false);
  const state = useQQStore();
  const meStatus = state.me?.status;
  const totalUnread = Object.values(state.unread).reduce((a, b) => a + b, 0);

  // Close guard callback: the dialog uses this to actually close the main window when "退出" is chosen; programmatic quit sets bypass to skip the guard.
  const forceCloseRef = useRef<(() => void) | null>(null);
  const bypassCloseRef = useRef(false);

  // --- Open a chat window with a buddy (deduplicate: focus if already open) ---------------------------
  const openChat = useCallback((buddyId: string) => {
    const buddy = qqStore.buddy(buddyId);
    if (!buddy) return;
    const existing = wmRef.current.windows.find(
      w => w.appId === 'QQ' && (w.componentProps as { buddyId?: string })?.buddyId === buddyId
    );
    if (existing) {
      wmRef.current.focusWindow(existing.id);
      return;
    }
    const screenW = window.innerWidth || 1280;
    const chatLeft = Math.max(0, Math.round((screenW - SIZE.chat.w) / 2 - SIZE.panel.w));
    wmRef.current.openWindow(
      'QQ',
      t('qq.chatTitle', { nickname: buddy.nickname }),
      <QQChat buddyId={buddyId} />,
      'qq',
      {
        width: SIZE.chat.w,
        height: SIZE.chat.h,
        minWidth: SIZE.chat.w,
        minHeight: SIZE.chat.h,
        left: chatLeft,
        resizable: false,
        componentProps: { view: 'chat', buddyId },
      }
    );
  }, []);
  const openChatRef = useRef(openChat);
  openChatRef.current = openChat;

  const openArchive = useCallback(() => {
    const existing = wmRef.current.windows.find(
      w => w.appId === 'QQ' && (w.componentProps as { view?: string })?.view === 'archive'
    );
    if (existing) return wmRef.current.focusWindow(existing.id);
    wmRef.current.openWindow('QQ', t('qq.archive.title'), <QQArchive />, 'qq', {
      width: 650,
      height: 480,
      minWidth: 500,
      minHeight: 360,
      componentProps: { view: 'archive' },
    });
  }, [t]);

  // --- Quit QQ: close all chat windows, reset runtime, and allow the main window to close (bypass close guard) ------
  const exitQQ = useCallback(() => {
    wmRef.current.windows
      .filter(w => w.appId === 'QQ' && w.id !== clientWindowId)
      .forEach(w => wmRef.current.closeWindow(w.id));
    qqStore.reset();
    bypassCloseRef.current = true;
    wmRef.current.closeWindow(clientWindowId);
  }, [clientWindowId]);
  const exitQQRef = useRef(exitQQ);
  exitQQRef.current = exitQQ;

  // Clicking the tray icon: if there are unread messages, open the sender's chat; otherwise restore/focus the main panel (including restoring from tray).
  const activateFromTray = useCallback(() => {
    const s = qqStore.getState();
    const firstUnread = s.buddies.find(b => (s.unread[b.id] ?? 0) > 0);
    if (firstUnread) {
      openChatRef.current(firstUnread.id);
      return;
    }
    wmRef.current.focusWindow(clientWindowId);
  }, [clientWindowId]);
  const activateFromTrayRef = useRef(activateFromTray);
  activateFromTrayRef.current = activateFromTray;

  // Tray right-click menu: online-status switch (check current item) + open main panel + quit.
  const buildTrayMenu = useCallback(
    (status?: QQStatus): MenuItem[] => [
      ...QQ_SELECTABLE_STATUS.map(s => ({
        label: `${status === s ? '● ' : '　'}${QQ_STATUS_LABEL[s]}`,
        action: () => qqStore.setMeStatus(s),
      })),
      { type: 'separator' as const },
      { label: '打开主面板', action: () => wmRef.current.focusWindow(clientWindowId) },
      { label: '退出', action: () => exitQQRef.current() },
    ],
    [clientWindowId]
  );

  // --- Window size / position / title morph with the phase --------------------------------
  useEffect(() => {
    if (phase === 'login') {
      api.window.resize(SIZE.login.w, SIZE.login.h);
      api.window.setTitle('QQ用户登录');
    } else {
      // Main panel is tall and narrow (600px high); the window opens at a fixed top (see registry), so it stays on-screen.
      api.window.resize(SIZE.panel.w, SIZE.panel.h);
      api.window.setTitle('QQ2006');
    }
  }, [phase, api]);

  // --- Main-panel window behavior: minimize -> tray, close -> confirmation dialog (only active in main-panel phase) ----------
  useEffect(() => {
    if (phase !== 'panel') {
      api.window.setMinimizeGuard(null);
      api.window.setCloseGuard(null);
      return;
    }
    api.window.setMinimizeGuard(() => api.window.hide());
    api.window.setCloseGuard(forceClose => {
      if (bypassCloseRef.current) {
        bypassCloseRef.current = false;
        forceClose();
        return;
      }
      forceCloseRef.current = forceClose;
      setCloseAsk(true);
    });
    return () => {
      api.window.setMinimizeGuard(null);
      api.window.setCloseGuard(null);
    };
  }, [phase, api]);

  // --- Enter main panel: start session + register tray + wire side-effect driver -----------------
  useEffect(() => {
    if (phase !== 'panel') return;
    qqStore.start(profile);
    bus.emit({ type: 'qq:login' });
    bus.emit({ type: 'qq:open' });

    trayRef.current.register('qq', {
      icon: 'qq',
      tooltip: 'QQ',
      order: 40,
      onClick: () => activateFromTrayRef.current(),
      contextMenuItems: buildTrayMenu(qqStore.getState().me?.status),
    });

    const driver: QQDriver = {
      onBuddyOnline: buddy => {
        api.sound.play('qqOnline');
        trayRef.current.notify({
          icon: 'qq',
          title: 'QQ提示',
          body: `您的好友 ${buddy.nickname}(${buddy.number}) 上线了。`,
          anchorId: 'qq',
          timeout: 6000,
          onClick: () => openChatRef.current(buddy.id),
        });
      },
      onIncoming: (buddy, _message) => {
        api.sound.play('qqMessage');
        const win = wmRef.current.windows.find(
          w => w.appId === 'QQ' && (w.componentProps as { buddyId?: string })?.buddyId === buddy.id
        );
        if (win) wmRef.current.flashWindow(win.id);
      },
      emit: event => bus.emit(event),
    };
    const clearDriver = qqStore.setDriver(driver);

    return () => {
      clearDriver();
      trayRef.current.unregister('qq');
    };
  }, [phase, profile, api, bus, buildTrayMenu]);

  // Refresh the tray right-click menu checkmark when "my" status changes.
  useEffect(() => {
    if (phase !== 'panel') return;
    trayRef.current.update('qq', { contextMenuItems: buildTrayMenu(meStatus) });
  }, [phase, meStatus, buildTrayMenu]);

  // --- Tray icon blinks when unread (sender avatar <-> transparent alternation, classic QQ behavior) ----------
  useEffect(() => {
    if (phase !== 'panel' || totalUnread === 0) return;
    const firstUnread = state.buddies.find(b => (state.unread[b.id] ?? 0) > 0);
    const avatarIcon = firstUnread ? qqAvatar(firstUnread.avatar) : 'qq';
    let on = false;
    const iv = setInterval(() => {
      on = !on;
      trayRef.current.update('qq', { icon: on ? avatarIcon : 'qq' });
    }, 500);
    return () => {
      clearInterval(iv);
      trayRef.current.update('qq', { icon: 'qq' });
    };
  }, [phase, totalUnread, state.buddies, state.unread]);

  const handleLogin = useCallback(() => {
    setPhase('loading');
    // Logging in: enter the main panel after ~1.8s (or trigger the version easter egg).
    window.setTimeout(async () => {
      if (versionEgg) {
        api.sound.play('error');
        await api.dialog.alert({
          title: 'QQ',
          message: '您使用的 QQ 版本过低，无法登录。\n请前往官网下载最新版本的 QQ。',
          type: 'error',
        });
        setPhase('login');
        return;
      }
      setPhase('panel');
    }, 1800);
  }, [versionEgg, api]);

  const onCloseChoice = useCallback(
    (choice: QQCloseChoice) => {
      setCloseAsk(false);
      if (choice === 'hide') {
        api.window.hide();
      } else {
        exitQQ();
      }
    },
    [api, exitQQ]
  );

  if (phase === 'login') {
    return <QQLoginPanel onLogin={handleLogin} />;
  }
  if (phase === 'loading') {
    return <QQLoadingPanel onCancel={() => setPhase('login')} />;
  }
  return (
    <>
      <QQBuddyList onOpenChat={openChat} onOpenArchive={openArchive} onExit={exitQQ} />
      {closeAsk && <QQCloseDialog onConfirm={onCloseChoice} onCancel={() => setCloseAsk(false)} />}
    </>
  );
};

export default QQClient;
