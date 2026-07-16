import styled from 'styled-components';
import { COLORS, FONTS } from '../../constants';

// Desktop styled-components (#163/A — split out of Desktop.tsx).

export const DesktopContainer = styled.div<{ $bgUrl: string }>`
  width: 100%;
  height: 100%;
  background-color: #004e98;
  background-image: url(${props => props.$bgUrl});
  background-size: cover;
  background-position: center;
  position: relative;
  overflow: hidden;
  /* Own touch gestures on the desktop plane: no double-tap zoom or the 300ms
     click delay; long-press is handled in JS, not by the native callout (#125). */
  touch-action: manipulation;
`;

export const SelectionBox = styled.div<{
  $left: number;
  $top: number;
  $width: number;
  $height: number;
}>`
  position: absolute;
  left: ${props => props.$left}px;
  top: ${props => props.$top}px;
  width: ${props => props.$width}px;
  height: ${props => props.$height}px;
  border: 1px dotted ${COLORS.WHITE};
  background-color: rgba(49, 106, 197, 0.3);
  pointer-events: none;
  z-index: 1000;
  box-sizing: border-box;
`;

export const IconGrid = styled.div`
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  height: calc(100% - 30px);
  padding: 10px;
  gap: 0px;
  align-content: flex-start;
`;

export const DesktopIcon = styled.div<{ $selected?: boolean }>`
  width: 80px;
  height: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  padding: 4px 2px;
  margin: 2px;
  border: 1px solid transparent;
  color: white;
  position: relative;
  box-sizing: border-box;
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
  -webkit-touch-callout: none;

  ${props =>
    props.$selected &&
    `
    background-color: rgba(49, 106, 197, 0.55);
    border: 1px dotted rgba(255, 255, 255, 0.9);
  `}

  &:hover {
    ${props =>
      !props.$selected &&
      `
      background-color: rgba(49, 106, 197, 0.3);
      border: 1px dotted rgba(255, 255, 255, 0.5);
    `}
  }

  .icon-wrapper {
    position: relative;
    margin-bottom: 4px;
    filter: drop-shadow(2px 2px 3px rgba(0, 0, 0, 0.7));
  }

  .icon-label {
    font-size: 11px;
    font-family: ${FONTS.UI};
    text-align: center;
    max-width: 100%;
    display: block;
    width: fit-content;
    margin: 0 auto;
    overflow: hidden;
    word-break: break-word;
    line-height: 1.2;
    color: white;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
    padding: 0 1px;
    user-select: none;
    -webkit-user-select: none;
    pointer-events: none;

    &::selection {
      background: transparent;
    }

    ${props =>
      props.$selected &&
      `
      color: ${COLORS.WHITE};
      text-shadow: none;
    `}
  }
`;
