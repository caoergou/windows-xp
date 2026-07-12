/**
 * Search Oracle (#219 / #134): the journal-derived `searched`/`found` predicates,
 * the app emitting `search:query` with hit/resultIds, and a scenario gating on a
 * search.
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { describe, it, expect, beforeEach } from 'vitest';
import { evaluateCondition, type EvalContext } from '../src/scenario/engine';
import { defineScenario, searched, found, setFlag } from '../src/scenario/builder';
import { solveScenario } from '../src/scenario/solver';
import SearchOracle from '../src/apps/SearchOracle';
import { demoSearch } from '../src/data/scenarios/searchDemo';
import xpI18n from '../src/i18n';
import { XPEventBus, type XPEvent } from '../src/events';
import { EventBusProvider } from '../src/context/EventBusContext';

const ctx = (journal: XPEvent[]): EvalContext => ({
  flags: {},
  journal,
  fs: { exists: () => false, unlocked: () => false, content: () => null },
});

const query = (q: string, ids: string[] = []): XPEvent => ({
  type: 'search:query',
  query: q,
  hit: ids.length > 0,
  resultIds: ids,
});

describe('search predicates (journal-derived)', () => {
  it('searched matches a query as a case-insensitive substring', () => {
    const j = [query('水晶女孩 是谁', ['qq-space'])];
    expect(evaluateCondition({ searched: '水晶女孩' }, ctx(j))).toBe(true);
    expect(evaluateCondition({ searched: '水晶' }, ctx(j))).toBe(true);
    expect(evaluateCondition({ searched: 'CRYSTAL' }, ctx([query('crystal girl')]))).toBe(true);
    expect(evaluateCondition({ searched: '网吧' }, ctx(j))).toBe(false);
  });

  it('found holds when a result id appeared in any search', () => {
    const j = [query('网吧', ['cafe-news', 'bbs-thread'])];
    expect(evaluateCondition({ found: 'cafe-news' }, ctx(j))).toBe(true);
    expect(evaluateCondition({ found: 'bbs-thread' }, ctx(j))).toBe(true);
    expect(evaluateCondition({ found: 'qq-space' }, ctx(j))).toBe(false);
    // A miss (no result ids) surfaces nothing.
    expect(evaluateCondition({ found: 'cafe-news' }, ctx([query('无关的词')]))).toBe(false);
  });
});

describe('SearchOracle app emits search:query', () => {
  let bus: XPEventBus;
  let events: XPEvent[];
  beforeEach(() => {
    bus = new XPEventBus();
    events = [];
    bus.subscribe(e => events.push(e));
  });

  const mount = () =>
    render(
      <I18nextProvider i18n={xpI18n}>
        <EventBusProvider bus={bus}>
          <SearchOracle {...demoSearch} />
        </EventBusProvider>
      </I18nextProvider>
    );

  it('emits a hit with the matching result ids', () => {
    const view = mount();
    fireEvent.change(view.getByTestId('search-query'), { target: { value: '水晶女孩' } });
    fireEvent.click(view.getByTestId('search-go'));
    const ev = events.find(e => e.type === 'search:query') as Extract<XPEvent, { type: 'search:query' }>;
    expect(ev.hit).toBe(true);
    expect(ev.resultIds).toEqual(expect.arrayContaining(['bbs-thread', 'qq-space']));
    // The matching results render.
    expect(view.getByTestId('result-bbs-thread')).toBeTruthy();
  });

  it('emits a miss with no result ids', () => {
    const view = mount();
    fireEvent.change(view.getByTestId('search-query'), { target: { value: '不存在的东西' } });
    fireEvent.click(view.getByTestId('search-go'));
    const ev = events.find(e => e.type === 'search:query') as Extract<XPEvent, { type: 'search:query' }>;
    expect(ev.hit).toBe(false);
    expect(ev.resultIds).toEqual([]);
  });
});

describe('scenario gates on searched()/found()', () => {
  it('fires once the player searches the right term', () => {
    const s = defineScenario('web');
    s.on('search:query').when(searched('水晶女孩')).do(setFlag('lead'));
    s.on('search:query').when(found('cafe-news')).do(setFlag('fire'));
    const scenario = s.build();

    const after = solveScenario(scenario, [query('城东 网吧 火灾', ['cafe-news'])]);
    expect(after.flags.fire).toBe(true);
    expect(after.flags.lead).toBeUndefined();

    const after2 = solveScenario(scenario, [query('水晶女孩', ['qq-space'])]);
    expect(after2.flags.lead).toBe(true);
  });
});
