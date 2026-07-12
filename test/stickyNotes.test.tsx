/**
 * Dynamic sticky notes (#207): a scenario's `note` action pins a desktop note;
 * `removeNote` clears it; the player can dismiss one with its ×.
 */
import React from 'react';
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import type { Scenario } from '../src/scenario/types';
import type { XPHandle } from '../src/components/XPBridge';

const mount = async (scenario: Scenario) => {
  const { WindowsXP } = await import('../src/lib');
  const ref = React.createRef<XPHandle>();
  render(<WindowsXP ref={ref} autoLogin skipBoot scenario={scenario} />);
  await act(async () => {
    await Promise.resolve();
  });
  return ref;
};

describe('scenario sticky notes', () => {
  beforeEach(() => localStorage.clear());

  it('pins a note, updates it by id, then removes it', async () => {
    const scenario: Scenario = {
      id: 'notes-test',
      triggers: [
        { on: 'cmd:exec', when: { event: { command: 'pin' } }, do: [{ note: { id: 'clue', title: 'Clue', content: 'Check the cafe.' } }] },
        { on: 'cmd:exec', when: { event: { command: 'update' } }, do: [{ note: { id: 'clue', content: 'The cafe burned down.' } }] },
        { on: 'cmd:exec', when: { event: { command: 'clear' } }, do: [{ removeNote: 'clue' }] },
      ],
    };
    const ref = await mount(scenario);

    act(() => ref.current!.emit({ type: 'cmd:exec', command: 'pin' }));
    await waitFor(() => expect(screen.getByTestId('note-clue')).toBeInTheDocument());
    expect(screen.getByText('Check the cafe.')).toBeInTheDocument();

    // Upsert by id replaces the content, not adds a second note.
    act(() => ref.current!.emit({ type: 'cmd:exec', command: 'update' }));
    await waitFor(() => expect(screen.getByText('The cafe burned down.')).toBeInTheDocument());
    expect(screen.queryByText('Check the cafe.')).not.toBeInTheDocument();
    expect(screen.getAllByTestId('note-clue')).toHaveLength(1);

    // removeNote clears it.
    act(() => ref.current!.emit({ type: 'cmd:exec', command: 'clear' }));
    await waitFor(() => expect(screen.queryByTestId('note-clue')).not.toBeInTheDocument());
  });

  it('lets the player dismiss a note with its ×', async () => {
    const scenario: Scenario = {
      id: 'notes-dismiss',
      triggers: [{ on: 'session:boot-complete', do: [{ note: { id: 'hi', content: 'Welcome.' } }] }],
    };
    const ref = await mount(scenario);
    act(() => ref.current!.emit({ type: 'session:boot-complete' }));
    await waitFor(() => expect(screen.getByTestId('note-hi')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('note-close-hi'));
    await waitFor(() => expect(screen.queryByTestId('note-hi')).not.toBeInTheDocument());
  });
});
