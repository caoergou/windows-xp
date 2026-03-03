import React, { createContext, useState, useContext, useCallback } from 'react';

interface TrayItem {
  id: string;
  icon: string;
  tooltip: string;
  order: number;
  onClick?: () => void;
}

interface TrayContextType {
  items: TrayItem[];
  register: (id: string, config: Omit<TrayItem, 'id'>) => void;
  unregister: (id: string) => void;
  update: (id: string, updates: Partial<Omit<TrayItem, 'id'>>) => void;
}

const TrayContext = createContext<TrayContextType | undefined>(undefined);

export const useTray = (): TrayContextType => {
  const context = useContext(TrayContext);
  if (context === undefined) {
    throw new Error('useTray must be used within a TrayProvider');
  }
  return context;
};

/**
 * TrayProvider — System tray icon registry.
 *
 * Any component can call useTray() to register tray icons:
 *   const { register, unregister, update } = useTray();
 *   useEffect(() => {
 *     register('my-app', { icon: 'folder', tooltip: 'My App', order: 30 });
 *     return () => unregister('my-app');
 *   }, [register, unregister]);
 *
 * TrayItem fields:
 *   id       — Unique identifier
 *   icon     — XPIcon key (e.g. '360safe', 'qq')
 *   tooltip  — Mouse hover text
 *   order    — Rendering order (smaller numbers appear first, default 50)
 *   onClick  — Left click callback (optional)
 */
export const TrayProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<TrayItem[]>([]);

  // Register new icon, update if id exists
  const register = useCallback((id: string, config: Omit<TrayItem, 'id'>) => {
    setItems(prev => {
      const exists = prev.some(i => i.id === id);
      if (exists) return prev.map(i => i.id === id ? { ...i, ...config, id } : i);
      return [...prev, { order: 50, ...config, id }];
    });
  }, []);

  // Unregister icon
  const unregister = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  // Update icon fields (e.g. tooltip, icon)
  const update = useCallback((id: string, updates: Partial<Omit<TrayItem, 'id'>>) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
  }, []);

  const sortedItems = [...items].sort((a, b) => (a.order ?? 50) - (b.order ?? 50));

  const contextValue: TrayContextType = {
    items: sortedItems,
    register,
    unregister,
    update
  };

  return (
    <TrayContext.Provider value={contextValue}>
      {children}
    </TrayContext.Provider>
  );
};
