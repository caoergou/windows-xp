import React, { createContext, useState, useContext } from 'react';

const WindowManagerContext = createContext();

export const useWindowManager = () => useContext(WindowManagerContext);

export const WindowManagerProvider = ({ children }) => {
  const [windows, setWindows] = useState([]);
  const [activeWindowId, setActiveWindowId] = useState(null);
  const [zIndexCounter, setZIndexCounter] = useState(10000);

  const openWindow = (appId, title, component, icon, props = {}) => {
    // Check if already open (if we want single instance per app, or just always new)
    // For simplicity, always new instance unless specific logic
    const id = Date.now().toString();

    // Calculate center position, accounting for taskbar height (30px)
    const windowWidth = props.width || 600;
    const windowHeight = props.height || 400;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight - 30; // Subtract taskbar height

    const defaultLeft = Math.max(0, (screenWidth - windowWidth) / 2);
    const defaultTop = Math.max(0, (screenHeight - windowHeight) / 2);

    const newWindow = {
      id,
      appId,
      title,
      component,
      icon,
      props,
      isMinimized: false,
      isMaximized: false,
      zIndex: zIndexCounter + 1,
      width: props.width,
      height: props.height,
      left: props.left || defaultLeft,
      top: props.top || defaultTop
    };
    
    setZIndexCounter(prev => prev + 1);
    setWindows([...windows, newWindow]);
    setActiveWindowId(id);
  };

  const closeWindow = (id) => {
    setWindows(windows.filter(w => w.id !== id));
    if (activeWindowId === id) {
        // Activate next top window
        const remaining = windows.filter(w => w.id !== id);
        if (remaining.length > 0) {
            // Find max zIndex
            const max = remaining.reduce((prev, current) => (prev.zIndex > current.zIndex) ? prev : current);
            setActiveWindowId(max.id);
        } else {
            setActiveWindowId(null);
        }
    }
  };

  const minimizeWindow = (id) => {
     setWindows(windows.map(w => w.id === id ? { ...w, isMinimized: true } : w));
     setActiveWindowId(null); // Deselect
  };

  const maximizeWindow = (id) => {
     setWindows(windows.map(w => w.id === id ? { ...w, isMaximized: !w.isMaximized } : w));
  };

  const resizeWindow = (id, width, height) => {
    setWindows(windows.map(w => w.id === id ? { ...w, width, height } : w));
  };

  const focusWindow = (id) => {
      const win = windows.find(w => w.id === id);
      if (!win) return;
      
      if (activeWindowId !== id) {
          setZIndexCounter(prev => prev + 1);
          setWindows(windows.map(w => w.id === id ? { ...w, zIndex: zIndexCounter + 1, isMinimized: false } : w));
          setActiveWindowId(id);
      } else if (win.isMinimized) {
           // Restore if clicking taskbar item
           setWindows(windows.map(w => w.id === id ? { ...w, isMinimized: false } : w));
      }
  };

  return (
    <WindowManagerContext.Provider value={{ windows, activeWindowId, openWindow, closeWindow, minimizeWindow, maximizeWindow, resizeWindow, focusWindow }}>
      {children}
    </WindowManagerContext.Provider>
  );
};
