import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { useXPEventBus } from './EventBusContext';
import { useStorage } from './StorageContext';
import { canUseDOM } from '../utils/storage';
import { sounds } from '../utils/soundManager';
import type { XPEvent } from '../events';

/**
 * Timer / scheduler subsystem (#130).
 *
 * Three time-based signal sources, all emitting on the same event bus so
 * `onEvent` consumers and scenario (#84) triggers see them uniformly:
 *
 *  1. **Persisted scheduler** — `schedule({ delayMs | at })` registers a task
 *     that fires a `time:fire` (or a caller-supplied event) after the delay.
 *     Pending tasks are stored per `storagePrefix` and reconciled on mount:
 *     anything whose deadline passed *while the page was closed* fires on load
 *     ("compute elapsed effects at launch" — honest about no background exec).
 *  2. **`time:hour`** — wall-clock, fires on the top of each hour. Derived from
 *     the clock (not persisted); the 整点报时 chime is an opt-in consumer.
 *  3. **`user:idle` / `user:active`** — inactivity detection at a configurable
 *     threshold, for scenario hint escalation and screensaver logic.
 */

interface ScheduledTask {
  id: string;
  /** Epoch ms at which the task should fire. */
  fireAt: number;
  /** Event to emit when it fires; defaults to `{ type: 'time:fire', id }`. */
  event?: XPEvent;
}

export interface ScheduleOptions {
  /** Stable id — reusing one replaces the existing schedule. Auto-generated if omitted. */
  id?: string;
  /** Fire this many ms from now. */
  delayMs?: number;
  /** Fire at this epoch-ms deadline (takes precedence over delayMs). */
  at?: number;
  /** Event to emit on fire; defaults to `{ type: 'time:fire', id }`. */
  event?: XPEvent;
}

export interface SchedulerApi {
  /** Register (or replace) a schedule; returns its id. */
  schedule: (options: ScheduleOptions) => string;
  /** Cancel a pending schedule by id. */
  cancelSchedule: (id: string) => void;
  /** Ids of all pending schedules. */
  listSchedules: () => string[];
}

const SchedulerContext = createContext<SchedulerApi | undefined>(undefined);

/** Imperative access to the timer subsystem. Falls back to a no-op outside a provider. */
export const useScheduler = (): SchedulerApi => {
  const ctx = useContext(SchedulerContext);
  return (
    ctx ?? {
      schedule: () => '',
      cancelSchedule: () => {
        /* no-op outside provider */
      },
      listSchedules: () => [],
    }
  );
};

export interface SchedulerProviderProps {
  children: React.ReactNode;
  /** Inactivity threshold (ms) before `user:idle` fires. Default 60000. */
  idleThresholdMs?: number;
  /** Play the classic hourly chime on `time:hour`. Off by default (culture/host opt-in). */
  hourlyChime?: boolean;
}

let autoScheduleSeq = 0;

