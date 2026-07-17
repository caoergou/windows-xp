import React from 'react';
import styled from 'styled-components';
import { WindowState } from '../../types';
import { WINDOW_DEFAULTS } from '../../constants';
import { resolveOSTheme } from '../../themes/useOSTheme';
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
  background-color: ${({ theme }) => resolveOSTheme(theme).tokens.SURFACE};
  box-shadow: ${({ $isFocus, theme }) =>
    $isFocus
      ? resolveOSTheme(theme).tokens.WINDOW_FRAME_SHADOW_ACTIVE
      : resolveOSTheme(theme).tokens.WINDOW_FRAME_SHADOW_INACTIVE};
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  padding: 0 0 3px;

  .react-resizable-handle {
    z-index: 1000;
  }
`;

export const TitleBar = styled.div<{ $isFocus?: boolean }>`
  box-sizing: border-box;
  height: 28px;
  min-height: 28px;
  max-height: 28px;
  background: ${({ $isFocus, theme }) =>
    $isFocus
      ? resolveOSTheme(theme).tokens.TITLE_BAR_GRADIENT
      : resolveOSTheme(theme).tokens.WINDOW_TITLE_INACTIVE};
  border-top: 1px solid
    ${({ $isFocus, theme }) =>
      $isFocus
        ? resolveOSTheme(theme).tokens.WINDOW_BORDER_ACTIVE
        : resolveOSTheme(theme).tokens.WINDOW_BORDER_INACTIVE};
  border-left: 1px solid
    ${({ $isFocus, theme }) =>
      $isFocus
        ? resolveOSTheme(theme).tokens.WINDOW_BORDER_ACTIVE
        : resolveOSTheme(theme).tokens.WINDOW_BORDER_INACTIVE};
  border-right: 1px solid
    ${({ $isFocus, theme }) =>
      $isFocus
        ? resolveOSTheme(theme).tokens.WINDOW_BORDER_ACTIVE_DARK
        : resolveOSTheme(theme).tokens.WINDOW_BORDER_INACTIVE_DARK};
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
  font-family: ${({ theme }) => resolveOSTheme(theme).fonts.TITLEBAR};
  text-shadow: 1px 1px ${({ theme }) => resolveOSTheme(theme).tokens.BLACK};
  color: white;
  flex-shrink: 0;

  &:before {
    content: '';
    display: block;
    position: absolute;
    left: 0;
    opacity: ${({ $isFocus }) => ($isFocus ? 1 : 0.3)};
    background: linear-gradient(
      to right,
      ${({ theme }) => resolveOSTheme(theme).tokens.TITLE_BAR_GLOW} 0%,
      transparent 100%
    );
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
    background: linear-gradient(
      to left,
      ${({ theme }) => resolveOSTheme(theme).tokens.TITLE_BAR_GLOW} 0%,
      transparent 100%
    );
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
  font-family: ${({ theme }) => resolveOSTheme(theme).fonts.TITLEBAR};
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
  background: ${({ theme }) => resolveOSTheme(theme).tokens.SURFACE};
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
  // Field-level fallback: a malformed persisted record (e.g. missing `props`)
  // must not throw here and white-screen the whole desktop (#223).
  const minWidth = windowState.props?.minWidth ?? WINDOW_DEFAULTS.MIN_WIDTH;
  const minHeight = windowState.props?.minHeight ?? WINDOW_DEFAULTS.MIN_HEIGHT;

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
