import React, { createContext, useState, useContext, useCallback, useRef } from 'react';
import styled from 'styled-components';
import { useXPEventBus } from './EventBusContext';
import { sounds } from '../utils/soundManager';
import BalloonTip from '../components/BalloonTip';

export interface TrayItem {
  id: string;
  icon: string;
  tooltip: string;
  order: number;
  onClick?: () => void;
}

/** Options for {@link TrayContextType.notify} (#118). */
export interface NotifyOptions {
  /** XPIcon key shown in the balloon (e.g. '360safe', 'network'). */
  icon?: string;
  /** Bold heading line. */
  title: string;
  /** Body text under the title. */
  body?: string;
  /** Milliseconds the balloon stays before auto-fading. `0` keeps it sticky. Default 9000. */
  timeout?: number;
  /** Called when the user clicks the balloon body. */
  onClick?: () => void;
}

interface ActiveNotification extends NotifyOptions {
  id: string;
}

export interface TrayContextType {
  items: TrayItem[];
  register: (id: string, config: Omit<TrayItem, 'id'>) => void;
  unregister: (id: string) => void;
  update: (id: string, updates: Partial<Omit<TrayItem, 'id'>>) => void;
  /**
   * Pop an XP tray balloon. One shows at a time; further calls queue behind it,
   * XP-style. Plays the notify sound and emits `notification:show` on display
   * and `notification:click` on click. Returns the notification id.
   */
  notify: (options: NotifyOptions) => string;
  /** Dismiss a queued or visible notification by id. */
  dismissNotification: (id: string) => void;
}

const TrayContext = createContext<TrayContextType | undefined>(undefined);

export const useTray = (): TrayContextType => {
  const context = useContext(TrayContext);
  if (context === undefined) {
    throw new Error('useTray must be used within a TrayProvider');
  }
  return context;
};

const DEFAULT_TIMEOUT = 9000;

const NotificationLayer = styled.div`
  position: fixed;
  bottom: 33px;
  right: 8px;
  z-index: 2000;
`;

/**
 * Renders the head of the notification queue as a fixed balloon above the
 * taskbar. On show it plays the notify sound (SND-06) and emits
 * `notification:show`; auto-fades after the timeout; a click emits
 * `notification:click` and runs the caller's `onClick`.
 */
const NotificationHost: React.FC<{
  queue: ActiveNotification[];
  onDismiss: (id: string) => void;
}> = ({ queue, onDismiss }) => {
  const bus = useXPEventBus();
  const current = queue[0];
  const shownRef = useRef<string | null>(null);

  React.useEffect(() => {
    if (!current) {
      shownRef.current = null;
      return undefined;
    }
    // Fire the show side effects exactly once per notification.
    if (shownRef.current !== current.id) {
      shownRef.current = current.id;
      sounds.notify();
      bus.emit({
        type: 'notification:show',
        id: current.id,
        title: current.title,
        body: current.body,
      });
    }
    const timeout = current.timeout ?? DEFAULT_TIMEOUT;
    if (timeout <= 0) return undefined;
    const timer = setTimeout(() => onDismiss(current.id), timeout);
    return () => clearTimeout(timer);
  }, [current, bus, onDismiss]);

  if (!current) return null;

  return (
    <NotificationLayer data-testid="notification-layer">
      <BalloonTip
        icon={current.icon}
        title={current.title}
        body={current.body}
        onClose={() => onDismiss(current.id)}
        onClick={
          current.onClick
            ? () => {
                bus.emit({ type: 'notification:click', id: current.id });
                current.onClick?.();
                onDismiss(current.id);
              }
            : undefined
        }
      />
    </NotificationLayer>
  );
};

/**
 * TrayProvider — System tray icon registry + notification balloons (#118).
 *
 * Tray icons: any component calls useTray() to register icons:
 *   const { register, unregister, update } = useTray();
 *   useEffect(() => {
 *     register('my-app', { icon: 'folder', tooltip: 'My App', order: 30 });
 *     return () => unregister('my-app');
 *   }, [register, unregister]);
 *
 * Notifications: `notify({ icon, title, body, timeout, onClick })` pops an XP
 * balloon above the taskbar (one at a time, queued).
 */
export const TrayProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<TrayItem[]>([]);
  const [queue, setQueue] = useState<ActiveNotification[]>([]);
  const idCounter = useRef(0);

  // Register new icon, update if id exists
  const register = useCallback((id: string, config: Omit<TrayItem, 'id'>) => {
    setItems(prev => {
      const exists = prev.some(i => i.id === id);
      if (exists) return prev.map(i => (i.id === id ? { ...i, ...config, id } : i));
      return [...prev, { id, ...config, order: config.order ?? 50 }];
    });
  }, []);

  // Unregister icon
  const unregister = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  // Update icon fields (e.g. tooltip, icon)
  const update = useCallback((id: string, updates: Partial<Omit<TrayItem, 'id'>>) => {
    setItems(prev => prev.map(i => (i.id === id ? { ...i, ...updates } : i)));
  }, []);

  const notify = useCallback((options: NotifyOptions): string => {
    idCounter.current += 1;
    const id = `notify-${idCounter.current}`;
    setQueue(prev => [...prev, { ...options, id }]);
    return id;
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setQueue(prev => prev.filter(n => n.id !== id));
  }, []);

  const sortedItems = [...items].sort((a, b) => (a.order ?? 50) - (b.order ?? 50));

  const contextValue: TrayContextType = {
    items: sortedItems,
    register,
    unregister,
    update,
    notify,
    dismissNotification,
  };

  return (
    <TrayContext.Provider value={contextValue}>
      {children}
      <NotificationHost queue={queue} onDismiss={dismissNotification} />
    </TrayContext.Provider>
  );
};
