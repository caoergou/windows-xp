/**
 * Timer / scheduler subsystem (#130).
 *
 * Covers the persisted scheduler (delay, at, cancel, and the flagship
 * fire-on-load-if-elapsed reload semantics), the hourly-chime consumer, and
 * user idle/active detection. Uses the low-level EventBusProvider with an
 * explicit bus so assertions stay deterministic.
 */
import React from 'react';
import { render, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { XPEventBus, type XPEvent } from '../src/events';
import { EventBusProvider } from '../src/context/EventBusContext';
import { SchedulerProvider, useScheduler, type SchedulerApi } from '../src/context/SchedulerContext';
import { sounds } from '../src/utils/soundManager';

let bus: XPEventBus;
let events: XPEvent[];

const mount = (props: React.ComponentProps<typeof SchedulerProvider> = { children: null }) => {
  let api: SchedulerApi | null = null;
  const Probe: React.FC = () => {
    api = useScheduler();
    return null;
  };
  render(
    <EventBusProvider bus={bus}>
      <SchedulerProvider {...props}>
        <Probe />
      </SchedulerProvider>
    </EventBusProvider>
  );
  return () => api!;
};

const byType = (t: string) => events.filter(e => e.type === t);

describe('scheduler (#130)', () => {
  beforeEach(() => {
    bus = new XPEventBus();
    events = [];
    bus.subscribe(e => events.push(e));
    localStorage.clear();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('fires a persisted schedule on load if its deadline passed while closed (AC2)', () => {
    // Seed a schedule whose fireAt is already in the past, as if the page had
    // been closed past the +90s deadline.
    localStorage.setItem(
      'xp_schedules',
      JSON.stringify([{ id: 'passphrase-reminder', fireAt: Date.now() - 90_000 }])
    );
    act(() => {
      mount();
    });
    expect(byType('time:fire')).toHaveLength(1);
    expect(byType('time:fire')[0]).toMatchObject({ id: 'passphrase-reminder' });
    // And it is consumed, not left to fire again.
    expect(localStorage.getItem('xp_schedules')).toBe('[]');
  });

  it('fires a delayMs schedule after the delay, and persists until it fires', () => {
    const getApi = mount();
    act(() => {
      getApi().schedule({ id: 'later', delayMs: 90_000 });
    });
    expect(byType('time:fire')).toHaveLength(0);
    expect(getApi().listSchedules()).toEqual(['later']);
    act(() => {
      vi.advanceTimersByTime(90_000);
    });
    expect(byType('time:fire')).toHaveLength(1);
    expect(getApi().listSchedules()).toEqual([]);
  });

  it('emits a caller-supplied event when provided', () => {
    const getApi = mount();
    act(() => {
      getApi().schedule({ id: 'chime', delayMs: 1000, event: { type: 'time:hour', hour: 8 } });
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(byType('time:hour')).toHaveLength(1);
    expect(byType('time:hour')[0]).toMatchObject({ hour: 8 });
  });

  it('cancelSchedule prevents a pending schedule from firing', () => {
    const getApi = mount();
    act(() => {
      getApi().schedule({ id: 'doomed', delayMs: 5000 });
      getApi().cancelSchedule('doomed');
    });
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(byType('time:fire')).toHaveLength(0);
    expect(getApi().listSchedules()).toEqual([]);
  });

  it('plays the hourly chime only when enabled', () => {
    const ding = vi.spyOn(sounds, 'ding').mockImplementation(() => undefined);

    // Disabled (default): no chime.
    mount();
    act(() => {
      bus.emit({ type: 'time:hour', hour: 3 });
    });
    expect(ding).not.toHaveBeenCalled();

    // Enabled: chimes on time:hour.
    mount({ children: null, hourlyChime: true });
    act(() => {
      bus.emit({ type: 'time:hour', hour: 4 });
    });
    expect(ding).toHaveBeenCalledTimes(1);
    ding.mockRestore();
  });

  it('emits user:idle at the threshold and user:active on the next activity', () => {
    mount({ children: null, idleThresholdMs: 1000 });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(byType('user:idle')).toHaveLength(1);
    expect(byType('user:idle')[0]).toMatchObject({ idleMs: 1000 });

    act(() => {
      window.dispatchEvent(new Event('mousemove'));
    });
    expect(byType('user:active')).toHaveLength(1);
  });
});
