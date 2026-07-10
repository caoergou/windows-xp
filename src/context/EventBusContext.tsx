import React, { createContext, useContext, useEffect } from 'react';
import { XPEventBus, XPEventListener } from '../events';

// Standalone providers (e.g. a bare WindowManagerProvider in tests) fall back
// to a shared module-level bus, so emitting never needs a null check.
const fallbackBus = new XPEventBus();

const EventBusContext = createContext<XPEventBus>(fallbackBus);

export const EventBusProvider: React.FC<{ bus: XPEventBus; children: React.ReactNode }> = ({
  bus,
  children,
}) => <EventBusContext.Provider value={bus}>{children}</EventBusContext.Provider>;

/** The desktop's event bus. Stable for the provider's lifetime. */
export const useXPEventBus = (): XPEventBus => useContext(EventBusContext);

/** Subscribe to desktop events for the lifetime of the component. */
export const useXPEvents = (listener: XPEventListener): void => {
  const bus = useXPEventBus();
  const listenerRef = React.useRef(listener);
  listenerRef.current = listener;
  useEffect(() => bus.subscribe(event => listenerRef.current(event)), [bus]);
};
