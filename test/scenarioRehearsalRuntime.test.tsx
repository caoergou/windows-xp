/**
 * Rehearsal / deterministic seek (#207) — runtime integration. Mounts
 * <WindowsXP scenario=…/> and drives the imperative `scenario.*` handle:
 *   • `seekTo('finale')` lands on the finale state (flags + planted files) that
 *     a full playthrough reaches — the acceptance criterion;
 *   • stepping back re-solves the shorter prefix (time travel);
 *   • exiting restores the pre-rehearsal save;
 *   • rehearsal-tagged events never reach the host `onEvent` (observer-effect
 *     guard).
 */
import React from 'react';
import { render, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prologueGraphScenario } from '../src/data/scenarios/prologueGraph';
import { solveScenario } from '../src/scenario/solver';
import { buildTape, beatIndex } from '../src/scenario/rehearsal';
import { solvedFlag } from '../src/scenario/puzzleGraph';
import type { XPHandle } from '../src/components/XPBridge';
import type { XPEventListener } from '../src/events';

const mount = async (onEvent?: XPEventListener) => {
  const { WindowsXP } = await import('../src/lib');
  const ref = React.createRef<XPHandle>();
  render(
    <WindowsXP ref={ref} autoLogin skipBoot scenario={prologueGraphScenario} onEvent={onEvent} />
  );
  await act(async () => {
    await Promise.resolve();
  });
  expect(ref.current).not.toBeNull();
  return ref;
};

const solvedIds = ['intro', 'read-letter', 'read-chat', 'unlock-windows'];

describe('rehearsal seek — runtime (#207)', () => {
  beforeEach(() => localStorage.clear());

  it("seekTo('finale') lands on the finale state a full playthrough reaches", async () => {
    const ref = await mount();

    await act(async () => {
      expect(ref.current!.scenario.seekTo('finale')).toBe(true);
    });

    const flags = ref.current!.getSnapshot().flags;
    for (const id of solvedIds) expect(flags[solvedFlag(id)]).toBe(true);

    // Parity: same flags as solving the raw walkthrough headlessly.
    const tape = buildTape(prologueGraphScenario.rehearsal);
    const normal = solveScenario(prologueGraphScenario, tape.events);
    expect(flags).toMatchObject(normal.flags as Record<string, unknown>);

    // The grants' planted files landed on the live desktop.
    expect(ref.current!.fs.exists(['密码便签.txt'])).toBe(true);
    expect(ref.current!.fs.exists(['尾声.txt'])).toBe(true);

    // The cursor reports the finale beat.
    const state = ref.current!.scenario.getState();
    expect(state.active).toBe(true);
    expect(state.index).toBe(beatIndex(tape, 'finale'));
  });

  it('stepBack re-solves the shorter prefix (time travel)', async () => {
    const ref = await mount();
    await act(async () => {
      ref.current!.scenario.seekTo('finale');
    });
    await act(async () => {
      ref.current!.scenario.stepBack();
    });
    const flags = ref.current!.getSnapshot().flags;
    // Back at the chat beat: read-chat solved, the finale is not.
    expect(flags[solvedFlag('read-chat')]).toBe(true);
    expect(flags[solvedFlag('unlock-windows')]).toBeUndefined();
    expect(ref.current!.fs.exists(['尾声.txt'])).toBe(false);
  });

  it('exitRehearsal restores the pre-rehearsal save', async () => {
    const ref = await mount();
    // Before rehearsing, the story has not progressed to the finale (boot may
    // have auto-solved `intro`, but nothing downstream).
    expect(ref.current!.getSnapshot().flags[solvedFlag('unlock-windows')]).toBeUndefined();
    await act(async () => {
      ref.current!.scenario.seekTo('finale');
    });
    await act(async () => {
      ref.current!.scenario.exitRehearsal();
    });
    const flags = ref.current!.getSnapshot().flags;
    expect(flags[solvedFlag('unlock-windows')]).toBeUndefined();
    expect(ref.current!.fs.exists(['尾声.txt'])).toBe(false);
    expect(ref.current!.scenario.getState().active).toBe(false);
  });

  it('rehearsal-tagged events never reach the host onEvent (observer effect)', async () => {
    const onEvent = vi.fn();
    const ref = await mount(onEvent);
    onEvent.mockClear();

    // A normal event reaches the host…
    act(() => ref.current!.emit({ type: 'cmd:exec', command: 'plain' }));
    expect(onEvent).toHaveBeenCalledWith(expect.objectContaining({ type: 'cmd:exec' }));

    // …a rehearsal-tagged event is filtered at the bridge.
    onEvent.mockClear();
    act(() => ref.current!.emit({ type: 'cmd:exec', command: 'silent', rehearsal: true }));
    expect(onEvent).not.toHaveBeenCalled();
  });

  it('exposes flag control and structured trigger status for authoring bridges', async () => {
    const ref = await mount();
    await act(async () => {
      expect(ref.current!.scenario.setFlag('authoring_ready', true)).toBe(true);
    });

    const debug = ref.current!.scenario.getDebugState();
    expect(debug.scenarioId).toBe(prologueGraphScenario.id);
    expect(debug.flags.authoring_ready).toBe(true);
    expect(debug.triggers).toHaveLength(prologueGraphScenario.triggers.length);
    expect(debug.triggers[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        fireCount: expect.any(Number),
        budgetAvailable: expect.any(Boolean),
        when: expect.objectContaining({ held: expect.any(Boolean) }),
      })
    );
  });
});
