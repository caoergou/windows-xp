/**
 * Search Oracle (#219, #134) — an in-world, period search engine (a fake
 * 百度/AltaVista/MSN Search page) as a scenario-layer app. The player types a
 * query; the app matches it against an authored result set and emits
 * `search:query { query, hit, resultIds }`. Scenarios gate on the derived
 * predicates `searched(term)` / `found(resultId)` — both read from the event
 * journal, so the engine holds no search state (axiom 2).
 *
 * Content (the result oracle) is scenario-provided via props: each result lists
 * the query terms that surface it. A query "hits" when it contains any of a
 * result's `match` terms (case-insensitive substring), letting authors reward
 * the *idea* of a search rather than an exact string.
 */
import React, { useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../constants';
import { useXPEventBus } from '../../context/EventBusContext';

export interface SearchOracleResult {
  id: string;
  title: string;
  snippet?: string;
  url?: string;
  /** Query terms that surface this result (case-insensitive substring match against the query). */
  match: string[];
}

export interface SearchOracleProps {
  engineId?: string;
  /** Branding shown as the wordmark, e.g. `百度` or `AltaVista`. */
  brand?: string;
  results?: SearchOracleResult[];
  windowId?: string;
}

const Wrap = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  font-family: Tahoma, sans-serif;
  font-size: 12px;
  color: black;
  background: white;
`;

const Masthead = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px 10px;
  border-bottom: 1px solid ${COLORS.BUTTON_SHADOW};
  background: ${COLORS.SURFACE};
`;

const Wordmark = styled.div`
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 22px;
  font-weight: bold;
  font-style: italic;
  color: mediumblue;
  letter-spacing: -0.5px;
`;

const Query = styled.input`
  flex: 1;
  height: 22px;
  padding: 0 6px;
  font-family: Tahoma, sans-serif;
  font-size: 13px;
  border: 1px solid ${COLORS.INPUT_BORDER};
`;

const Go = styled.button`
  height: 24px;
  padding: 0 12px;
  font-family: Tahoma, sans-serif;
  font-size: 12px;
`;

const Results = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 10px 14px;
`;

const Stat = styled.div`
  color: ${COLORS.BUTTON_SHADOW};
  margin-bottom: 10px;
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

const matches = (r: SearchOracleResult, query: string): boolean => {
  const q = query.toLowerCase();
  return r.match.some(m => q.includes(m.toLowerCase()));
};

const SearchOracle: React.FC<SearchOracleProps> = ({ engineId = 'search', brand, results = [] }) => {
  const { t } = useTranslation();
  const bus = useXPEventBus();
  const [text, setText] = useState('');
  const [ran, setRan] = useState<{ query: string; hits: SearchOracleResult[] } | null>(null);

  const run = () => {
    const query = text.trim();
    if (!query) return;
    const hits = results.filter(r => matches(r, query));
    setRan({ query, hits });
    bus.emit({
      type: 'search:query',
      query,
      hit: hits.length > 0,
      resultIds: hits.map(r => r.id),
    });
  };

  return (
    <Wrap data-testid="search-oracle" data-engine-id={engineId}>
      <Masthead>
        <Wordmark>{brand ?? t('searchOracle.brand')}</Wordmark>
        <Query
          data-testid="search-query"
          value={text}
          placeholder={t('searchOracle.placeholder')}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') run();
          }}
        />
        <Go data-testid="search-go" onClick={run}>
          {t('searchOracle.go')}
        </Go>
      </Masthead>
      <Results>
        {ran && (
          <Stat data-testid="search-stat">
            {ran.hits.length > 0
              ? t('searchOracle.stat', { count: ran.hits.length, query: ran.query })
              : t('searchOracle.empty', { query: ran.query })}
          </Stat>
        )}
        {ran?.hits.map(r => (
          <Hit key={r.id} data-testid={`result-${r.id}`}>
            <Title href={r.url} onClick={e => e.preventDefault()}>
              {r.title}
            </Title>
            {r.url && <Url>{r.url}</Url>}
            {r.snippet && <Snippet>{r.snippet}</Snippet>}
          </Hit>
        ))}
        {ran && ran.hits.length === 0 && <Empty>{t('searchOracle.noResults')}</Empty>}
      </Results>
    </Wrap>
  );
};

export default SearchOracle;
