import styled from 'styled-components';
import { xpScrollbarStyles } from '../../theme';

// Explorer styled-components (#163/A).

export const Container = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  font-family: 'Tahoma', 'SimSun', 'Microsoft YaHei', sans-serif;
`;

/* ── Details view (#120, EXP-02) ── */
export const DetailsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
  font-family: 'Tahoma', 'SimSun', 'Microsoft YaHei', sans-serif;
  table-layout: fixed;
`;

export const DetailsHeadCell = styled.th`
  text-align: left;
  font-weight: normal;
  background: linear-gradient(to bottom, #ffffff 0%, #f2f1ea 45%, #e7e5d8 100%);
  border-right: 1px solid #d5d2c6;
  border-bottom: 1px solid #aca899;
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
    background: linear-gradient(to bottom, #ffffff 0%, #eef4fb 45%, #dce9f8 100%);
  }
`;

export const DetailsRow = styled.tr<{ $selected?: boolean }>`
  background: ${p => (p.$selected ? '#316AC5' : 'transparent')};
  color: ${p => (p.$selected ? '#fff' : '#000')};
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
  overflow-y: auto;
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

export const IconsGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
`;

export const FileItem = styled.div<{ $selected?: boolean }>`
  width: 250px; /* List view style often seen in My Computer */
  display: flex;
  align-items: center;
  padding: 3px;
  cursor: pointer;
  border: 1px solid transparent;

  &:hover {
    background-color: #e8f4ff;
    border: 1px solid #c0deff;
  }

  ${props =>
    props.$selected &&
    `
        background-color: #316AC5;
        color: white;
        border: 1px dotted #fff;

        &:hover {
            background-color: #316AC5;
            color: white;
        }
    `}
`;

export const IconWrapper = styled.div`
  margin-right: 5px;
  position: relative;
  flex-shrink: 0;
`;

export const FileInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

export const FileName = styled.span<{ $isDrive?: boolean }>`
  font-size: 11px;
  font-weight: ${props => (props.$isDrive ? 'bold' : 'normal')};
`;

export const FileType = styled.span<{ $selected?: boolean }>`
  font-size: 10px;
  color: #666;
  ${props => props.$selected && `color: #eee;`}
`;

export const StatusBar = styled.div`
  height: 20px;
  background: #ece9d8;
  border-top: 1px solid #d0d0d0;
  display: flex;
  align-items: center;
  padding: 0 5px;
  font-size: 11px;
  color: #000;
`;

export const EmptyRecycleBinMessage = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #808080;
  font-size: 12px;
  font-family: 'Tahoma', 'SimSun', 'Microsoft YaHei', sans-serif;
  gap: 10px;
  user-select: none;
`;

