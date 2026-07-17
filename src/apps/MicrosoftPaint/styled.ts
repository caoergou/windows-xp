import styled from 'styled-components';
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

export const MenuBar = styled.div`
  height: 20px;
  background: linear-gradient(
    to bottom,
    ${({ theme }) => resolveOSTheme(theme).tokens.GREY_F0} 0%,
    ${({ theme }) => resolveOSTheme(theme).tokens.GREY_E0} 100%
  );
  border-bottom: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_SHADOW};
  display: flex;
  align-items: center;
  padding: 0 2px;
  font-size: 11px;
  font-family: ${({ theme }) => resolveOSTheme(theme).fonts.UI};
  flex-shrink: 0;
  margin: -6px -6px 6px -6px;
`;

export const MenuItemWrapper = styled.div`
  position: relative;
`;

export const MenuItem = styled.div<{ $active?: boolean }>`
  padding: 2px 8px;
  cursor: pointer;
  background: ${p => (p.$active ? resolveOSTheme(p.theme).tokens.MENU_HIGHLIGHT : 'transparent')};
  color: ${p => (p.$active ? 'white' : 'inherit')};

  &:hover {
    background: ${({ theme }) => resolveOSTheme(theme).tokens.MENU_HIGHLIGHT};
    color: white;
  }
`;

export const DropdownMenu = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  min-width: 160px;
  background: ${({ theme }) => resolveOSTheme(theme).tokens.GREY_F0};
  border: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.BLACK};
  box-shadow: 2px 2px 0px ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_SHADOW};
  padding: 2px 0;
  z-index: 9999;
  font-size: 12px;
  font-family: ${({ theme }) => resolveOSTheme(theme).fonts.UI};
`;

export const DropdownItem = styled.div<{ $disabled?: boolean }>`
  padding: 3px 24px 3px 24px;
  cursor: ${p => (p.$disabled ? 'default' : 'pointer')};
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: ${p =>
    p.$disabled ? resolveOSTheme(p.theme).tokens.GREY_A0 : resolveOSTheme(p.theme).tokens.BLACK};
  position: relative;
  white-space: nowrap;

  &:hover {
    background: ${p =>
      p.$disabled ? 'transparent' : resolveOSTheme(p.theme).tokens.MENU_HIGHLIGHT};
    color: ${p => (p.$disabled ? resolveOSTheme(p.theme).tokens.GREY_A0 : 'white')};
  }

  .shortcut {
    margin-left: 24px;
    font-size: 11px;
    color: inherit;
    opacity: 0.8;
  }
`;

export const DropdownSeparator = styled.div`
  height: 1px;
  background: ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_SHADOW};
  margin: 3px 2px;
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