export const SchedulerProvider: React.FC<SchedulerProviderProps> = ({
  children,
  idleThresholdMs = 60000,
  hourlyChime = false,
}) => {
  const bus = useXPEventBus();
  const storage = useStorage();
  const storeKey = storage.key('schedules');

  // Live timers keyed by schedule id; never persisted.
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const readTasks = useCallback((): ScheduledTask[] => {
    try {
      const raw = storage.local.getItem(storeKey);
      const parsed = raw ? (JSON.parse(raw) as unknown) : [];
      return Array.isArray(parsed) ? (parsed as ScheduledTask[]) : [];
    } catch {
      return [];
    }
  }, [storage, storeKey]);

  const writeTasks = useCallback(
    (tasks: ScheduledTask[]) => {
      storage.local.setItem(storeKey, JSON.stringify(tasks));
    },
    [storage, storeKey]
  );

  const removeTask = useCallback(
    (id: string) => {
      writeTasks(readTasks().filter(t => t.id !== id));
    },
    [readTasks, writeTasks]
  );

  const fire = useCallback(
    (task: ScheduledTask) => {
      const timer = timersRef.current.get(task.id);
      if (timer) {
        clearTimeout(timer);
        timersRef.current.delete(task.id);
      }
      removeTask(task.id);
      bus.emit(task.event ?? { type: 'time:fire', id: task.id });
    },
    [bus, removeTask]
  );

  const arm = useCallback(
    (task: ScheduledTask, now: number) => {
      const existing = timersRef.current.get(task.id);
      if (existing) clearTimeout(existing);
      const delay = Math.max(0, task.fireAt - now);
      // Guard against delays past setTimeout's 32-bit ceiling (~24.8 days):
      // clamp and let the reconcile-on-next-mount pick it up if still pending.
      const clamped = Math.min(delay, 2_147_483_647);
      const timer = setTimeout(() => fire(task), clamped);
      timersRef.current.set(task.id, timer);
    },
    [fire]
  );

  const schedule = useCallback(
    (options: ScheduleOptions): string => {
      const id = options.id ?? `sched-${Date.now()}-${autoScheduleSeq++}`;
      const now = Date.now();
      const fireAt = options.at ?? now + (options.delayMs ?? 0);
      const task: ScheduledTask = {
        id,
        fireAt,
        ...(options.event ? { event: options.event } : {}),
      };

      // Replace any existing task with this id.
      writeTasks([...readTasks().filter(t => t.id !== id), task]);

      if (fireAt <= now) {
        fire(task);
      } else {
        arm(task, now);
      }
      return id;
    },
    [readTasks, writeTasks, fire, arm]
  );

  const cancelSchedule = useCallback(
    (id: string) => {
      const timer = timersRef.current.get(id);
      if (timer) {
        clearTimeout(timer);
        timersRef.current.delete(id);
      }
      removeTask(id);
    },
    [removeTask]
  );

  const listSchedules = useCallback(() => readTasks().map(t => t.id), [readTasks]);

  // Reconcile persisted schedules on mount: fire everything whose deadline has
  // already passed (elapsed while closed), arm timers for the rest.
  useEffect(() => {
    const timers = timersRef.current;
    const now = Date.now();
    const tasks = readTasks();
    tasks.forEach(task => {
      if (task.fireAt <= now) fire(task);
      else arm(task, now);
    });
    return () => {
      timers.forEach(t => clearTimeout(t));
      timers.clear();
    };
    // Mount-only reconcile; schedule/cancel manage timers thereafter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // time:hour — align to the next top of the hour, then re-arm each hour.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const armNextHour = () => {
      const now = new Date();
      const msToNextHour =
        (60 - now.getMinutes()) * 60_000 - now.getSeconds() * 1000 - now.getMilliseconds();
      timer = setTimeout(() => {
        bus.emit({ type: 'time:hour', hour: new Date().getHours() });
        armNextHour();
      }, msToNextHour);
    };
    armNextHour();
    return () => clearTimeout(timer);
  }, [bus]);

  // Hourly chime consumer — opt-in (off by default, host/culture driven).
  useEffect(() => {
    if (!hourlyChime) return undefined;
    return bus.subscribe(e => {
      if (e.type === 'time:hour') sounds.ding();
    });
  }, [bus, hourlyChime]);

  // user:idle / user:active — reset a timer on any activity; emit idle at the
  // threshold and active on the first activity after going idle.
  useEffect(() => {
    if (!canUseDOM) return undefined;
    let idle = false;
    let timer: ReturnType<typeof setTimeout>;
    const goIdle = () => {
      idle = true;
      bus.emit({ type: 'user:idle', idleMs: idleThresholdMs });
    };
    const onActivity = () => {
      if (idle) {
        idle = false;
        bus.emit({ type: 'user:active' });
      }
      clearTimeout(timer);
      timer = setTimeout(goIdle, idleThresholdMs);
    };
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'wheel'];
    events.forEach(ev => window.addEventListener(ev, onActivity, { passive: true }));
    timer = setTimeout(goIdle, idleThresholdMs);
    return () => {
      clearTimeout(timer);
      events.forEach(ev => window.removeEventListener(ev, onActivity));
    };
  }, [bus, idleThresholdMs]);

  const api = useMemo<SchedulerApi>(
    () => ({ schedule, cancelSchedule, listSchedules }),
    [schedule, cancelSchedule, listSchedules]
  );

  return <SchedulerContext.Provider value={api}>{children}</SchedulerContext.Provider>;
};
