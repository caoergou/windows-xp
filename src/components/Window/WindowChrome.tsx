import React from 'react';
import styled from 'styled-components';
import { WindowState } from '../../types';
import { WINDOW_DEFAULTS } from '../../constants';
import XPIcon from '../XPIcon';

export const WindowContainer = styled.div<{
  $isFocus?: boolean;
  $minWidth?: number;
  $minHeight?: number;
}>`
  box-sizing: border-box;
  position: absolute;
  display: flex;
  flex-direction: column;
  min-height: ${({ $minHeight }) => $minHeight ?? WINDOW_DEFAULTS.MIN_HEIGHT}px;
  min-width: ${({ $minWidth }) => $minWidth ?? WINDOW_DEFAULTS.MIN_WIDTH}px;
  background-color: #ece9d8;
  box-shadow: ${({ $isFocus }) =>
    $isFocus
      ? 'inset -1px -1px #00138c, inset 1px 1px #0831d9, inset -2px -2px #001ea0, inset 2px 2px #166aee, inset -3px -3px #003bda, inset 3px 3px #0855dd'
      : 'inset -1px -1px #4f648f, inset 1px 1px #7a96df, inset -2px -2px #5a74b9, inset 2px 2px #9aafe5'};
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  padding: 0 0 3px;

  .react-resizable-handle {
    z-index: 1000;
    cursor: se-resize;
  }
`;

export const TitleBar = styled.div<{ $isFocus?: boolean }>`
  box-sizing: border-box;
  height: 28px;
  min-height: 28px;
  max-height: 28px;
  background: ${({ $isFocus }) =>
    $isFocus
      ? 'linear-gradient(to bottom, #0997ff 0%, #0053ee 8%, #0050ee 40%, #0066ff 88%, #0066ff 93%, #005bff 95%, #003dd7 96%, #003dd7 100%)'
      : 'linear-gradient(to bottom, #7697e7 0%,#7e9ee3 3%,#94afe8 6%,#97b4e9 8%,#82a5e4 14%,#7c9fe2 17%,#7996de 25%,#7b99e1 56%,#82a9e9 81%,#80a5e7 89%,#7b96e1 94%,#7a93df 97%,#abbae3 100%)'};
  border-top: 1px solid ${({ $isFocus }) => ($isFocus ? '#0831d9' : '#6d86c7')};
  border-left: 1px solid ${({ $isFocus }) => ($isFocus ? '#0831d9' : '#6d86c7')};
  border-right: 1px solid ${({ $isFocus }) => ($isFocus ? '#001ea0' : '#536da8')};
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 3px 5px 3px 3px;
  cursor: default;
  user-select: none;
  /* Let react-draggable own touch-drags of the window instead of the browser
     scrolling/zooming when a finger drags the title bar (#125). */
  touch-action: none;
  position: relative;
  font-weight: 700;
  font-size: 13px;
  font-family: 'Trebuchet MS', 'Tahoma', 'SimSun', 'Microsoft YaHei', sans-serif;
  text-shadow: 1px 1px #000;
  color: white;
  flex-shrink: 0;

  &:before {
    content: '';
    display: block;
    position: absolute;
    left: 0;
    opacity: ${({ $isFocus }) => ($isFocus ? 1 : 0.3)};
    background: linear-gradient(to right, #1638e6 0%, transparent 100%);
    top: 0;
    bottom: 0;
    width: 15px;
    pointer-events: none;
    border-top-left-radius: 8px;
  }

  &:after {
    content: '';
    opacity: ${({ $isFocus }) => ($isFocus ? 1 : 0.4)};
    display: block;
    position: absolute;
    right: 0;
    background: linear-gradient(to left, #1638e6 0%, transparent 100%);
    top: 0;
    bottom: 0;
    width: 15px;
    pointer-events: none;
    border-top-right-radius: 8px;
  }
`;

const TitleText = styled.div`
  color: white;
  font-weight: bold;
  font-size: 13px;
  font-family: 'Trebuchet MS', 'Tahoma', 'SimSun', 'Microsoft YaHei', sans-serif;
  text-shadow: 1px 1px 1px black;
  display: flex;
  align-items: center;
  pointer-events: none;
  padding-right: 5px;
  letter-spacing: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  z-index: 1;

  .title-icon {
    width: 15px;
    height: 15px;
    margin-left: 1px;
    margin-right: 3px;
    filter: drop-shadow(1px 1px 1px rgba(0, 0, 0, 0.3));
  }
`;

export const WindowBody = styled.div`
  flex: 1;
  background: #ece9d8;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
  margin: 0 3px;
`;

interface WindowChromeProps {
  windowState: WindowState;
  isFocused: boolean;
  isResizable: boolean;
  onFocus: () => void;
  onMaximize: () => void;
  controls: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const WindowChrome: React.FC<WindowChromeProps> = ({
  windowState,
  isFocused,
  isResizable,
  onFocus,
  onMaximize,
  controls,
  children,
  className,
  style,
}) => {
  const { title, icon } = windowState;
  const minWidth = windowState.props.minWidth ?? WINDOW_DEFAULTS.MIN_WIDTH;
  const minHeight = windowState.props.minHeight ?? WINDOW_DEFAULTS.MIN_HEIGHT;

  return (
    <WindowContainer
      data-xp-context-boundary="true"
      $isFocus={isFocused}
      $minWidth={minWidth}
      $minHeight={minHeight}
      className={className}
      style={style}
      onClick={onFocus}
    >
      <TitleBar
        $isFocus={isFocused}
        className="title-bar"
        onDoubleClick={() => isResizable && onMaximize()}
      >
        <TitleText data-testid="window-title">
          <XPIcon name={icon || 'app_window'} size={16} className="title-icon" color="white" />
          {title || ''}
        </TitleText>
        {controls}
      </TitleBar>
      <WindowBody>{children}</WindowBody>
    </WindowContainer>
  );
};

export default WindowChrome;
