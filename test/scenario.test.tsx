/**
 * Scenario system (#84).
 *
 * Two layers: exhaustive pure-engine condition tests (no React), and an
 * integration test that mounts <WindowsXP scenario=…/> and drives the real
 * event bus through the imperative handle, asserting gating/pushes/progress and
 * that flags land in the snapshot (#117).
 */
import React from 'react';
import { render, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  evaluateCondition,
  matchOn,
  appendJournal,
  type EvalContext,
} from '../src/scenario/engine';
import type { Scenario } from '../src/scenario/types';
import type { XPEvent } from '../src/events';

const ctx = (over: Partial<EvalContext> = {}): EvalContext => ({
  flags: {},
  journal: [],
  event: undefined,
  fs: { exists: () => false, unlocked: () => false, content: () => null },
  ...over,
});

describe('scenario engine — matchOn', () => {
  it('matches a single type or a list', () => {
    expect(matchOn('file:open', 'file:open')).toBe(true);
    expect(matchOn('file:open', 'file:close')).toBe(false);
    expect(matchOn(['a', 'b'], 'b')).toBe(true);
    expect(matchOn(['a', 'b'], 'c')).toBe(false);
  });
});

describe('scenario engine — appendJournal', () => {
  it('appends newest-last and caps length', () => {
    let j: XPEvent[] = [];
    for (let i = 0; i < 5; i++) j = appendJournal(j, { type: 'cmd:exec', command: String(i) }, 3);
    expect(j).toHaveLength(3);
    expect(j.map(e => (e as { command: string }).command)).toEqual(['2', '3', '4']);
  });
});

describe('scenario engine — evaluateCondition', () => {
  it('absent condition is true', () => {
    expect(evaluateCondition(undefined, ctx())).toBe(true);
  });

  it('flag truthiness / eq / gte / lte', () => {
    const c = ctx({ flags: { done: true, count: 3, name: 'x' } });
    expect(evaluateCondition({ flag: 'done' }, c)).toBe(true);
    expect(evaluateCondition({ flag: 'missing' }, c)).toBe(false);
    expect(evaluateCondition({ flag: 'name', eq: 'x' }, c)).toBe(true);
    expect(evaluateCondition({ flag: 'count', gte: 3 }, c)).toBe(true);
    expect(evaluateCondition({ flag: 'count', gte: 4 }, c)).toBe(false);
    expect(evaluateCondition({ flag: 'count', lte: 3 }, c)).toBe(true);
  });

  it('all / any / not composition', () => {
    const c = ctx({ flags: { a: true, b: false } });
    expect(evaluateCondition({ all: [{ flag: 'a' }, { not: { flag: 'b' } }] }, c)).toBe(true);
    expect(evaluateCondition({ all: [{ flag: 'a' }, { flag: 'b' }] }, c)).toBe(false);
    expect(evaluateCondition({ any: [{ flag: 'b' }, { flag: 'a' }] }, c)).toBe(true);
  });

  it('event payload match (scalars and path arrays)', () => {
    const event: XPEvent = {
      type: 'file:open',
      path: ['D:', 'x.txt'],
      name: 'x.txt',
      nodeType: 'file',
    };
    const c = ctx({ event });
    expect(evaluateCondition({ event: { name: 'x.txt' } }, c)).toBe(true);
    expect(evaluateCondition({ event: { path: ['D:', 'x.txt'] } }, c)).toBe(true);
    expect(evaluateCondition({ event: { path: ['D:', 'y.txt'] } }, c)).toBe(false);
    expect(evaluateCondition({ event: { name: 'other' } }, c)).toBe(false);
  });

  it('happened / count over the journal', () => {
    const journal: XPEvent[] = [
      { type: 'file:open', path: ['a'], name: 'a', nodeType: 'file' },
      { type: 'file:open', path: ['b'], name: 'b', nodeType: 'file' },
      { type: 'cmd:exec', command: 'dir' },
    ];
    const c = ctx({ journal });
    expect(evaluateCondition({ happened: { type: 'cmd:exec' } }, c)).toBe(true);
    expect(
      evaluateCondition({ happened: { type: 'cmd:exec', match: { command: 'dir' } } }, c)
    ).toBe(true);
    expect(evaluateCondition({ happened: { type: 'session:login' } }, c)).toBe(false);
    expect(evaluateCondition({ count: { type: 'file:open' }, gte: 2 }, c)).toBe(true);
    expect(evaluateCondition({ count: { type: 'file:open' }, eq: 2 }, c)).toBe(true);
    expect(evaluateCondition({ count: { type: 'file:open' }, gte: 3 }, c)).toBe(false);
  });

  it('fs predicates: exists / unlocked / contentContains', () => {
    const c = ctx({
      fs: {
        exists: p => p[0] === 'here',
        unlocked: p => p[0] === 'open',
        content: p => (p[0] === 'note' ? 'the password is 0318' : null),
      },
    });
    expect(evaluateCondition({ exists: ['here'] }, c)).toBe(true);
    expect(evaluateCondition({ exists: ['nope'] }, c)).toBe(false);
    expect(evaluateCondition({ unlocked: ['open'] }, c)).toBe(true);
    expect(evaluateCondition({ contentContains: { path: ['note'], contains: '0318' } }, c)).toBe(
      true
    );
    expect(evaluateCondition({ contentContains: { path: ['note'], contains: 'zzz' } }, c)).toBe(
      false
    );
  });
});

