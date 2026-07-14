import React, { useCallback, useEffect, useRef, useState } from 'react';
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

type Phase = 'login' | 'loading' | 'panel';

const SIZE = {
  login: { w: 352, h: 266 },
  panel: { w: 202, h: 600 },
  chat: { w: 540, h: 476 },
};

interface QQClientProps {
  windowId?: string;
  /**
   * 「版本过低」彩蛋（可配置）。默认关闭 —— 登录成功进入主面板；置 true 时
   * 登录后弹「版本过低」提示并退回登录框（#119 要求把死胡同降级为配置项）。
   */
  versionEgg?: boolean;
}

/**
 * QQ 客户端主流程：登录 → 登录中 → 主面板，三个阶段在**同一个窗口内原地变形**
 * （尺寸 / 标题随阶段切换），与真实 QQ 一致。聊天窗口作为同一应用（appId 'QQ'）
 * 的独立窗口打开。本组件同时是「运行时驱动器」：把好友上线 / 收到消息的副作用
 * （声音、托盘闪动、任务栏闪烁、上线气泡、事件派发）接到引擎上下文。
 *
 * 主面板阶段还接入了经典 QQ 的窗口/托盘行为（#refine-qq）：最小化 → 收进系统托盘
 * （从任务栏消失）；关闭 → 弹「隐藏到托盘 / 退出程序」确认框；托盘右键菜单可切换
 * 在线状态、打开主面板或退出。
 */
const QQClient: React.FC<QQClientProps> = ({ windowId, versionEgg = false }) => {
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

  // 关闭守卫回调：dialog 选「退出」时用它真正关闭主窗；程序化退出时置 bypass 直接放行。
  const forceCloseRef = useRef<(() => void) | null>(null);
  const bypassCloseRef = useRef(false);

  // ── 打开与某好友的聊天窗口（去重：已开则聚焦）────────────────────────────
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
      `与 ${buddy.nickname} 聊天中`,
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

  // ── 退出 QQ：关闭所有聊天窗、重置运行时、放行关闭主窗（绕过关闭守卫）──────
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

  // 点击托盘图标：有未读则打开发信人聊天；否则恢复/聚焦主面板（含从托盘还原）。
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

  // 托盘右键菜单：在线状态切换（勾选当前项）+ 打开主面板 + 退出。
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

  // ── 窗口尺寸 / 位置 / 标题随阶段变形 ─────────────────────────────────────
  useEffect(() => {
    if (phase === 'login') {
      api.window.resize(SIZE.login.w, SIZE.login.h);
      api.window.setTitle('QQ用户登录');
    } else {
      // 主面板窄长（600px 高）；窗口以固定 top 打开（见注册表）故整体在屏内。
      api.window.resize(SIZE.panel.w, SIZE.panel.h);
      api.window.setTitle('QQ2006');
    }
  }, [phase, api]);

  // ── 主面板窗口行为：最小化→收托盘、关闭→确认框（仅主面板阶段生效）──────────
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

  // ── 进入主面板：启动会话 + 注册托盘 + 接入副作用驱动器 ──────────────────
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

  // 「我」的状态变化时刷新托盘右键菜单的勾选。
  useEffect(() => {
    if (phase !== 'panel') return;
    trayRef.current.update('qq', { contextMenuItems: buildTrayMenu(meStatus) });
  }, [phase, meStatus, buildTrayMenu]);

  // ── 未读时托盘图标闪动（发信人头像 ↔ 透明交替，经典 QQ 行为）──────────
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
    // 登录中：约 1.8s 后进入主面板（或触发版本彩蛋）。
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
      <QQBuddyList onOpenChat={openChat} onExit={exitQQ} />
      {closeAsk && <QQCloseDialog onConfirm={onCloseChoice} onCancel={() => setCloseAsk(false)} />}
    </>
  );
};

export default QQClient;
