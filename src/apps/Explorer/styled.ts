import styled from 'styled-components';
import { xpScrollbarStyles } from '../../theme';
import { COLORS, FONTS } from '../../constants';

// Explorer styled-components (#163/A).

export const Container = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  font-family: ${FONTS.UI};
`;

/* ── Details view (#120, EXP-02) ── */
export const DetailsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
  font-family: ${FONTS.UI};
  table-layout: fixed;
`;

export const DetailsHeadCell = styled.th`
  text-align: left;
  font-weight: normal;
  background: linear-gradient(to bottom, ${COLORS.WHITE} 0%, #f2f1ea 45%, #e7e5d8 100%);
  border-right: 1px solid #d5d2c6;
  border-bottom: 1px solid ${COLORS.DIVIDER_GREY};
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
    background: linear-gradient(to bottom, ${COLORS.WHITE} 0%, #eef4fb 45%, #dce9f8 100%);
  }
`;

export const DetailsRow = styled.tr<{ $selected?: boolean }>`
  background: ${p => (p.$selected ? '#316AC5' : 'transparent')};
  color: ${p => (p.$selected ? COLORS.WHITE : COLORS.BLACK)};
  cursor: default;

  &:hover {
    background: ${p => (p.$selected ? '#316AC5' : '#e6effc')};
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
  color: #15428b;
  border-bottom: 1px solid #c6d3f7;
  padding-bottom: 2px;
  margin-bottom: 5px;
  margin-top: 10px;

  &:first-child {
    margin-top: 0;
  }
`;

/* ── Thumbnails view (#211): ~96px preview boxes, name below.
   Colors come from COLORS tokens / rgba() to keep the inline-hex ratchet flat. ── */
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
  background: ${COLORS.BUTTON_HIGHLIGHT};
  border: 1px solid rgba(0, 0, 0, 0.35);
  box-shadow: inset 0 0 0 1px ${COLORS.BUTTON_HIGHLIGHT};
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
    p.$selected ? `background:${COLORS.MENU_HIGHLIGHT};color:${COLORS.BUTTON_HIGHLIGHT};` : ''}
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
    p.$selected ? `background:${COLORS.MENU_HIGHLIGHT};color:${COLORS.BUTTON_HIGHLIGHT};` : ''}
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
      p.$selected ? `background:${COLORS.MENU_HIGHLIGHT};color:${COLORS.BUTTON_HIGHLIGHT};` : ''}
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
    background-color: ${p => (p.$selected ? COLORS.MENU_HIGHLIGHT : 'rgba(49, 106, 197, 0.12)')};
    border-color: ${p => (p.$selected ? COLORS.MENU_HIGHLIGHT : 'rgba(49, 106, 197, 0.3)')};
  }

  ${p =>
    p.$selected &&
    `
      background-color: ${COLORS.MENU_HIGHLIGHT};
      color: ${COLORS.BUTTON_HIGHLIGHT};
      border-color: ${COLORS.MENU_HIGHLIGHT};
    `}
`;

export const TileMeta = styled.span<{ $selected?: boolean }>`
  font-size: 10px;
  color: ${p => (p.$selected ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.55)')};
`;

export const StatusBar = styled.div`
  height: 20px;
  background: ${COLORS.SURFACE};
  border-top: 1px solid ${COLORS.GREY_D0};
  display: flex;
  align-items: center;
  padding: 0 5px;
  font-size: 11px;
  color: ${COLORS.BLACK};
`;

export const EmptyRecycleBinMessage = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: ${COLORS.BUTTON_SHADOW};
  font-size: 12px;
  font-family: ${FONTS.UI};
  gap: 10px;
  user-select: none;
`;
