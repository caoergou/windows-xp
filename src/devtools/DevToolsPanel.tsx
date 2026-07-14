/**
 * Scenario DevTools (#209) — a mountable, XP-styled overlay that answers the one
 * question `onEvent={console.log}` can't: **why a trigger did not fire**. The
 * event stream is deliberately left to the console (it adds nothing over
 * logging); this panel surfaces only what lives *inside* the engine and never
 * reaches the console:
 *   • Triggers — per registered trigger, for the most recent event: fired /
 *     no-match / skipped, and when a matched trigger's `when` was false, the
 *     condition tree annotated ✓/✗ so the exact false predicate is obvious.
 *   • Flags    — every current flag with its value and who last changed it
 *     (which event → which trigger).
 *
 * It reads the {@link ./traceChannel} the ScenarioRunner publishes to, keyed by
 * this instance's storage prefix. Code lives outside the engine dirs (#143 /
 * #209); mounting is opt-in via the `devtools` prop, so it tree-shakes out of a
 * production build that never asks for it.
 */
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { COLORS } from '../constants';
import { useStorage } from '../context/StorageContext';
import type { Scenario } from '../scenario/types';
import type { ConditionTrace } from '../scenario/trace';
import { subscribeTrace, type EvalReport, type SkipReason } from './traceChannel';

type Tab = 'triggers' | 'flags';

const Panel = styled.div<{ $collapsed: boolean }>`
  position: fixed;
  right: 8px;
  bottom: 38px;
  width: 380px;
  height: ${p => (p.$collapsed ? 'auto' : '440px')};
  max-height: calc(100vh - 80px);
  display: flex;
  flex-direction: column;
  z-index: 2147482000;
  background: ${COLORS.SURFACE};
  border: 1px solid ${COLORS.WINDOW_FRAME};
  box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.45);
  font-family: Tahoma, sans-serif;
  font-size: 11px;
  color: black;
`;

const TitleBar = styled.div`
  display: flex;
  align-items: center;
  height: 24px;
  padding: 0 4px 0 7px;
  background: ${COLORS.TITLE_BAR_GRADIENT};
  color: white;
  font-weight: bold;
  font-size: 12px;
  user-select: none;
`;

// xp.css puts min-width: 75px + padding on every <button>; without the resets
// below a title-bar caption button balloons into a rounded pill.
const TitleBtn = styled.button`
  margin-left: auto;
  min-width: 0;
  width: 18px;
  height: 16px;
  padding: 0;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: Tahoma, sans-serif;
  font-size: 12px;
  line-height: 1;
  border: 1px solid ${COLORS.BUTTON_BORDER};
  background: ${COLORS.BUTTON_FACE};
  cursor: pointer;
`;

const Tabs = styled.div`
  display: flex;
  gap: 2px;
  padding: 4px 4px 0;
  border-bottom: 1px solid ${COLORS.BUTTON_SHADOW};
`;

// min-width reset (xp.css) so the tabs hug their labels instead of each being
// 75px wide; the active tab overlaps the body border to read as a real XP tab.
const TabBtn = styled.button<{ $active: boolean }>`
  min-width: 0;
  margin-bottom: -1px;
  padding: 3px 12px;
  font-family: Tahoma, sans-serif;
  font-size: 11px;
  border: 1px solid ${COLORS.BUTTON_SHADOW};
  border-bottom: ${p => (p.$active ? '1px solid white' : `1px solid ${COLORS.BUTTON_SHADOW}`)};
  border-radius: 3px 3px 0 0;
  cursor: pointer;
  background: ${p => (p.$active ? 'white' : COLORS.SURFACE)};
  font-weight: ${p => (p.$active ? 'bold' : 'normal')};
`;

const Body = styled.div`
  flex: 1;
  overflow-y: auto;
  background: white;
  padding: 6px;
`;

const Muted = styled.span`
  color: gray;
`;

const Empty = styled.div`
  color: gray;
  font-style: italic;
  padding: 6px 2px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  td {
    padding: 2px 4px;
    border-bottom: 1px solid ${COLORS.SURFACE};
    vertical-align: top;
  }
  td.k {
    font-weight: bold;
    white-space: nowrap;
  }
`;

const TrigCard = styled.div`
  border: 1px solid ${COLORS.BUTTON_SHADOW};
  border-radius: 3px;
  margin-bottom: 5px;
  padding: 4px 6px;
`;

const Badge = styled.span<{ $bg: string }>`
  display: inline-block;
  padding: 0 6px;
  border-radius: 8px;
  color: white;
  font-size: 10px;
  background: ${p => p.$bg};
`;

