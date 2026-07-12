/**
 * In-world search engine (#219 / #134) — the scenario-layer search page rendered
 * *inside* Internet Explorer at `baidu.com`, not as a standalone window (in the
 * XP era a search engine is a web page you open in the browser).
 *
 * The query rides in the URL (`/s?wd=…`), so a search is an ordinary IE
 * navigation that Back/Forward replay. When a results page is shown the page
 * emits `search:query { query, hit, resultIds }`; scenarios gate on the derived
 * predicates `searched(term)` / `found(id)`. Content — the result corpus — is
 * scenario-provided via IE's `searchCorpus` prop (axiom 2). Clicking a result
 * navigates IE to that result's URL, rendering its authored `html` landing page.
 */
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../../constants';
import { useXPEventBus } from '../../../context/EventBusContext';
import { searchResultsUrl } from '../constants';
import type { SearchResultPage } from '../types';

const Page = styled.div`
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  overflow-y: auto;
  background: white;
  font-family: Tahoma, sans-serif;
  font-size: 12px;
  color: black;
`;

const HomeWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 90px;
  gap: 18px;
`;

const Bar = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ResultsHead = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-bottom: 1px solid ${COLORS.BUTTON_SHADOW};
`;

const Wordmark = styled.div<{ $big?: boolean }>`
  font-family: Georgia, 'Times New Roman', serif;
  font-weight: bold;
  font-style: italic;
  color: mediumblue;
  letter-spacing: -0.5px;
  font-size: ${p => (p.$big ? '44px' : '22px')};
`;

const Query = styled.input`
  height: 22px;
  padding: 0 6px;
  font-family: Tahoma, sans-serif;
  font-size: 13px;
  border: 1px solid ${COLORS.INPUT_BORDER};
`;

const HomeQuery = styled(Query)`
  width: 400px;
`;

const ResultQuery = styled(Query)`
  flex: 1;
`;

const Go = styled.button`
  height: 24px;
  padding: 0 12px;
  font-family: Tahoma, sans-serif;
  font-size: 12px;
`;

const Results = styled.div`
  padding: 10px 16px;
`;

const Stat = styled.div`
  color: ${COLORS.BUTTON_SHADOW};
  margin-bottom: 12px;
`;

const Hit = styled.div`
  margin-bottom: 14px;
`;

const Title = styled.a`
  color: mediumblue;
  font-size: 14px;
  text-decoration: underline;
  cursor: pointer;
`;

const Url = styled.div`
  color: darkgreen;
  font-size: 11px;
`;

const Snippet = styled.div`
  color: black;
  margin-top: 1px;
`;

const Empty = styled.div`
  color: ${COLORS.BUTTON_SHADOW};
  font-style: italic;
`;

const matches = (r: SearchResultPage, query: string): boolean => {
  const q = query.toLowerCase();
  return r.match.some(m => q.includes(m.toLowerCase()));
};

interface SearchEnginePageProps {
  /** The active query, parsed from the URL (`?wd=`); empty string = home page. */
  query: string;
  corpus: SearchResultPage[];
  brand?: string;
  navigateTo: (url: string, html?: string) => void;
}

const SearchEnginePage: React.FC<SearchEnginePageProps> = ({ query, corpus, brand, navigateTo }) => {
  const { t } = useTranslation();
  const bus = useXPEventBus();
  const [text, setText] = useState(query);

  useEffect(() => setText(query), [query]);

  const hits = query ? corpus.filter(r => matches(r, query)) : [];

  // A results page is an in-world search: announce it so scenarios can react.
  useEffect(() => {
    if (!query) return;
    bus.emit({
      type: 'search:query',
      query,
      hit: hits.length > 0,
      resultIds: hits.map(r => r.id),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const submit = () => {
    const q = text.trim();
    if (q) navigateTo(searchResultsUrl(q));
  };

  const mark = brand ?? t('searchOracle.brand');

  if (!query) {
    return (
      <Page data-testid="search-engine">
        <HomeWrap>
          <Wordmark $big>{mark}</Wordmark>
          <Bar>
            <HomeQuery
              data-testid="search-query"
              value={text}
              placeholder={t('searchOracle.placeholder')}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
            />
            <Go data-testid="search-go" onClick={submit}>
              {t('searchOracle.go')}
            </Go>
          </Bar>
        </HomeWrap>
      </Page>
    );
  }

  return (
    <Page data-testid="search-engine">
      <ResultsHead>
        <Wordmark>{mark}</Wordmark>
        <ResultQuery
          data-testid="search-query"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
        />
        <Go data-testid="search-go" onClick={submit}>
          {t('searchOracle.go')}
        </Go>
      </ResultsHead>
      <Results>
        <Stat data-testid="search-stat">
          {hits.length > 0
            ? t('searchOracle.stat', { count: hits.length, query })
            : t('searchOracle.empty', { query })}
        </Stat>
        {hits.map(r => (
          <Hit key={r.id} data-testid={`result-${r.id}`}>
            <Title
              href={r.url}
              onClick={e => {
                e.preventDefault();
                navigateTo(r.url, r.html);
              }}
            >
              {r.title}
            </Title>
            <Url>{r.url}</Url>
            {r.snippet && <Snippet>{r.snippet}</Snippet>}
          </Hit>
        ))}
        {hits.length === 0 && <Empty>{t('searchOracle.noResults')}</Empty>}
      </Results>
    </Page>
  );
};

export default SearchEnginePage;
