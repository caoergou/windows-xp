import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useApp } from '../../hooks/useApp';
import { useWindowManager } from '../../context/WindowManagerContext';
import { useTray } from '../../context/TrayContext';
import { useXPEventBus } from '../../context/EventBusContext';
import { useCulture } from '../../context/CultureContext';
import { defaultQQProfile } from '../../data/qq/defaultProfile';
import { qqStore, QQDriver } from './qqStore';
import { useQQStore } from './useQQStore';
import QQLoginPanel from './QQLoginPanel';
import QQLoadingPanel from './QQLoadingPanel';
import QQBuddyList from './QQBuddyList';
import QQChat from './QQChat';

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
 */
const QQClient: React.FC<QQClientProps> = ({ windowId, versionEgg = false }) => {
  const api = useApp(windowId);
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
  const state = useQQStore();
  const totalUnread = Object.values(state.unread).reduce((a, b) => a + b, 0);

  // ── 打开与某好友的聊天窗口（去重：已开则聚焦）────────────────────────────
  const openChat = useCallback(
    (buddyId: string) => {
      const buddy = qqStore.buddy(buddyId);
      if (!buddy) return;
      const existing = wmRef.current.windows.find(
        w => w.appId === 'QQ' && (w.componentProps as { buddyId?: string })?.buddyId === buddyId
      );
      if (existing) {
        wmRef.current.focusWindow(existing.id);
        return;
      }
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
          resizable: false,
          componentProps: { view: 'chat', buddyId },
        }
      );
    },
    []
  );
  const openChatRef = useRef(openChat);
  openChatRef.current = openChat;

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
      onClick: () => {
        const s = qqStore.getState();
        const firstUnread = s.buddies.find(b => (s.unread[b.id] ?? 0) > 0);
        if (firstUnread) openChatRef.current(firstUnread.id);
      },
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
  }, [phase, profile, api, bus]);

  // ── 未读时托盘图标闪动（头像 ↔ 消息图标交替，经典 QQ 行为）──────────────
  useEffect(() => {
    if (phase !== 'panel' || totalUnread === 0) return;
    let on = false;
    const iv = setInterval(() => {
      on = !on;
      trayRef.current.update('qq', { icon: on ? 'email' : 'qq' });
    }, 500);
    return () => {
      clearInterval(iv);
      trayRef.current.update('qq', { icon: 'qq' });
    };
  }, [phase, totalUnread]);

  const handleLogin = useCallback(() => {
    setPhase('loading');
    // 登录中：约 1.8s 后进入主面板（或触发版本彩蛋）。
    window.setTimeout(async () => {
      if (versionEgg) {
        api.sound.play('error');
        await api.dialog.alert({
          title: 'QQ',
          message:
            '您使用的 QQ 版本过低，无法登录。\n请前往官网下载最新版本的 QQ。',
          type: 'error',
        });
        setPhase('login');
        return;
      }
      setPhase('panel');
    }, 1800);
  }, [versionEgg, api]);

  if (phase === 'login') {
    return <QQLoginPanel onLogin={handleLogin} />;
  }
  if (phase === 'loading') {
    return <QQLoadingPanel onCancel={() => setPhase('login')} />;
  }
  return <QQBuddyList onOpenChat={openChat} />;
};

export default QQClient;
