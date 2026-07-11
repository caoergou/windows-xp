/**
 * Tray notification API (#118).
 *
 * Covers TrayProvider.notify(): balloon rendering, queueing (one at a time),
 * the notify sound + notification:show/click events, auto-dismiss, and the
 * notify method exposed on the imperative XPHandle.
 */
import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { XPEventBus, type XPEvent } from '../src/events';
import { EventBusProvider } from '../src/context/EventBusContext';
import { TrayProvider, useTray, type NotifyOptions } from '../src/context/TrayContext';
import { sounds } from '../src/utils/soundManager';

let bus: XPEventBus;
let events: XPEvent[];

const Probe: React.FC<{ onReady: (notify: (o: NotifyOptions) => string) => void }> = ({
  onReady,
}) => {
  const { notify } = useTray();
  React.useEffect(() => onReady(notify), [notify, onReady]);
  return null;
};

const mount = (onReady: (notify: (o: NotifyOptions) => string) => void) =>
  render(
    <EventBusProvider bus={bus}>
      <TrayProvider>
        <Probe onReady={onReady} />
      </TrayProvider>
    </EventBusProvider>
  );

describe('Tray notifications (#118)', () => {
  beforeEach(() => {
    bus = new XPEventBus();
    events = [];
    bus.subscribe(e => events.push(e));
    vi.spyOn(sounds, 'notify').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('renders a balloon, plays the notify sound and emits notification:show', () => {
    let notify!: (o: NotifyOptions) => string;
    mount(n => {
      notify = n;
    });

    act(() => {
      notify({ icon: '360safe', title: 'Alert', body: 'Protected' });
    });

    expect(screen.getByText('Alert')).toBeInTheDocument();
    expect(screen.getByText('Protected')).toBeInTheDocument();
    expect(sounds.notify).toHaveBeenCalledTimes(1);
    const show = events.find(e => e.type === 'notification:show');
    expect(show).toMatchObject({ type: 'notification:show', title: 'Alert', body: 'Protected' });
  });

  it('shows one balloon at a time and advances the queue on dismiss', () => {
    let notify!: (o: NotifyOptions) => string;
    mount(n => {
      notify = n;
    });

    act(() => {
      notify({ title: 'First' });
      notify({ title: 'Second' });
    });

    // Only the head is visible.
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.queryByText('Second')).not.toBeInTheDocument();

    // Close the first → the second takes its place.
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByText('First')).not.toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
    expect(sounds.notify).toHaveBeenCalledTimes(2);
  });

  it('auto-dismisses after the timeout', () => {
    vi.useFakeTimers();
    let notify!: (o: NotifyOptions) => string;
    mount(n => {
      notify = n;
    });

    act(() => {
      notify({ title: 'Temporary', timeout: 1000 });
    });
    expect(screen.getByText('Temporary')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1001);
    });
    expect(screen.queryByText('Temporary')).not.toBeInTheDocument();
  });

  it('emits notification:click and runs onClick when the balloon is clicked', () => {
    let notify!: (o: NotifyOptions) => string;
    mount(n => {
      notify = n;
    });

    const onClick = vi.fn();
    act(() => {
      notify({ title: 'Clickable', onClick });
    });

    fireEvent.click(screen.getByText('Clickable'));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(events.some(e => e.type === 'notification:click')).toBe(true);
    // Clicking dismisses it.
    expect(screen.queryByText('Clickable')).not.toBeInTheDocument();
  });

  it('exposes notify on the imperative XPHandle and onEvent observes it', async () => {
    vi.spyOn(sounds, 'notify').mockImplementation(() => undefined);
    localStorage.clear();
    const { WindowsXP } = await import('../src/lib');
    const seen: XPEvent[] = [];
    const ref = React.createRef<import('../src/components/XPBridge').XPHandle>();
    render(<WindowsXP ref={ref} autoLogin skipBoot onEvent={e => seen.push(e)} />);
    await act(async () => {
      await Promise.resolve();
    });
    expect(ref.current).not.toBeNull();

    act(() => {
      ref.current!.notify({ title: 'From host', body: 'hi' });
    });
    expect(seen.some(e => e.type === 'notification:show')).toBe(true);
  });
});
