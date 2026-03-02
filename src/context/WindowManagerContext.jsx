import React, { createContext, useState, useContext, useEffect } from 'react';
import { restoreComponent } from '../utils/WindowFactory';

export const WindowManagerContext = createContext();

export const useWindowManager = () => useContext(WindowManagerContext);

export const WindowManagerProvider = ({ children }) => {
  const [windows, setWindows] = useState(() => {
    try {
      const saved = localStorage.getItem('xp_open_windows');
      if (saved) {
        const parsed = JSON.parse(saved);
        const restored = parsed.map(w => {
          const component = restoreComponent(w.appId, w.componentProps || w.props);
          return component ? { ...w, component } : null;
        }).filter(Boolean);
        return restored;
      }
    } catch (e) {
      console.error('Failed to restore windows:', e);
    }
    return [];
  });

  const [activeWindowId, setActiveWindowId] = useState(null);
  const [zIndexCounter, setZIndexCounter] = useState(10000);

  // ── 持久化（去除不可序列化字段及运行时状态）──────────────────────────────
  useEffect(() => {
    const windowsToSave = windows.map(
      ({ component, onOpen, onClose, onFocus, badge, progress, isFlashing, ...rest }) => rest
    );
    localStorage.setItem('xp_open_windows', JSON.stringify(windowsToSave));
  }, [windows]);

  // ── openWindow ────────────────────────────────────────────────────────────
  const openWindow = (appId, title, component, icon, props = {}) => {
    // Singleton 检查：同一 appId 已有窗口时直接聚焦
    if (props.singleton) {
      const existing = windows.find(w => w.appId === appId);
      if (existing) {
        focusWindow(existing.id);
        return existing.id;
      }
    }

    const id = Date.now().toString();

    const windowWidth  = props.width  || 600;
    const windowHeight = props.height || 400;
    const screenWidth  = window.innerWidth;
    const screenHeight = window.innerHeight - 30;

    const defaultLeft = Math.max(0, (screenWidth  - windowWidth)  / 2);
    const defaultTop  = Math.max(0, (screenHeight - windowHeight) / 2);

    const newWindow = {
      id,
      appId,
      title,
      component,
      componentProps: component?.props,
      icon,
      props,
      isMinimized: false,
      isMaximized: props.isMaximized || false,
      zIndex: zIndexCounter + 1,
      width:  props.width,
      height: props.height,
      left:   props.left || defaultLeft,
      top:    props.top  || defaultTop,
      // lifecycle callbacks（不会被序列化进 localStorage）
      onClose: props.onClose || null,
      onFocus: props.onFocus || null,
      // 运行时状态（不会被序列化进 localStorage）
      badge:      null,
      progress:   null,
      isFlashing: false,
    };

    setZIndexCounter(prev => prev + 1);
    setWindows(prev => [...prev, newWindow]);
    setActiveWindowId(id);

    // onOpen callback
    props.onOpen?.(id);

    return id;
  };

  // ── closeWindow ───────────────────────────────────────────────────────────
  const closeWindow = (id) => {
    const win = windows.find(w => w.id === id);
    win?.onClose?.(id);

    setWindows(prev => prev.filter(w => w.id !== id));
    if (activeWindowId === id) {
      const remaining = windows.filter(w => w.id !== id);
      if (remaining.length > 0) {
        const top = remaining.reduce((a, b) => (a.zIndex > b.zIndex ? a : b));
        setActiveWindowId(top.id);
      } else {
        setActiveWindowId(null);
      }
    }
  };

  // ── minimizeWindow ────────────────────────────────────────────────────────
  const minimizeWindow = (id) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, isMinimized: true } : w));
    setActiveWindowId(null);
  };

  // ── maximizeWindow ────────────────────────────────────────────────────────
  const maximizeWindow = (id) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, isMaximized: !w.isMaximized } : w));
  };

  // ── resizeWindow ──────────────────────────────────────────────────────────
  const resizeWindow = (id, width, height) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, width, height } : w));
  };

  // ── focusWindow ───────────────────────────────────────────────────────────
  const focusWindow = (id) => {
    const win = windows.find(w => w.id === id);
    if (!win) return;

    if (activeWindowId !== id) {
      win.onFocus?.(id);
      setZIndexCounter(prev => prev + 1);
      setWindows(prev =>
        prev.map(w => w.id === id
          ? { ...w, zIndex: zIndexCounter + 1, isMinimized: false, isFlashing: false }
          : w
        )
      );
      setActiveWindowId(id);
    } else if (win.isMinimized) {
      setWindows(prev => prev.map(w => w.id === id ? { ...w, isMinimized: false, isFlashing: false } : w));
    }
  };

  // ── setWindowTitle ────────────────────────────────────────────────────────
  const setWindowTitle = (id, title) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, title } : w));
  };

  // ── setWindowBadge ────────────────────────────────────────────────────────
  // badge: 数字或字符串显示在任务栏按钮角落，传 null 清除
  const setWindowBadge = (id, badge) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, badge } : w));
  };

  // ── setWindowProgress ─────────────────────────────────────────────────────
  // progress: 0-100 的数字显示在任务栏按钮底部，传 null 清除
  const setWindowProgress = (id, progress) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, progress } : w));
  };

  // ── flashWindow ───────────────────────────────────────────────────────────
  // 触发任务栏按钮闪烁以引起用户注意，3 秒后自动停止
  const flashWindow = (id) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, isFlashing: true } : w));
    setTimeout(() => {
      setWindows(prev => prev.map(w => w.id === id ? { ...w, isFlashing: false } : w));
    }, 3000);
  };

  return (
    <WindowManagerContext.Provider value={{
      windows, activeWindowId,
      openWindow, closeWindow, minimizeWindow, maximizeWindow, resizeWindow, focusWindow,
      setWindowTitle, setWindowBadge, setWindowProgress, flashWindow,
    }}>
      {children}
    </WindowManagerContext.Provider>
  );
};