const skipColor: Record<SkipReason, string> = {
  when: 'crimson',
  once: 'darkorange',
  max: 'darkorange',
};

const skipLabel: Record<SkipReason, string> = {
  when: 'when: false',
  once: 'once: spent',
  max: 'max: reached',
};

const TraceLine = styled.div<{ $held: boolean }>`
  font-family: 'Courier New', monospace;
  color: ${p => (p.$held ? 'green' : 'crimson')};
  white-space: pre;
`;

const TraceNode: React.FC<{ node: ConditionTrace; depth?: number }> = ({ node, depth = 0 }) => (
  <>
    <TraceLine $held={node.held}>
      {'  '.repeat(depth)}
      {node.held ? '✓ ' : '✗ '}
      {node.label}
    </TraceLine>
    {node.children?.map((c, i) => (
      <TraceNode key={i} node={c} depth={depth + 1} />
    ))}
  </>
);

export interface DevToolsPanelProps {
  /** The running scenario, so the Triggers tab can report before any event. */
  scenario?: Scenario;
}

const CAP_REPORTS = 60;

const DevToolsPanel: React.FC<DevToolsPanelProps> = ({ scenario }) => {
  const storage = useStorage();
  const [tab, setTab] = useState<Tab>('triggers');
  const [collapsed, setCollapsed] = useState(false);
  const [reports, setReports] = useState<EvalReport[]>([]);

  useEffect(() => {
    return subscribeTrace(storage.prefix, report =>
      setReports(prev => [...prev.slice(-(CAP_REPORTS - 1)), report])
    );
  }, [storage.prefix]);

  const latest = reports[reports.length - 1];
  const flags = latest?.flags ?? {};
  const lastChangeBy: Record<string, string> = {};
  for (const r of reports)
    for (const c of r.changes) lastChangeBy[c.flag] = `${r.event.type} → ${c.by}`;

  return (
    <Panel $collapsed={collapsed} data-testid="devtools-panel">
      <TitleBar>
        Scenario DevTools
        <TitleBtn
          data-testid="devtools-collapse"
          title={collapsed ? 'Expand' : 'Collapse'}
          onClick={() => setCollapsed(c => !c)}
        >
          {collapsed ? '□' : '_'}
        </TitleBtn>
      </TitleBar>

      {!collapsed && (
        <>
          <Tabs>
            <TabBtn
              $active={tab === 'triggers'}
              data-testid="devtools-tab-triggers"
              onClick={() => setTab('triggers')}
            >
              Triggers
            </TabBtn>
            <TabBtn
              $active={tab === 'flags'}
              data-testid="devtools-tab-flags"
              onClick={() => setTab('flags')}
            >
              Flags
            </TabBtn>
          </Tabs>

          <Body>
            {tab === 'triggers' &&
              (!latest ? (
                <Empty>
                  {scenario
                    ? `${scenario.triggers.length} trigger(s) registered — waiting for the first event.`
                    : 'No scenario running.'}
                </Empty>
              ) : (
                <>
                  <div style={{ color: 'gray', marginBottom: 4 }}>
                    Last event: <b>{latest.event.type}</b>
                  </div>
                  {latest.triggers.map(tr => (
                    <TrigCard key={tr.id} data-testid="devtools-trigger">
                      <div>
                        <b>{tr.id}</b>{' '}
                        <Muted>on {Array.isArray(tr.on) ? tr.on.join('|') : tr.on}</Muted>{' '}
                        {tr.fired ? (
                          <Badge $bg="green">fired</Badge>
                        ) : !tr.matchedOn ? (
                          <Badge $bg="gray">no match</Badge>
                        ) : (
                          <Badge $bg={tr.skip ? skipColor[tr.skip] : 'gray'}>
                            {tr.skip ? skipLabel[tr.skip] : 'skipped'}
                          </Badge>
                        )}
                      </div>
                      {tr.when && !tr.fired && tr.skip === 'when' && (
                        <div style={{ marginTop: 3 }}>
                          <TraceNode node={tr.when} />
                        </div>
                      )}
                    </TrigCard>
                  ))}
                </>
              ))}

            {tab === 'flags' &&
              (Object.keys(flags).length === 0 ? (
                <Empty>No flags set{scenario ? '' : ' (no scenario running)'}.</Empty>
              ) : (
                <Table>
                  <tbody>
                    {Object.entries(flags).map(([k, v]) => (
                      <tr key={k} data-testid="devtools-flag">
                        <td className="k">{k}</td>
                        <td>{JSON.stringify(v)}</td>
                        <td style={{ color: 'gray' }}>{lastChangeBy[k] ?? ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ))}
          </Body>
        </>
      )}
    </Panel>
  );
};

export default DevToolsPanel;
