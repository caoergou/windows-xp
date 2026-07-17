import styled from 'styled-components';
import { resolveOSTheme } from '../../themes/useOSTheme';
import { xpScrollbarStyles } from '../../theme';

// Explorer styled-components (#163/A).

export const Container = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  font-family: ${({ theme }) => resolveOSTheme(theme).fonts.UI};
`;

/* ── Details view (#120, EXP-02) ── */
export const DetailsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
  font-family: ${({ theme }) => resolveOSTheme(theme).fonts.UI};
  table-layout: fixed;
`;

export const DetailsHeadCell = styled.th`
  text-align: left;
  font-weight: normal;
  background: ${({ theme }) => resolveOSTheme(theme).tokens.TASKPANE_GRADIENT};
  border-right: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.TASKPANE_BORDER};
  border-bottom: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.DIVIDER_GREY};
  padding: 2px 6px;
  height: 18px;
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  /* Keep the column header pinned flush to the top of the list on scroll. */
  position: sticky;
  top: 0;
  z-index: 1;

  &:hover {
    background: ${({ theme }) => resolveOSTheme(theme).tokens.TASKPANE_GRADIENT_BLUE};
  }
`;

export const DetailsRow = styled.tr<{ $selected?: boolean }>`
  background: ${p => (p.$selected ? resolveOSTheme(p.theme).tokens.MENU_HIGHLIGHT : 'transparent')};
  color: ${p =>
    p.$selected ? resolveOSTheme(p.theme).tokens.WHITE : resolveOSTheme(p.theme).tokens.BLACK};
  cursor: default;

  &:hover {
    background: ${p =>
      p.$selected
        ? resolveOSTheme(p.theme).tokens.MENU_HIGHLIGHT
        : resolveOSTheme(p.theme).tokens.EXPLORER_ROW_TINT};
  }
`;

export const DetailsCell = styled.td`
  padding: 1px 6px;
  height: 18px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  border-bottom: 1px solid transparent;
`;

export const DetailsNameCell = styled(DetailsCell)`
  display: flex;
  align-items: center;
  gap: 5px;
`;

export const MainContent = styled.div`
  flex: 1;
  display: flex;
  overflow: hidden;
`;

export const FileArea = styled.div<{ $flush?: boolean }>`
  flex: 1;
  background: white;
  /* Details view (#120) goes edge-to-edge so its column header sits flush at
     the top of the list area, XP-style; the icon grid keeps its padding. */
  padding: ${p => (p.$flush ? '0' : '10px')};
  /* List view lays items out in columns that grow rightward, so allow both
     axes to scroll; wrapping grids never trigger the horizontal bar. */
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: ${p => (p.$flush ? '0' : '10px')};
  ${xpScrollbarStyles}
`;

export const GroupHeader = styled.div`
  font-weight: bold;
  font-size: 11px;
  color: ${({ theme }) => resolveOSTheme(theme).tokens.SIDEBAR_TITLE_BLUE};
  border-bottom: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.EXPLORER_HEADER_DIVIDER};
  padding-bottom: 2px;
  margin-bottom: 5px;
  margin-top: 10px;

  &:first-child {
    margin-top: 0;
  }
`;

/* ── Thumbnails view (#211): ~96px preview boxes, name below.
   Colors come from theme tokens / rgba() to keep the inline-hex ratchet flat. ── */
export const ThumbsGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  gap: 10px 8px;
`;

export const ThumbItem = styled.div`
  width: 110px;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
`;

export const ThumbBox = styled.div`
  width: 96px;
  height: 96px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_HIGHLIGHT};
  border: 1px solid rgba(0, 0, 0, 0.35);
  box-shadow: inset 0 0 0 1px ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_HIGHLIGHT};
  overflow: hidden;

  img {
    max-width: 88px;
    max-height: 88px;
    display: block;
  }
`;

export const ThumbName = styled.span<{ $selected?: boolean }>`
  margin-top: 4px;
  max-width: 108px;
  padding: 1px 4px;
  font-size: 11px;
  text-align: center;
  word-break: break-word;
  ${p =>
    p.$selected
      ? `background:${resolveOSTheme(p.theme).tokens.MENU_HIGHLIGHT};color:${resolveOSTheme(p.theme).tokens.BUTTON_HIGHLIGHT};`
      : ''}
`;

/* ── Icons view (#211): 32px icon on top, name centred below ── */
export const IconsVGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  gap: 6px 4px;
`;

export const IconVItem = styled.div`
  width: 76px;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
`;

export const IconVName = styled.span<{ $selected?: boolean }>`
  margin-top: 3px;
  max-width: 74px;
  padding: 1px 3px;
  font-size: 11px;
  text-align: center;
  word-break: break-word;
  ${p =>
    p.$selected
      ? `background:${resolveOSTheme(p.theme).tokens.MENU_HIGHLIGHT};color:${resolveOSTheme(p.theme).tokens.BUTTON_HIGHLIGHT};`
      : ''}
`;

/* ── List view (#211): 16px icon + name, column-major wrap ── */
export const ListGrid = styled.div`
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  align-content: flex-start;
  height: 100%;
`;

export const ListItem = styled.div<{ $selected?: boolean }>`
  width: 190px;
  height: 17px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 3px;
  cursor: pointer;

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 11px;
    padding: 0 2px;
    ${p =>
      p.$selected
        ? `background:${resolveOSTheme(p.theme).tokens.MENU_HIGHLIGHT};color:${resolveOSTheme(p.theme).tokens.BUTTON_HIGHLIGHT};`
        : ''}
  }
`;

/* ── Tiles view (#211): 48px icon, name + type/size, two per row ── */
export const TilesGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  gap: 4px 8px;
`;

export const TileItem = styled.div<{ $selected?: boolean }>`
  width: 240px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px;
  cursor: pointer;
  border: 1px solid transparent;

  &:hover {
    background-color: ${p =>
      p.$selected ? resolveOSTheme(p.theme).tokens.MENU_HIGHLIGHT : 'rgba(49, 106, 197, 0.12)'};
    border-color: ${p =>
      p.$selected ? resolveOSTheme(p.theme).tokens.MENU_HIGHLIGHT : 'rgba(49, 106, 197, 0.3)'};
  }

  ${p =>
    p.$selected &&
    `
      background-color: ${resolveOSTheme(p.theme).tokens.MENU_HIGHLIGHT};
      color: ${resolveOSTheme(p.theme).tokens.BUTTON_HIGHLIGHT};
      border-color: ${resolveOSTheme(p.theme).tokens.MENU_HIGHLIGHT};
    `}
`;

export const TileMeta = styled.span<{ $selected?: boolean }>`
  font-size: 10px;
  color: ${p => (p.$selected ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.55)')};
`;

export const StatusBar = styled.div`
  height: 20px;
  background: ${({ theme }) => resolveOSTheme(theme).tokens.SURFACE};
  border-top: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.GREY_D0};
  display: flex;
  align-items: center;
  padding: 0 5px;
  font-size: 11px;
  color: ${({ theme }) => resolveOSTheme(theme).tokens.BLACK};
`;

export const EmptyRecycleBinMessage = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_SHADOW};
  font-size: 12px;
  font-family: ${({ theme }) => resolveOSTheme(theme).fonts.UI};
  gap: 10px;
  user-select: none;
`;
