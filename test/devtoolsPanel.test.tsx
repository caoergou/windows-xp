/**
 * Scenario DevTools panel (#209): the Triggers tab surfaces the miss reason and
 * the false `when` predicate; Flags shows values + attribution.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import DevToolsPanel from '../src/devtools/DevToolsPanel';
import { StorageProvider } from '../src/context/StorageContext';
import type { XPEvent } from '../src/events';
import { publishTrace, type EvalReport } from '../src/devtools/traceChannel';
import {
  registerRehearsalController,
  publishRehearsalState,
  type RehearsalController,
  type RehearsalState,
} from '../src/devtools/rehearsalChannel';

const PREFIX = 'dt_';

const report = (over: Partial<EvalReport> = {}): EvalReport => ({
  seq: 1,
  event: { type: 'cmd:exec', command: 'check' } as XPEvent,
  triggers: [],
  flags: {},
  changes: [],
  ...over,
});

const mount = () =>
  render(
    <StorageProvider prefix={PREFIX}>
      <DevToolsPanel />
    </StorageProvider>
  );

beforeEach(() => localStorage.clear());

describe('DevToolsPanel', () => {
  it('shows why a matched trigger did not fire (when: false + the false leaf)', async () => {
    mount();
    publishTrace(
      PREFIX,
      report({
        triggers: [
          {
            id: 'open-door',
            index: 0,
            on: 'cmd:exec',
            matchedOn: true,
            fired: false,
            skip: 'when',
            fireCount: 0,
            when: {
              label: 'AND (2)',
              held: false,
              children: [
                { label: 'flag have_key (true) is truthy', held: true },
                { label: 'flag door_open (undefined) is truthy', held: false },
              ],
            },
          },
        ],
      })
    );

    fireEvent.click(screen.getByTestId('devtools-tab-triggers'));
    await waitFor(() => expect(screen.getByTestId('devtools-trigger')).toBeInTheDocument());
    expect(screen.getByText(/when: false/)).toBeInTheDocument();
    // The specific false predicate is rendered so the author can see which one.
    expect(screen.getByText(/door_open \(undefined\)/)).toBeInTheDocument();
  });

  it('lists flags with their value and the trigger that changed them', async () => {
    mount();
    publishTrace(
      PREFIX,
      report({
        flags: { connected: true },
        changes: [{ flag: 'connected', value: true, by: 'link-clue' }],
      })
    );

    fireEvent.click(screen.getByTestId('devtools-tab-flags'));
    await waitFor(() => expect(screen.getByTestId('devtools-flag')).toBeInTheDocument());
    expect(screen.getByText('connected')).toBeInTheDocument();
    expect(screen.getByText(/link-clue/)).toBeInTheDocument();
  });

  it('renders the rehearsal seek bar and drives the controller (#207)', async () => {
    let state: RehearsalState = {
      active: false,
      index: -1,
      length: 2,
      beats: [
        { beat: 'intro', index: 0 },
        { beat: 'finale', index: 1 },
      ],
    };
    const controller: RehearsalController = {
      seekTo: vi.fn(() => true),
      seekToIndex: vi.fn(),
      stepBack: vi.fn(),
      stepForward: vi.fn(),
      exitRehearsal: vi.fn(),
      getState: () => state,
    };
    const unregister = registerRehearsalController(PREFIX, controller);
    try {
      mount();
      fireEvent.click(screen.getByTestId('devtools-tab-rehearsal'));
      await waitFor(() => expect(screen.getByTestId('devtools-rehearsal')).toBeInTheDocument());

      // A button per named beat; clicking one seeks to it.
      expect(screen.getByTestId('devtools-seek-finale')).toBeInTheDocument();
      fireEvent.click(screen.getByTestId('devtools-seek-finale'));
      expect(controller.seekTo).toHaveBeenCalledWith('finale');

      // A published active state flips the panel into "Rehearsing".
      state = { ...state, active: true, index: 1 };
      publishRehearsalState(PREFIX, state);
      await waitFor(() => expect(screen.getByText(/Rehearsing/)).toBeInTheDocument());
    } finally {
      unregister();
    }
  });
});
