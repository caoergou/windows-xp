import React, { createContext, useState, useContext, useCallback } from 'react';

const TrayContext = createContext(null);

export const useTray = () => useContext(TrayContext);

/**
 * TrayProvider — 系统托盘图标注册中心。
 *
 * 任意组件可调用 useTray() 注册托盘图标：
 *   const { register, unregister, update } = useTray();
 *   useEffect(() => {
 *     register('my-app', { icon: 'folder', tooltip: '我的应用', order: 30 });
 *     return () => unregister('my-app');
 *   }, [register, unregister]);
 *
 * TrayItem 字段：
 *   id       — 唯一标识
 *   icon     — XPIcon key（如 '360safe'、'qq'）
 *   tooltip  — 鼠标悬停提示
 *   order    — 渲染顺序（数字越小越靠左，默认 50）
 *   onClick  — 左键点击回调（可选）
 */
export const TrayProvider = ({ children }) => {
  const [items, setItems] = useState([]);

  // register — 注册新图标，id 已存在则更新
  const register = useCallback((id, config) => {
    setItems(prev => {
      const exists = prev.some(i => i.id === id);
      if (exists) return prev.map(i => i.id === id ? { ...i, ...config, id } : i);
      return [...prev, { order: 50, ...config, id }];
    });
  }, []);

  // unregister — 移除图标
  const unregister = useCallback((id) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  // update — 更新图标部分字段（如 tooltip、icon）
  const update = useCallback((id, updates) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
  }, []);

  const sorted = [...items].sort((a, b) => (a.order ?? 50) - (b.order ?? 50));

  return (
    <TrayContext.Provider value={{ items: sorted, register, unregister, update }}>
      {children}
    </TrayContext.Provider>
  );
};
