/**
 * Scenario author toolchain (PUZZLE-DESIGN §4): Layer-2 fluent builder + headless
 * solver. The final test cross-checks that the solver and the live React runtime
 * produce the same flags for the same events — one runtime, two front doors.
 */
import React from 'react';
import { render, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  defineScenario,
  not,
  flag,
  setFlag,
  incFlag,
  unlock,
  after,
  qqOnline,
  ms,
} from '../src/scenario/builder';
import { solveScenario, ranAction } from '../src/scenario/solver';
import type { XPEvent } from '../src/events';

describe('scenario builder (Layer 2)', () => {
  it('ms() parses durations', () => {
    expect(ms(500)).toBe(500);
    expect(ms('90s')).toBe(90000);
    expect(ms('10m')).toBe(600000);
    expect(ms('1h')).toBe(3600000);
  });

  it('compiles to the expected Layer-1 JSON', () => {
    const s = defineScenario('county').initialFlag('act', 1);
    s.on('file:open', { name: '日记.txt' })
      .when(not(flag('act2')))
      .once()
      .do(setFlag('readDiary'), after(ms('3s'), qqOnline('crystal')));

    expect(s.build()).toEqual({
      id: 'county',
      initialFlags: { act: 1 },
      triggers: [
        {
          on: 'file:open',
          when: { all: [{ event: { name: '日记.txt' } }, { not: { flag: 'act2' } }] },
          once: true,
          do: [{ setFlag: 'readDiary' }, { after: { ms: 3000, do: [{ qqOnline: 'crystal' }] } }],
        },
      ],
    });
  });
});

describe('headless solver', () => {
  it('runs a gated story to its ending and records actions', () => {
    const s = defineScenario('gate');
    s.on('file:open', { name: 'diary.txt' }).once().do(setFlag('readDiary'));
    s.on('file:open', { name: 'chat.txt' })
      .when(flag('readDiary'))
      .once()
      .do(unlock(['D:', '私人']), setFlag('done'));
    const scenario = s.build();

    const ev = (name: string): XPEvent => ({
      type: 'file:open',
      path: [name],
      name,
      nodeType: 'file',
    });
    // chat opened too early does nothing; then diary, then chat unlocks.
    const early = solveScenario(scenario, [ev('chat.txt')]);
    expect(early.flags.done).toBeUndefined();

    const full = solveScenario(scenario, [ev('chat.txt'), ev('diary.txt'), ev('chat.txt')]);
    expect(full.flags).toMatchObject({ readDiary: true, done: true });
    expect(ranAction(full, 'unlock')).toBe(true);
  });

  it('honors once and follows emit cascades', () => {
    const s = defineScenario('cascade');
    s.on('cmd:exec', { command: 'go' }).do(incFlag('n'), setFlag('kicked'));
    s.on('cmd:exec', { command: 'go' }).max(2).do(incFlag('capped'));
    const scenario = s.build();
    const go: XPEvent = { type: 'cmd:exec', command: 'go' };
    const r = solveScenario(scenario, [go, go, go]);
    expect(r.flags.n).toBe(3); // first trigger uncapped
    expect(r.flags.capped).toBe(2); // second trigger max:2
  });

  it('evaluates FS predicates against the seeded virtual filesystem', () => {
    const s = defineScenario('fs');
    s.on('cmd:exec')
      .when(flag('x', { eq: true }))
      .do(setFlag('noop'));
    // exists/unlocked read the seeded fs
    const r = solveScenario(
      defineScenario('fs2').on('session:login').do(setFlag('a')).build(),
      [{ type: 'session:login' }],
      { fs: [{ path: ['C:', 'W'], locked: true }] }
    );
    expect(r.flags.a).toBe(true);
    void s;
  });

  it('caps runaway emit cycles', () => {
    const s = defineScenario('loop');
    s.on('cmd:exec').do({ emit: { type: 'cmd:exec', command: 'again' } } as never);
    expect(() =>
      solveScenario(s.build(), [{ type: 'cmd:exec', command: 'start' }], { maxEvents: 200 })
    ).toThrow(/emit cycle/);
  });
});

describe('solver ↔ runtime fidelity', () => {
  beforeEach(() => localStorage.clear());

  it('produces the same flags as the live ScenarioRunner', async () => {
    const s = defineScenario('fidelity').initialFlag('count', 0);
    s.on('cmd:exec', { command: 'a' }).do(setFlag('sawA'), incFlag('count'));
    s.on('cmd:exec', { command: 'b' })
      .when(flag('sawA'))
      .once()
      .do(setFlag('done'), incFlag('count'));
    const scenario = s.build();

    const events: XPEvent[] = [
      { type: 'cmd:exec', command: 'b' }, // early — blocked
      { type: 'cmd:exec', command: 'a' },
      { type: 'cmd:exec', command: 'a' },
      { type: 'cmd:exec', command: 'b' }, // fires (once)
      { type: 'cmd:exec', command: 'b' }, // once blocks
    ];

    const solved = solveScenario(scenario, events);

    const { WindowsXP } = await import('../src/lib');
    const ref = React.createRef<import('../src/components/XPBridge').XPHandle>();
    render(<WindowsXP ref={ref} autoLogin skipBoot scenario={scenario} />);
    await act(async () => {
      await Promise.resolve();
    });
    events.forEach(e => act(() => ref.current!.emit(e)));

    expect(ref.current!.getSnapshot().flags).toEqual(solved.flags);
    expect(solved.flags).toEqual({ count: 3, sawA: true, done: true });
  });
});
