import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useStorage } from './StorageContext';
import { useXPEventBus } from './EventBusContext';

export type ClockMode = 'realtime' | 'offset' | 'frozen';
export type ClockCatchUp = 'fire-once' | 'skip';

export interface ClockConfig {
  initialTime?: string;
  timezone?: string;
  mode?: ClockMode;
  rate?: number;
  editable?: boolean;
  catchUp?: ClockCatchUp;
}

export interface ClockSnapshot {
  mode: ClockMode;
  timezone?: string;
  rate: number;
  editable: boolean;
  catchUp: ClockCatchUp;
  virtualEpoch: number;
  realEpoch: number;
}

export interface XPClockApi {
  now: () => string;
  nowMs: () => number;
  set: (iso: string, source?: 'user' | 'host' | 'snapshot') => void;
  advance: (ms: number, source?: 'user' | 'host') => void;
  reset: () => void;
  getSnapshot: () => ClockSnapshot;
  loadSnapshot: (snapshot: ClockSnapshot) => void;
  subscribe: (listener: () => void) => () => void;
  mode: ClockMode;
  timezone?: string;
  rate: number;
  editable: boolean;
  catchUp: ClockCatchUp;
}

const ClockContext = createContext<XPClockApi | undefined>(undefined);

const validEpoch = (iso: string | undefined): number | undefined => {
  if (!iso) return undefined;
  const value = Date.parse(iso);
  return Number.isFinite(value) ? value : undefined;
};

const createInitialSnapshot = (config: ClockConfig, realNow = Date.now()): ClockSnapshot => {
  const configured = validEpoch(config.initialTime);
  const mode = config.mode ?? (configured === undefined ? 'realtime' : 'offset');
  return {
    mode,
    ...(config.timezone ? { timezone: config.timezone } : {}),
    rate: config.rate && config.rate > 0 ? config.rate : 1,
    editable: config.editable ?? false,
    catchUp: config.catchUp ?? 'fire-once',
    virtualEpoch: configured ?? realNow,
    realEpoch: realNow,
  };
};

const valueAt = (state: ClockSnapshot, realNow = Date.now()): number => {
  if (state.mode === 'frozen') return state.virtualEpoch;
  if (state.mode === 'realtime') return realNow;
  return state.virtualEpoch + (realNow - state.realEpoch) * state.rate;
};

export interface ClockProviderProps {
  children: React.ReactNode;
  config?: ClockConfig;
}

export const ClockProvider: React.FC<ClockProviderProps> = ({ children, config = {} }) => {
  const storage = useStorage();
  const bus = useXPEventBus();
  const key = storage.key('clock');
  const initialRef = useRef(createInitialSnapshot(config));
  const [state, setState] = useState<ClockSnapshot>(() => {
    try {
      const raw = storage.local.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw) as ClockSnapshot;
        if (Number.isFinite(parsed.virtualEpoch) && Number.isFinite(parsed.realEpoch))
          return parsed;
      }
    } catch {
      // A malformed old value must not stop the desktop from booting.
    }
    return initialRef.current;
  });
  const stateRef = useRef(state);
  const listenersRef = useRef(new Set<() => void>());

  useEffect(() => {
    stateRef.current = state;
    storage.local.setItem(key, JSON.stringify(state));
    listenersRef.current.forEach(listener => listener());
  }, [key, state, storage]);

  const commitEpoch = useCallback(
    (epoch: number, source: 'user' | 'host' | 'snapshot') => {
      if (!Number.isFinite(epoch)) throw new Error('Clock time must be a valid ISO date.');
      const from = new Date(valueAt(stateRef.current)).toISOString();
      const realEpoch = Date.now();
      setState(previous => ({
        ...previous,
        mode: previous.mode === 'realtime' ? 'offset' : previous.mode,
        virtualEpoch: epoch,
        realEpoch,
      }));
      const to = new Date(epoch).toISOString();
      if (source !== 'snapshot') bus.emit({ type: 'time:change', from, to, source });
    },
    [bus]
  );

  const nowMs = useCallback(() => valueAt(stateRef.current), []);
  const now = useCallback(() => new Date(nowMs()).toISOString(), [nowMs]);
  const set = useCallback(
    (iso: string, source: 'user' | 'host' | 'snapshot' = 'host') => {
      const epoch = validEpoch(iso);
      if (epoch === undefined) throw new Error(`Invalid clock ISO time: ${iso}`);
      commitEpoch(epoch, source);
    },
    [commitEpoch]
  );
  const advance = useCallback(
    (ms: number, source: 'user' | 'host' = 'host') => commitEpoch(nowMs() + ms, source),
    [commitEpoch, nowMs]
  );
  const reset = useCallback(() => {
    const next = createInitialSnapshot(config);
    const from = now();
    stateRef.current = next;
    setState(next);
    bus.emit({
      type: 'time:change',
      from,
      to: new Date(valueAt(next)).toISOString(),
      source: 'host',
    });
  }, [bus, config, now]);
  const getSnapshot = useCallback(
    (): ClockSnapshot => ({
      ...stateRef.current,
      virtualEpoch: nowMs(),
      realEpoch: Date.now(),
    }),
    [nowMs]
  );
  const loadSnapshot = useCallback((snapshot: ClockSnapshot) => {
    if (!Number.isFinite(snapshot.virtualEpoch) || !Number.isFinite(snapshot.realEpoch)) {
      throw new Error('Invalid clock snapshot.');
    }
    const next = { ...snapshot, realEpoch: Date.now() };
    stateRef.current = next;
    setState(next);
  }, []);
  const subscribe = useCallback((listener: () => void) => {
    listenersRef.current.add(listener);
    return () => listenersRef.current.delete(listener);
  }, []);

  const api = useMemo<XPClockApi>(
    () => ({
      now,
      nowMs,
      set,
      advance,
      reset,
      getSnapshot,
      loadSnapshot,
      subscribe,
      mode: state.mode,
      timezone: state.timezone,
      rate: state.rate,
      editable: state.editable,
      catchUp: state.catchUp,
    }),
    [advance, getSnapshot, loadSnapshot, now, nowMs, reset, set, state, subscribe]
  );

  return <ClockContext.Provider value={api}>{children}</ClockContext.Provider>;
};

export const useClock = (): XPClockApi => {
  const value = useContext(ClockContext);
  return value ?? realClockFallback;
};

const realClockFallback: XPClockApi = {
  now: () => new Date().toISOString(),
  nowMs: () => Date.now(),
  set: () => undefined,
  advance: () => undefined,
  reset: () => undefined,
  getSnapshot: () => createInitialSnapshot({}),
  loadSnapshot: () => undefined,
  subscribe: () => () => undefined,
  mode: 'realtime',
  rate: 1,
  editable: false,
  catchUp: 'fire-once',
};

export { createInitialSnapshot, valueAt };