describe('scenario runtime — <WindowsXP scenario/>', () => {
  beforeEach(() => localStorage.clear());

  const mount = async (scenario: Scenario) => {
    const { WindowsXP } = await import('../src/lib');
    const ref = React.createRef<import('../src/components/XPBridge').XPHandle>();
    render(<WindowsXP ref={ref} autoLogin skipBoot scenario={scenario} />);
    await act(async () => {
      await Promise.resolve();
    });
    expect(ref.current).not.toBeNull();
    return ref;
  };

  it('gates a locked node on a matching event and records a flag', async () => {
    const scenario: Scenario = {
      id: 'test-gate',
      triggers: [
        {
          on: 'cmd:exec',
          when: { event: { command: 'sesame' } },
          do: [{ unlock: ['vault'] }, { setFlag: 'opened' }],
        },
      ],
    };
    const ref = await mount(scenario);

    act(() => {
      ref.current!.fs.createFile(['vault'], { type: 'folder', locked: true, password: 'x' });
    });
    expect(ref.current!.fs.getNode(['vault'])?.locked).toBe(true);

    // A non-matching command does nothing.
    act(() => ref.current!.emit({ type: 'cmd:exec', command: 'nope' }));
    expect(ref.current!.fs.getNode(['vault'])?.locked).toBe(true);

    // The matching command unlocks and sets the flag.
    act(() => ref.current!.emit({ type: 'cmd:exec', command: 'sesame' }));
    expect(ref.current!.fs.getNode(['vault'])?.locked).toBe(false);
    expect(ref.current!.getSnapshot().flags).toMatchObject({ opened: true });
  });

  it('honors once/max and seeds initialFlags', async () => {
    const scenario: Scenario = {
      id: 'test-counts',
      initialFlags: { visits: 0 },
      triggers: [
        { id: 'boot', on: 'session:boot-complete', once: true, do: [{ setFlag: 'booted' }] },
        { id: 'count', on: 'app:launch', max: 2, do: [{ incFlag: 'visits' }] },
      ],
    };
    const ref = await mount(scenario);

    // Seeded flag is snapshot-visible before any action.
    expect(ref.current!.getSnapshot().flags).toMatchObject({ visits: 0 });

    act(() => ref.current!.emit({ type: 'session:boot-complete' }));
    act(() => ref.current!.emit({ type: 'session:boot-complete' }));
    expect(ref.current!.getSnapshot().flags).toMatchObject({ booted: true });

    for (let i = 0; i < 5; i++) {
      act(() =>
        ref.current!.emit({ type: 'app:launch', appId: 'X', windowId: `w${i}`, title: 'X' })
      );
    }
    // max: 2 caps the counter at 2.
    expect(ref.current!.getSnapshot().flags).toMatchObject({ visits: 2 });
  });

  it('reacts to event history with happened() and pushes a new file', async () => {
    const scenario: Scenario = {
      id: 'test-history',
      triggers: [
        {
          on: 'file:open',
          when: { happened: { type: 'file:open', match: { name: 'diary.txt' } } },
          once: true,
          do: [
            {
              addFile: {
                path: ['clue.txt'],
                node: { type: 'file', content: 'found', app: 'Notepad' },
              },
            },
          ],
        },
      ],
    };
    const ref = await mount(scenario);

    act(() =>
      ref.current!.emit({
        type: 'file:open',
        path: ['diary.txt'],
        name: 'diary.txt',
        nodeType: 'file',
      })
    );
    expect(ref.current!.fs.exists(['clue.txt'])).toBe(true);
    expect(ref.current!.fs.readFile(['clue.txt'])).toBe('found');
  });

  it('drives the reference prologue to completion (playable by events)', async () => {
    const { prologueScenario } = await import('../src/lib');
    const ref = await mount(prologueScenario);

    // Intro fires on boot and seeds step 1.
    act(() => ref.current!.emit({ type: 'session:boot-complete' }));
    expect(ref.current!.getSnapshot().flags).toMatchObject({ step: 1 });

    // The chat log is gated behind reading the letter first (correlation).
    act(() =>
      ref.current!.emit({ type: 'file:open', path: ['x'], name: '聊天记录.txt', nodeType: 'file' })
    );
    expect(ref.current!.getSnapshot().flags.readChat).toBeUndefined();

    // Read the letter, then the chat log: the clue file is planted.
    act(() =>
      ref.current!.emit({
        type: 'file:open',
        path: ['x'],
        name: '写给未来的信.txt',
        nodeType: 'file',
      })
    );
    act(() =>
      ref.current!.emit({ type: 'file:open', path: ['x'], name: '聊天记录.txt', nodeType: 'file' })
    );
    expect(ref.current!.getSnapshot().flags).toMatchObject({
      readLetter: true,
      readChat: true,
      step: 2,
    });
    expect(ref.current!.fs.exists(['密码便签.txt'])).toBe(true);

    // Unlocking C:\WINDOWS completes the prologue.
    act(() => ref.current!.emit({ type: 'file:unlock', name: 'WINDOWS' }));
    expect(ref.current!.getSnapshot().flags).toMatchObject({ solved: true, step: 99 });
    expect(ref.current!.fs.exists(['尾声.txt'])).toBe(true);
  });

  it('flag:change fires a trigger on progression itself (#207)', async () => {
    const scenario: Scenario = {
      id: 'test-flagchange',
      triggers: [
        { id: 'grant', on: 'cmd:exec', do: [{ setFlag: 'have_key' }] },
        {
          id: 'react',
          on: 'flag:change',
          when: { event: { flag: 'have_key' } },
          do: [{ setFlag: 'reacted' }],
        },
      ],
    };
    const ref = await mount(scenario);
    act(() => ref.current!.emit({ type: 'cmd:exec', command: 'go' }));
    // grant set have_key → flag:change → react fired. (react's own flag:change for
    // "reacted" doesn't match event.flag==have_key, so the cascade terminates.)
    expect(ref.current!.getSnapshot().flags).toMatchObject({ have_key: true, reacted: true });
  });

  it('flag:change does not fire when the value is unchanged (#207)', async () => {
    const scenario: Scenario = {
      id: 'test-flagchange-noop',
      initialFlags: { x: true },
      triggers: [
        { id: 'set', on: 'cmd:exec', do: [{ setFlag: 'x', value: true }] }, // already true → no-op
        { id: 'watch', on: 'flag:change', do: [{ setFlag: 'sawChange' }] },
      ],
    };
    const ref = await mount(scenario);
    act(() => ref.current!.emit({ type: 'cmd:exec', command: 'go' }));
    expect(ref.current!.getSnapshot().flags.sawChange).toBeUndefined();
  });

  it('persists progress across a remount (same scenario id)', async () => {
    const scenario: Scenario = {
      id: 'test-persist',
      triggers: [{ on: 'cmd:exec', do: [{ setFlag: 'ran' }] }],
    };
    const ref1 = await mount(scenario);
    act(() => ref1.current!.emit({ type: 'cmd:exec', command: 'go' }));
    expect(ref1.current!.getSnapshot().flags).toMatchObject({ ran: true });

    // Remounting the same scenario id rehydrates the saved flag.
    const ref2 = await mount(scenario);
    expect(ref2.current!.getSnapshot().flags).toMatchObject({ ran: true });
  });
});
