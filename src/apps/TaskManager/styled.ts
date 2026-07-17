import styled from 'styled-components';
import { resolveOSTheme } from '../../themes/useOSTheme';

/**
 * Windows XP Task Manager (taskmgr.exe) styled primitives.
 *
 * All colours come from the active OS theme's tokens (`theme.tokens`) — the
 * component owns no inline hex literals (platform-purity ratchet, #143). The
 * green-on-black Performance graphs use the dedicated `PERF_GRAPH_*` tokens.
 */

export const Container = styled.div`
  box-sizing: border-box;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => resolveOSTheme(theme).tokens.SURFACE};
  font:
    11px Tahoma,
    'Microsoft YaHei',
    sans-serif;
  color: ${({ theme }) => resolveOSTheme(theme).tokens.BLACK};
`;

/* ---- Tabs ---- */

export const Tabs = styled.div`
  display: flex;
  padding: 6px 6px 0;
  flex-shrink: 0;
`;

export const Tab = styled.button<{ $active?: boolean }>`
  position: relative;
  padding: 3px 11px 4px;
  margin-right: 2px;
  border: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.BORDER_GREY};
  border-bottom: none;
  border-radius: 3px 3px 0 0;
  font: inherit;
  cursor: default;
  color: ${({ theme }) => resolveOSTheme(theme).tokens.BLACK};
  background: ${({ $active, theme }) =>
    $active ? resolveOSTheme(theme).tokens.BUTTON_HIGHLIGHT : resolveOSTheme(theme).tokens.SURFACE};
  z-index: ${({ $active }) => ($active ? 2 : 1)};
  /* An active tab overlaps the panel border below it so it reads as connected. */
  margin-bottom: ${({ $active }) => ($active ? '-1px' : '0')};
  padding-bottom: ${({ $active }) => ($active ? '5px' : '4px')};
`;

/* The bordered content panel the active tab connects to. */
export const Panel = styled.div`
  position: relative;
  z-index: 1;
  margin: 0 6px;
  border: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.BORDER_GREY};
  background: ${({ theme }) => resolveOSTheme(theme).tokens.SURFACE};
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 10px;
  gap: 8px;
`;

/* ---- Generic list surface (Applications + Processes) ---- */

export const ListFrame = styled.div`
  flex: 1;
  min-height: 0;
  border: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.BORDER_GREY};
  background: ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_HIGHLIGHT};
  overflow: auto;
  /* inset 3D well */
  box-shadow: inset 1px 1px ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_SHADOW};
`;

export const GroupLabel = styled.div`
  padding: 1px 0 4px;
  font: inherit;
`;

/* ---- Applications table ---- */

export const AppHeaderRow = styled.div`
  position: sticky;
  top: 0;
  display: grid;
  grid-template-columns: 1fr 96px;
  background: ${({ theme }) => resolveOSTheme(theme).tokens.SURFACE};
  border-bottom: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.BORDER_GREY};

  span {
    padding: 3px 6px;
    border-right: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.DIVIDER_GREY};
  }
`;

export const AppRow = styled.div<{ $selected?: boolean }>`
  display: grid;
  grid-template-columns: 1fr 96px;
  cursor: default;
  color: ${({ $selected, theme }) =>
    $selected ? resolveOSTheme(theme).tokens.BUTTON_HIGHLIGHT : resolveOSTheme(theme).tokens.BLACK};
  background: ${({ $selected, theme }) =>
    $selected ? resolveOSTheme(theme).tokens.MENU_HIGHLIGHT : 'transparent'};

  > span {
    min-height: 22px;
    padding: 2px 6px;
    display: flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

/* ---- Processes table ---- */

export const ProcTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font: inherit;
  table-layout: fixed;
`;

export const ProcHead = styled.thead`
  th {
    position: sticky;
    top: 0;
    text-align: left;
    font-weight: normal;
    padding: 2px 6px;
    background: ${({ theme }) => resolveOSTheme(theme).tokens.SURFACE};
    border-right: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.DIVIDER_GREY};
    border-bottom: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.BORDER_GREY};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  th:last-child {
    border-right: none;
  }
`;

export const ProcRow = styled.tr<{ $selected?: boolean }>`
  cursor: default;
  color: ${({ $selected, theme }) =>
    $selected ? resolveOSTheme(theme).tokens.BUTTON_HIGHLIGHT : resolveOSTheme(theme).tokens.BLACK};
  background: ${({ $selected, theme }) =>
    $selected ? resolveOSTheme(theme).tokens.MENU_HIGHLIGHT : 'transparent'};

  td {
    padding: 1px 6px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  td.num {
    text-align: right;
  }
`;

/* ---- Bottom action button row ---- */

export const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-shrink: 0;
`;

/* ---- Status bar ---- */

export const StatusBar = styled.div`
  display: flex;
  align-items: center;
  height: 20px;
  flex-shrink: 0;
  border-top: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_HIGHLIGHT};
  background: ${({ theme }) => resolveOSTheme(theme).tokens.SURFACE};
`;

export const StatusCell = styled.div`
  padding: 0 8px;
  height: 100%;
  display: flex;
  align-items: center;
  border-right: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.BORDER_GREY};
  box-shadow: 1px 0 0 ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_HIGHLIGHT};
  white-space: nowrap;

  &:last-child {
    border-right: none;
    box-shadow: none;
    flex: 1;
  }
`;

/* ---- Performance tab ---- */

export const PerfGrid = styled.div`
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-auto-rows: auto 1fr;
  gap: 10px 12px;
  overflow: auto;
`;

export const GraphBox = styled.fieldset`
  margin: 0;
  border: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.BORDER_GREY};
  padding: 8px;
  background: ${({ theme }) => resolveOSTheme(theme).tokens.SURFACE};

  legend {
    padding: 0 3px;
    font: inherit;
  }
`;

/* A single small green-on-black meter (CPU Usage / PF Usage). */
export const SmallGraph = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
`;

export const WideGraph = styled.div`
  display: flex;
  flex-direction: column;
`;

export const GraphCanvas = styled.canvas`
  display: block;
  background: ${({ theme }) => resolveOSTheme(theme).tokens.BLACK};
  border: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.BORDER_GREY};
`;

export const Readout = styled.div`
  color: ${({ theme }) => resolveOSTheme(theme).tokens.PERF_GRAPH_LINE};
  font: inherit;
`;

/* Totals / memory numeric boxes at the bottom of the Performance tab. */
export const StatsRow = styled.div`
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 12px;
`;

export const StatsBox = styled.fieldset`
  margin: 0;
  border: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.BORDER_GREY};
  padding: 6px 8px;
  background: ${({ theme }) => resolveOSTheme(theme).tokens.SURFACE};

  legend {
    padding: 0 3px;
    font: inherit;
  }
`;

export const StatsLine = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 1px 0;
`;

/* ---- About dialog (Help → About) ---- */

export const AboutOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.25);
  z-index: 20;
`;

export const AboutBox = styled.div`
  min-width: 260px;
  max-width: 320px;
  border: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.BORDER_GREY};
  background: ${({ theme }) => resolveOSTheme(theme).tokens.SURFACE};
  padding: 14px;
  box-shadow: 2px 2px 6px rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const AboutText = styled.div`
  white-space: pre-line;
  line-height: 1.4;
`;

export const AboutActions = styled.div`
  display: flex;
  justify-content: flex-end;
`;
