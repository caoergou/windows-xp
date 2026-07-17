import styled from 'styled-components';
import { resolveOSTheme } from '../../themes/useOSTheme';
import { CELL_SIZE } from './constants';

// Minesweeper styled-components (#163/A).

export const Wrap = styled.div`
  position: relative;
  width: fit-content;
  align-self: flex-start;
  background: ${({ theme }) => resolveOSTheme(theme).tokens.SURFACE};
  color: ${({ theme }) => resolveOSTheme(theme).tokens.BLACK};
  font-family: ${({ theme }) => resolveOSTheme(theme).fonts.UI};
  font-size: 11px;
  line-height: 1;
  user-select: none;
  box-sizing: border-box;

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  img {
    image-rendering: pixelated;
  }
`;

export const MenuCheck = styled.img`
  width: 7px;
  height: 7px;
  image-rendering: pixelated;
`;

export const GamePanel = styled.section`
  padding: 5px;
  border-top: 3px solid ${({ theme }) => resolveOSTheme(theme).tokens.GREY_F5};
  border-left: 3px solid ${({ theme }) => resolveOSTheme(theme).tokens.GREY_F5};
  background: ${({ theme }) => resolveOSTheme(theme).tokens.GREY_C0};
  box-sizing: border-box;
`;

export const ScoreBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 34px;
  margin-bottom: 5px;
  padding: 3px 7px 3px 4px;
  border: 2px solid;
  border-color: ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_SHADOW} ${({ theme }) => resolveOSTheme(theme).tokens.GREY_F5} ${({ theme }) => resolveOSTheme(theme).tokens.GREY_F5} ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_SHADOW};
`;

export const Counter = styled.div`
  display: flex;
  width: 40px;
  height: 24px;
  overflow: hidden;
  border-width: 0 1px 1px 0;
  border-style: solid;
  border-color: ${({ theme }) => resolveOSTheme(theme).tokens.WHITE};
`;

export const Digit = styled.img`
  display: block;
  width: 13px;
  height: 23px;
  flex: 0 0 13px;
  image-rendering: pixelated;
`;

export const FaceOuter = styled.div`
  width: 24px;
  height: 24px;
  border-top: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_SHADOW};
  border-left: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_SHADOW};
  transform: translateX(1px);
`;

export const FaceButton = styled.button`
  display: flex;
  width: 24px;
  height: 24px;
  min-width: 24px;
  max-width: 24px;
  min-height: 24px;
  max-height: 24px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 2px solid;
  border-color: ${({ theme }) => resolveOSTheme(theme).tokens.GREY_F5} ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_SHADOW} ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_SHADOW} ${({ theme }) => resolveOSTheme(theme).tokens.GREY_F5};
  outline: none;
  background: ${({ theme }) => resolveOSTheme(theme).tokens.GREY_C0};
  cursor: default;

  &:active {
    border-width: 1px;
    border-color: ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_SHADOW};
  }

  &:active img {
    transform: translate(1px, 1px);
  }
`;

export const FaceIcon = styled.img`
  width: 17px;
  height: 17px;
  image-rendering: pixelated;
`;

export const Board = styled.div<{ $cols: number; $rows: number }>`
  display: grid;
  grid-template-columns: repeat(${props => props.$cols}, ${CELL_SIZE}px);
  grid-template-rows: repeat(${props => props.$rows}, ${CELL_SIZE}px);
  border: 3px solid;
  border-color: ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_SHADOW} ${({ theme }) => resolveOSTheme(theme).tokens.GREY_F5} ${({ theme }) => resolveOSTheme(theme).tokens.GREY_F5} ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_SHADOW};
  background: ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_SHADOW};
  line-height: 0;
  overflow: hidden;
`;

export const Cell = styled.button<{ $covered: boolean }>`
  position: relative;
  display: block;
  width: ${CELL_SIZE}px;
  height: ${CELL_SIZE}px;
  min-width: ${CELL_SIZE}px;
  max-width: ${CELL_SIZE}px;
  min-height: ${CELL_SIZE}px;
  max-height: ${CELL_SIZE}px;
  margin: 0;
  padding: 0;
  border: 0;
  outline: 0;
  background: ${({ theme }) => resolveOSTheme(theme).tokens.GREY_C0};
  appearance: none;
  -webkit-appearance: none;
  cursor: default;
  line-height: 0;
`;

export const CoveredBackground = styled.span`
  position: absolute;
  inset: 0;
  display: block;
  width: ${CELL_SIZE}px;
  height: ${CELL_SIZE}px;
  background: ${({ theme }) => resolveOSTheme(theme).tokens.GREY_C0};
  border: 2px solid;
  border-color: ${({ theme }) => resolveOSTheme(theme).tokens.GREY_F5} ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_SHADOW} ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_SHADOW} ${({ theme }) => resolveOSTheme(theme).tokens.GREY_F5};
`;

export const RevealedBackground = styled.span`
  position: absolute;
  inset: 0;
  display: block;
  width: ${CELL_SIZE}px;
  height: ${CELL_SIZE}px;
  background: ${({ theme }) => resolveOSTheme(theme).tokens.GREY_C0};
  border-top: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_SHADOW};
  border-left: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_SHADOW};
`;

export const CellIcon = styled.img`
  position: absolute;
  inset: 0;
  display: block;
  width: 16px;
  height: 16px;
  image-rendering: pixelated;
  pointer-events: none;
`;

export const AboutDialog = styled.div`
  position: absolute;
  z-index: 30;
  top: 28px;
  left: 50%;
  width: 220px;
  transform: translateX(-50%);
  border: 2px solid;
  border-color: ${({ theme }) => resolveOSTheme(theme).tokens.WHITE} ${({ theme }) => resolveOSTheme(theme).tokens.GREY_40} ${({ theme }) => resolveOSTheme(theme).tokens.GREY_40} ${({ theme }) => resolveOSTheme(theme).tokens.WHITE};
  background: ${({ theme }) => resolveOSTheme(theme).tokens.BORDER_GREY_HILIGHT};
  box-shadow: 2px 2px 1px ${({ theme }) => resolveOSTheme(theme).tokens.GREY_64};
`;

export const AboutTitle = styled.div`
  padding: 4px 6px;
  color: ${({ theme }) => resolveOSTheme(theme).tokens.WHITE};
  background: ${({ theme }) => resolveOSTheme(theme).tokens.TITLE_BAR_GRADIENT_COMPACT};
  font-weight: bold;
`;

export const AboutContent = styled.div`
  padding: 16px 14px 12px;
  white-space: pre-line;
  line-height: 1.45;
`;

export const AboutActions = styled.div`
  display: flex;
  justify-content: center;
  padding: 0 0 12px;
`;

export const DialogButton = styled.button`
  min-width: 72px;
  height: 23px;
  border: 2px solid;
  border-color: ${({ theme }) => resolveOSTheme(theme).tokens.WHITE} ${({ theme }) => resolveOSTheme(theme).tokens.GREY_40} ${({ theme }) => resolveOSTheme(theme).tokens.GREY_40} ${({ theme }) => resolveOSTheme(theme).tokens.WHITE};
  background: ${({ theme }) => resolveOSTheme(theme).tokens.BORDER_GREY_HILIGHT};
  font: inherit;

  &:active {
    border-color: ${({ theme }) => resolveOSTheme(theme).tokens.GREY_40} ${({ theme }) => resolveOSTheme(theme).tokens.WHITE} ${({ theme }) => resolveOSTheme(theme).tokens.WHITE} ${({ theme }) => resolveOSTheme(theme).tokens.GREY_40};
  }
`;
