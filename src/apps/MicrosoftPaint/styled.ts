import styled from 'styled-components';
import { XPMenuBar } from '../../components/XPMenuBar';
import { resolveOSTheme } from '../../themes/useOSTheme';

// MicrosoftPaint styled-components (#163/A).

export const Wrap = styled.div`
  width: 100%;
  height: 100%;
  background: ${({ theme }) => resolveOSTheme(theme).tokens.SURFACE};
  display: flex;
  flex-direction: column;
  padding: 6px;
  box-sizing: border-box;
  font-family: ${({ theme }) => resolveOSTheme(theme).fonts.UI};
  font-size: 12px;
  user-select: none;

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }
`;

/* Menu bar: the shared XPMenuBar surface (#99/#78). The previous local bar used
   a light-grey gradient with a hard bottom divider — real mspaint under Luna has
   neither. The negative margins span Wrap's padding. */
export const MenuBar = styled(XPMenuBar)`
  margin: -6px -6px 6px -6px;
`;

export const Toolbar = styled.div`
  display: flex;
  gap: 4px;
  margin-bottom: 6px;
  padding: 4px;
  background: ${({ theme }) => resolveOSTheme(theme).tokens.SURFACE};
  border: 1px solid;
  border-color: ${({ theme }) => resolveOSTheme(theme).tokens.WHITE}
    ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_SHADOW}
    ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_SHADOW}
    ${({ theme }) => resolveOSTheme(theme).tokens.WHITE};
  overflow: hidden;
  box-sizing: border-box;
`;

export const ToolBtn = styled.button`
  width: 28px;
  height: 28px;
  flex: 0 0 28px;
  cursor: pointer;
  font-size: 12px;
  font-family: inherit;
  border: 1px solid;
  border-color: ${({ theme }) => resolveOSTheme(theme).tokens.WHITE}
    ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_SHADOW}
    ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_SHADOW}
    ${({ theme }) => resolveOSTheme(theme).tokens.WHITE};
  outline: none;
  background: ${({ theme }) => resolveOSTheme(theme).tokens.SURFACE};
  display: flex;
  align-items: center;
  justify-content: center;

  &:active {
    border-color: ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_SHADOW}
      ${({ theme }) => resolveOSTheme(theme).tokens.WHITE}
      ${({ theme }) => resolveOSTheme(theme).tokens.WHITE}
      ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_SHADOW};
    padding-top: 1px;
    padding-left: 1px;
  }

  &.active {
    background: ${({ theme }) => resolveOSTheme(theme).tokens.WORKSPACE_BLUE};
    color: ${({ theme }) => resolveOSTheme(theme).tokens.WHITE};
  }
`;

export const ColorPicker = styled.div`
  display: flex;
  gap: 2px;
  margin-left: auto;
  align-items: center;
  justify-content: flex-end;
  min-width: 0;
  overflow: hidden;
`;

export const ColorSwatch = styled.div<{ $color: string; $active: boolean }>`
  width: 24px;
  height: 24px;
  flex: 0 0 24px;
  box-sizing: border-box;
  border: 2px solid
    ${p =>
      p.$active
        ? resolveOSTheme(p.theme).tokens.ERROR_RED
        : resolveOSTheme(p.theme).tokens.BUTTON_SHADOW};
  background: ${p => p.$color};
  cursor: pointer;
`;

export const CanvasWrapper = styled.div`
  flex: 1;
  background: ${({ theme }) => resolveOSTheme(theme).tokens.WHITE};
  border: 2px inset ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_SHADOW};
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
`;

export const Canvas = styled.canvas`
  background: ${({ theme }) => resolveOSTheme(theme).tokens.WHITE};
`;
