import React from 'react';
import { act, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ClockProvider, useClock, type XPClockApi } from '../src/context/ClockContext';
import { EventBusProvider } from '../src/context/EventBusContext';
import { XPEventBus, type XPEvent } from '../src/events';

describe('virtual clock (#275)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
  });

  it('runs an offset historical clock and emits deterministic changes', () => {
    let api: XPClockApi | undefined;
    const events: XPEvent[] = [];
    const bus = new XPEventBus();
    bus.subscribe(event => events.push(event));
    const Probe = () => {
      api = useClock();
      return null;
    };

    render(
      <EventBusProvider bus={bus}>
        <ClockProvider
          config={{ initialTime: '2016-02-17T13:03:00.000Z', mode: 'offset', editable: true }}
        >
          <Probe />
        </ClockProvider>
      </EventBusProvider>
    );

    expect(api?.now()).toBe('2016-02-17T13:03:00.000Z');
    act(() => vi.advanceTimersByTime(60_000));
    expect(api?.now()).toBe('2016-02-17T13:04:00.000Z');
    act(() => api?.set('2016-02-18T00:00:00.000Z', 'user'));
    expect(events.at(-1)).toMatchObject({
      type: 'time:change',
      from: '2016-02-17T13:04:00.000Z',
      to: '2016-02-18T00:00:00.000Z',
      source: 'user',
    });
  });

  it('freezes and restores a clock snapshot without returning to the host year', () => {
    let api: XPClockApi | undefined;
    const Probe = () => {
      api = useClock();
      return null;
    };
    render(
      <EventBusProvider bus={new XPEventBus()}>
        <ClockProvider config={{ initialTime: '2003-10-25T08:00:00Z', mode: 'frozen' }}>
          <Probe />
        </ClockProvider>
      </EventBusProvider>
    );
    act(() => vi.advanceTimersByTime(86_400_000));
    expect(api?.now()).toBe('2003-10-25T08:00:00.000Z');
    expect(api?.getSnapshot().mode).toBe('frozen');
  });
});
