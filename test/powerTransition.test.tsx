import React from 'react';
import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StorageProvider } from '../src/context/StorageContext';
import { EventBusProvider } from '../src/context/EventBusContext';
import { ContentPackProvider } from '../src/context/ContentPackContext';
import {
  PowerTransitionProvider,
  usePowerTransition,
  type PowerTransitionApi,
} from '../src/context/PowerTransitionContext';
import { XPEventBus, type XPEvent } from '../src/events';

describe('power transition lifecycle (#279)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('emits an ordered, manually completed blackout sequence', async () => {
    const bus = new XPEventBus();
    const events: XPEvent[] = [];
    bus.subscribe(event => events.push(event));
    let api: PowerTransitionApi | undefined;
    const Probe = () => {
      api = usePowerTransition();
      return null;
    };
    render(
      <StorageProvider prefix="power_test_" persistence="none">
        <ContentPackProvider>
          <EventBusProvider bus={bus}>
            <PowerTransitionProvider
              sequence={{
                blackoutAfterMs: 10,
                reload: 'manual',
                blackout: [{ kind: 'text', text: 'Goodbye', durationMs: 5 }],
              }}
            >
              <Probe />
            </PowerTransitionProvider>
          </EventBusProvider>
        </ContentPackProvider>
      </StorageProvider>
    );
    act(() => api?.request('shutdown'));
    await act(async () => vi.advanceTimersByTimeAsync(20));
    expect(api?.active).toBe(true);
    expect(events.map(event => event.type)).toEqual([
      'session:shutdown-request',
      'session:shutdown',
      'session:blackout',
    ]);
    act(() => api?.complete());
    expect(events.at(-1)?.type).toBe('session:shutdown-complete');
  });
});
