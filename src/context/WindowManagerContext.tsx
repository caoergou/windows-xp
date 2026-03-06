import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { restoreComponent } from '../utils/WindowFactory';
import { WindowState, WindowProps } from '../types';

interface WindowManagerContextType {
  windows: WindowState[];
  activeWindowId: string | null;
  openWindow: (appId: string, title: string, component: React.ReactNode, icon?: string, props?: WindowProps) => string;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  resizeWindow: (id: string, width: number, height: number) => void;
  moveWindow: (id: string, left: number, top: number) => void;
  focusWindow: (id: string) => void;
  setWindowTitle: (id: string, title: string) => void;
  setWindowBadge: (id: string, badge: string | number | null) => void;
  setWindowProgress: (id: string, progress: number | null) => void;
  flashWindow: (id: string) => void;
}

const WindowManagerContext = createContext<WindowManagerContextType | undefined>(undefined);

export const useWindowManager = (): WindowManagerContextType => {
  const context = useContext(WindowManagerContext);
  if (context === undefined) {
    throw new Error('useWindowManager must be used within a WindowManagerProvider');
  }
  return context;
};

export const WindowManagerProvider: React.FC<{
  children: React.ReactNode;
  value?: Partial<WindowManagerContextType>;
}> = ({ children, value }) => {
  const [windows, setWindows] = useState<WindowState[]>(() => {
    try {
      const saved = localStorage.getItem('xp_open_windows');
      if (saved) {
        const parsed = JSON.parse(saved);
        const restored = parsed.map(w => {
          const component = restoreComponent(w.appId, w.componentProps || w.props);
          return component ? { ...w, component } : null;
        }).filter(Boolean);
        return restored as WindowState[];
      }
    } catch (e) {
      console.error('Failed to restore windows:', e);
    }
    return [];
  });

  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const [zIndexCounter, setZIndexCounter] = useState(10000);

  // Persist windows to localStorage
  useEffect(() => {
    const windowsToSave = windows.map(
      ({ component, onOpen, onClose, onFocus, badge, progress, isFlashing, ...rest }) => rest
    );
    localStorage.setItem('xp_open_windows', JSON.stringify(windowsToSave));
  }, [windows]);

  // Open a new window
  const openWindow = useCallback((appId: string, title: string, component: React.ReactNode, icon?: string, props: WindowProps = {}): string => {
    // Singleton check: focus existing window if same appId exists
    if (props.singleton) {
      const existing = windows.find(w => w.appId === appId);
      if (existing) {
        focusWindow(existing.id);
        return existing.id;
      }
    }

    const id = Date.now().toString();

    const windowWidth = props.width || 600;
    const windowHeight = props.height || 400;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight - 30;

    const defaultLeft = Math.max(0, (screenWidth - windowWidth) / 2);
    const defaultTop = Math.max(0, (screenHeight - windowHeight) / 2);

    // 从 props 中提取 componentProps（如果有）
    // 不直接从 React 元素提取，而是使用显式传递的 componentProps
    const { componentProps, ...windowProps } = props;

    const newWindow: WindowState = {
      id,
      appId,
      title,
      component,
      componentProps: componentProps || {},  // 使用显式传递的 componentProps
      icon,
      props: windowProps,
      isMinimized: false,
      isMaximized: props.isMaximized || false,
      zIndex: zIndexCounter + 1,
      width: props.width,
      height: props.height,
      left: props.left || defaultLeft,
      top: props.top || defaultTop,
      onClose: props.onClose || null,
      onFocus: props.onFocus || null,
      badge: null,
      progress: null,
      isFlashing: false
    };

    setZIndexCounter(prev => prev + 1);
    setWindows(prev => [...prev, newWindow]);
    setActiveWindowId(id);

    props.onOpen?.(id);

    return id;
  }, [windows, zIndexCounter]);

  // Close a window
  const closeWindow = useCallback((id: string) => {
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
  }, [windows, activeWindowId]);

  // Minimize a window
  const minimizeWindow = useCallback((id: string) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, isMinimized: true } : w));
    setActiveWindowId(null);
  }, []);

  // Maximize/restore a window
  const maximizeWindow = useCallback((id: string) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, isMaximized: !w.isMaximized } : w));
  }, []);

  // Resize a window
  const resizeWindow = useCallback((id: string, width: number, height: number) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, width, height } : w));
  }, []);

  // Move a window
  const moveWindow = useCallback((id: string, left: number, top: number) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, left, top } : w));
  }, []);

  // Focus a window
  const focusWindow = useCallback((id: string) => {
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
  }, [windows, activeWindowId, zIndexCounter]);

  // Set window title
  const setWindowTitle = useCallback((id: string, title: string) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, title } : w));
  }, []);

  // Set window badge
  const setWindowBadge = useCallback((id: string, badge: string | number | null) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, badge } : w));
  }, []);

  // Set window progress
  const setWindowProgress = useCallback((id: string, progress: number | null) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, progress } : w));
  }, []);

  // Flash window to get attention
  const flashWindow = useCallback((id: string) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, isFlashing: true } : w));
    setTimeout(() => {
      setWindows(prev => prev.map(w => w.id === id ? { ...w, isFlashing: false } : w));
    }, 3000);
  }, []);

  const contextValue: WindowManagerContextType = {
    windows,
    activeWindowId,
    openWindow,
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    resizeWindow,
    focusWindow,
    moveWindow,
    setWindowTitle,
    setWindowBadge,
    setWindowProgress,
    flashWindow,
    ...value,
  };

  return (
    <WindowManagerContext.Provider value={contextValue}>
      {children}
    </WindowManagerContext.Provider>
  );
};
