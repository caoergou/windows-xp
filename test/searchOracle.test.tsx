/**
 * In-world search (#219 / #134): the journal-derived `searched`/`found`
 * predicates, the search engine page (rendered inside IE) emitting `search:query`
 * and driving navigation, and a scenario gating on a search.
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { evaluateCondition, type EvalContext } from '../src/scenario/engine';
import { defineScenario, searched, found, setFlag } from '../src/scenario/builder';
import { solveScenario } from '../src/scenario/solver';
import SearchEnginePage from '../src/apps/InternetExplorer/components/SearchEnginePage';
import {
  normalizeSearchTerm,
  searchCorpus,
} from '../src/apps/InternetExplorer/components/SearchEnginePage';
import { renderEraPage } from '../src/content/eraPage';
import {
  isSearchEngineUrl,
  parseSearchQuery,
  searchResultsUrl,
} from '../src/apps/InternetExplorer/constants';
import { demoSearchCorpus } from '../src/data/scenarios/searchDemo';
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
    expect(evaluateCondition({ found: 'cafe-news' }, ctx([query('无关的词')]))).toBe(false);
  });
});

describe('search engine URL helpers', () => {
  it('recognises the search engine home and results pages', () => {
    expect(isSearchEngineUrl('http://www.baidu.com')).toBe(true);
    expect(isSearchEngineUrl('http://www.baidu.com/s?wd=%E7%BD%91%E5%90%A7')).toBe(true);
    expect(isSearchEngineUrl('http://news.county.com/2007/fire.html')).toBe(false);
  });

  it('round-trips a query through the results URL', () => {
    expect(parseSearchQuery(searchResultsUrl('水晶女孩'))).toBe('水晶女孩');
    expect(parseSearchQuery('http://www.baidu.com')).toBe('');
  });
});

describe('offline corpus v2 (#281)', () => {
  it('normalizes width/case, honors aliases, typo tolerance, and stable rank', () => {
    const corpus = [
      { id: 'late', title: 'Late', url: 'http://late.test', match: ['crystal'], rank: 5 },
      {
        id: 'first',
        title: 'First',
        url: 'http://first.test',
        match: ['水晶女孩'],
        aliases: ['Crystal Girl'],
        typoTolerance: 1,
        rank: 1,
      },
    ];
    expect(normalizeSearchTerm(' ＣＲＹＳＴＡＬ—Girl ')).toBe('crystal girl');
    expect(searchCorpus(corpus, 'crystl girl').map(item => item.id)).toEqual(['first']);
    expect(searchCorpus(corpus, 'crystal').map(item => item.id)).toEqual(['first', 'late']);
  });

  it('renders escaped structured era pages', () => {
    const html = renderEraPage({
      template: 'forum',
      title: 'Town BBS',
      sections: [{ heading: '<notice>', body: ['A & B'] }],
    });
    expect(html).toContain('&lt;notice&gt;');
    expect(html).toContain('A &amp; B');
    expect(html).toContain('class="forum"');
  });
});

describe('SearchEnginePage (inside IE)', () => {
  let bus: XPEventBus;
  let events: XPEvent[];
  beforeEach(() => {
    bus = new XPEventBus();
    events = [];
    bus.subscribe(e => events.push(e));
  });

  const mount = (query: string, navigateTo = vi.fn()) =>
    render(
      <I18nextProvider i18n={xpI18n}>
        <EventBusProvider bus={bus}>
          <SearchEnginePage query={query} corpus={demoSearchCorpus} navigateTo={navigateTo} />
        </EventBusProvider>
      </I18nextProvider>
    );

  it('submitting from the home page navigates to the results URL (no premature event)', () => {
    const navigateTo = vi.fn();
    const view = mount('', navigateTo);
    expect(events.filter(e => e.type === 'search:query')).toHaveLength(0);
    fireEvent.change(view.getByTestId('search-query'), { target: { value: '水晶女孩' } });
    fireEvent.click(view.getByTestId('search-go'));
    expect(navigateTo).toHaveBeenCalledWith(searchResultsUrl('水晶女孩'));
  });

  it('a results page emits a hit with the matching result ids and renders them', () => {
    const view = mount('水晶女孩');
    const ev = events.find(e => e.type === 'search:query') as Extract<
      XPEvent,
      { type: 'search:query' }
    >;
    expect(ev.hit).toBe(true);
    expect(ev.resultIds).toEqual(expect.arrayContaining(['bbs-thread', 'qq-space']));
    expect(view.getByTestId('result-bbs-thread')).toBeTruthy();
  });

  it('clicking a result navigates IE to its URL with the authored landing page', () => {
    const navigateTo = vi.fn();
    const view = mount('网吧', navigateTo);
    fireEvent.click(view.getByTestId('result-cafe-news').querySelector('a')!);
    expect(navigateTo).toHaveBeenCalledWith(
      'http://news.county.com/2007/fire.html',
      expect.stringContaining('火灾')
    );
  });

  it('a miss emits hit:false with no result ids', () => {
    mount('不存在的东西');
    const ev = events.find(e => e.type === 'search:query') as Extract<
      XPEvent,
      { type: 'search:query' }
    >;
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
