/**
 * Scenario system (#84): the pure engine (matching, conditions, once/max,
 * journal) and an end-to-end run through <WindowsXP scenario={...}/>.
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  matchesEvent,
  evalCondition,
  evaluateEvent,
  appendJournal,
  JOURNAL_LIMIT,
} from '../src/scenario/engine';
import { defineScenario } from '../src/scenario';
import type { Scenario, ScenarioState } from '../src/scenario/types';
import { WindowsXP } from '../src/lib';
import type { XPEvent } from '../src/lib';

const state = (over: Partial<ScenarioState> = {}): ScenarioState => ({
  flags: {},
  journal: [],
  fireCounts: {},
  ...over,
});

describe('scenario engine — matching (#84)', () => {
  it('matches by exact type and by trailing glob', () => {
    expect(matchesEvent({ type: 'file:open' }, { type: 'file:open', path: [], name: 'a', nodeType: 'file' })).toBe(true);
    expect(matchesEvent({ type: 'file:*' }, { type: 'file:open', path: [], name: 'a', nodeType: 'file' })).toBe(true);
    expect(matchesEvent({ type: 'cmd:*' }, { type: 'file:open', path: [], name: 'a', nodeType: 'file' })).toBe(false);
  });

  it('matches on field equality, including array paths', () => {
    const e: XPEvent = { type: 'file:open', path: ['a', 'b'], name: 'b', nodeType: 'file' };
    expect(matchesEvent({ type: 'file:open', name: 'b' }, e)).toBe(true);
    expect(matchesEvent({ type: 'file:open', path: ['a', 'b'] }, e)).toBe(true);
    expect(matchesEvent({ type: 'file:open', path: ['a', 'c'] }, e)).toBe(false);
    expect(matchesEvent({ type: 'file:open', name: 'x' }, e)).toBe(false);
  });
});

describe('scenario engine — conditions (#84)', () => {
  const evt: XPEvent = { type: 'file:open', path: ['我的文档', 'readme.txt'], name: 'readme.txt', nodeType: 'file' };

  it('flag / flagEquals', () => {
    expect(evalCondition({ flag: 'x' }, { flags: { x: true }, journal: [], event: evt })).toBe(true);
    expect(evalCondition({ flag: 'x' }, { flags: {}, journal: [], event: evt })).toBe(false);
    expect(evalCondition({ flagEquals: { flag: 'n', value: 3 } }, { flags: { n: 3 }, journal: [], event: evt })).toBe(true);
    expect(evalCondition({ flagEquals: { flag: 'n', value: 3 } }, { flags: { n: 2 }, journal: [], event: evt })).toBe(false);
  });

  it('happened / count over the journal', () => {
    const journal: XPEvent[] = [
      { type: 'file:open', path: [], name: 'a', nodeType: 'file' },
      { type: 'file:open', path: [], name: 'a', nodeType: 'file' },
    ];
    expect(evalCondition({ happened: { type: 'file:open', name: 'a' } }, { flags: {}, journal, event: evt })).toBe(true);
    expect(evalCondition({ happened: { type: 'file:open', name: 'z' } }, { flags: {}, journal, event: evt })).toBe(false);
    expect(evalCondition({ count: { event: { type: 'file:open' }, gte: 2 } }, { flags: {}, journal, event: evt })).toBe(true);
    expect(evalCondition({ count: { event: { type: 'file:open' }, gte: 3 } }, { flags: {}, journal, event: evt })).toBe(false);
    expect(evalCondition({ count: { event: { type: 'file:open' }, lte: 1 } }, { flags: {}, journal, event: evt })).toBe(false);
  });

  it('allOf / anyOf / not / match combine', () => {
    const ctx = { flags: { done: true }, journal: [], event: evt };
    expect(evalCondition({ allOf: [{ flag: 'done' }, { match: { name: 'readme.txt' } }] }, ctx)).toBe(true);
    expect(evalCondition({ anyOf: [{ flag: 'missing' }, { match: { name: 'readme.txt' } }] }, ctx)).toBe(true);
    expect(evalCondition({ not: { flag: 'done' } }, ctx)).toBe(false);
    expect(evalCondition({ match: { name: 'other.txt' } }, ctx)).toBe(false);
  });
});

describe('scenario engine — evaluateEvent once/max (#84)', () => {
  const scenario: Scenario = {
    triggers: [
      { id: 't-once', on: 'scenario:start', once: true, actions: [{ setFlag: 'a' }] },
      { id: 't-max', on: 'file:open', max: 2, actions: [{ setFlag: 'b' }] },
    ],
  };

  it('respects once and max via fireCounts', () => {
    const fresh = evaluateEvent(scenario, { type: 'scenario:start' }, state());
    expect(fresh.firedTriggerIds).toEqual(['t-once']);
    const afterOnce = evaluateEvent(scenario, { type: 'scenario:start' }, state({ fireCounts: { 't-once': 1 } }));
    expect(afterOnce.firedTriggerIds).toEqual([]);

    const fe: XPEvent = { type: 'file:open', path: [], name: 'x', nodeType: 'file' };
    expect(evaluateEvent(scenario, fe, state({ fireCounts: { 't-max': 1 } })).firedTriggerIds).toEqual(['t-max']);
    expect(evaluateEvent(scenario, fe, state({ fireCounts: { 't-max': 2 } })).firedTriggerIds).toEqual([]);
  });

  it('appendJournal keeps the journal bounded', () => {
    let j: XPEvent[] = [];
    for (let i = 0; i < JOURNAL_LIMIT + 50; i++) {
      j = appendJournal(j, { type: 'cmd:exec', command: String(i) }) as XPEvent[];
    }
    expect(j.length).toBe(JOURNAL_LIMIT);
    expect((j[j.length - 1] as { command: string }).command).toBe(String(JOURNAL_LIMIT + 49));
  });
});

describe('defineScenario validation (#84)', () => {
  it('warns on duplicate trigger ids', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    defineScenario({
      triggers: [
        { id: 'dup', on: 'scenario:start', actions: [] },
        { id: 'dup', on: 'file:open', actions: [] },
      ],
    });
    expect(warn.mock.calls.map(c => String(c[0])).some(m => /duplicate trigger id "dup"/.test(m))).toBe(true);
    warn.mockRestore();
  });
});

describe('scenario runs through <WindowsXP/> (#84)', () => {
  beforeEach(() => localStorage.clear());

  const testScenario: Scenario = {
    id: 'test',
    triggers: [
      {
        id: 'welcome',
        on: 'scenario:start',
        once: true,
        actions: [{ notify: { title: 'Welcome', body: 'The story begins.' } }, { setFlag: 'started' }],
      },
      {
        // Opening Calculator drops a new file on the desktop and flags progress.
        id: 'react-to-open',
        on: 'file:open',
        when: { match: { name: 'Calculator' } },
        once: true,
        actions: [
          { setFlag: 'openedCalc' },
          { addFile: { path: ['clue.txt'], content: 'a clue', app: 'Notepad' } },
        ],
      },
    ],
  };

  it('fires scenario:start, reacts to events, and persists progress', async () => {
    const events: XPEvent[] = [];
    render(
      <WindowsXP
        skipBoot
        autoLogin
        disableScreenSaver
        scenario={testScenario}
        onEvent={e => events.push(e)}
      />
    );
    await waitFor(() => expect(screen.getByTestId('taskbar')).toBeInTheDocument());

    // scenario:start → a tray balloon (notification:show carries the title).
    await waitFor(() =>
      expect(events.some(e => e.type === 'notification:show' && e.title === 'Welcome')).toBe(true)
    );

    // Open Calculator → the trigger adds clue.txt to the desktop.
    await screen.findByTestId('desktop-icon-Calculator');
    screen.getByTestId('desktop-icon-Calculator').dispatchEvent(
      new MouseEvent('dblclick', { bubbles: true })
    );
    await waitFor(() => expect(screen.getByTestId('desktop-icon-clue.txt')).toBeInTheDocument());

    // Progress persisted under the instance prefix.
    const saved = JSON.parse(localStorage.getItem('xp_scenario_state') || '{}');
    expect(saved.flags).toMatchObject({ started: true, openedCalc: true });
  });
});
