import React from 'react';
import styled from 'styled-components';
import { WindowState } from '../../types';
import { WINDOW_DEFAULTS } from '../../constants';
import XPIcon from '../XPIcon';

export const WindowContainer = styled.div<{ $isFocus?: boolean; $minWidth?: number; $minHeight?: number }>`
  box-sizing: border-box;
  position: absolute;
  display: flex;
  flex-direction: column;
  min-height: ${({ $minHeight }) => $minHeight ?? WINDOW_DEFAULTS.MIN_HEIGHT}px;
  min-width: ${({ $minWidth }) => $minWidth ?? WINDOW_DEFAULTS.MIN_WIDTH}px;
  background-color: ${({ $isFocus }) => ($isFocus ? '#0831d9' : '#6582f5')};
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  padding: 3px;

  .react-resizable-handle {
    z-index: 1000;
    cursor: se-resize;
  }
`;

export const TitleBar = styled.div<{ $isFocus?: boolean }>`
  height: 25px;
  min-height: 25px;
  max-height: 25px;
  background: ${({ $isFocus }) =>
    $isFocus
      ? 'linear-gradient(to bottom,#0058ee 0%,#3593ff 4%,#288eff 6%,#127dff 8%,#036ffc 10%,#0262ee 14%,#0057e5 20%,#0054e3 24%,#0055eb 56%,#005bf5 66%,#026afe 76%,#0062ef 86%,#0052d6 92%,#0040ab 94%,#003092 100%)'
      : 'linear-gradient(to bottom, #7697e7 0%,#7e9ee3 3%,#94afe8 6%,#97b4e9 8%,#82a5e4 14%,#7c9fe2 17%,#7996de 25%,#7b99e1 56%,#82a9e9 81%,#80a5e7 89%,#7b96e1 94%,#7a93df 97%,#abbae3 100%)'};
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 3px 0 5px;
  cursor: default;
  user-select: none;
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
  letter-spacing: 0.5px;
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
