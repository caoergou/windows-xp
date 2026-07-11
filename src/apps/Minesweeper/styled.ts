import styled from 'styled-components';
import { CELL_SIZE } from './constants';

// Minesweeper styled-components (#163/A).

export const Wrap = styled.div`
  position: relative;
  width: fit-content;
  align-self: flex-start;
  background: #ece9d8;
  color: #000;
  font-family: Tahoma, 'SimSun', 'Microsoft YaHei', sans-serif;
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
  border-top: 3px solid #f5f5f5;
  border-left: 3px solid #f5f5f5;
  background: #c0c0c0;
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
  border-color: #808080 #f5f5f5 #f5f5f5 #808080;
`;

export const Counter = styled.div`
  display: flex;
  width: 40px;
  height: 24px;
  overflow: hidden;
  border-width: 0 1px 1px 0;
  border-style: solid;
  border-color: #fff;
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
  border-top: 1px solid #808080;
  border-left: 1px solid #808080;
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
  border-color: #f5f5f5 #808080 #808080 #f5f5f5;
  outline: none;
  background: #c0c0c0;
  cursor: default;

  &:active {
    border-width: 1px;
    border-color: #808080;
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
  border-color: #808080 #f5f5f5 #f5f5f5 #808080;
  background: #808080;
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
  background: #c0c0c0;
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
  background: #c0c0c0;
  border: 2px solid;
  border-color: #f5f5f5 #808080 #808080 #f5f5f5;
`;

export const RevealedBackground = styled.span`
  position: absolute;
  inset: 0;
  display: block;
  width: ${CELL_SIZE}px;
  height: ${CELL_SIZE}px;
  background: #c0c0c0;
  border-top: 1px solid #808080;
  border-left: 1px solid #808080;
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
  border-color: #fff #404040 #404040 #fff;
  background: #d4d0c8;
  box-shadow: 2px 2px 1px #646464;
`;

export const AboutTitle = styled.div`
  padding: 4px 6px;
  color: #fff;
  background: linear-gradient(to right, #0997ff, #0053ee);
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
  border-color: #fff #404040 #404040 #fff;
  background: #d4d0c8;
  font: inherit;

  &:active {
    border-color: #404040 #fff #fff #404040;
  }
`;
