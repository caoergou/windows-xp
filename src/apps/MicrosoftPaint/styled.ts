import styled from 'styled-components';
import { COLORS, FONTS } from '../../constants';

// MicrosoftPaint styled-components (#163/A).

export const Wrap = styled.div`
  width: 100%;
  height: 100%;
  background: ${COLORS.SURFACE};
  display: flex;
  flex-direction: column;
  padding: 6px;
  box-sizing: border-box;
  font-family: ${FONTS.UI};
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
  background: linear-gradient(to bottom, ${COLORS.GREY_F0} 0%, ${COLORS.GREY_E0} 100%);
  border-bottom: 1px solid ${COLORS.BUTTON_SHADOW};
  display: flex;
  align-items: center;
  padding: 0 2px;
  font-size: 11px;
  font-family: ${FONTS.UI};
  flex-shrink: 0;
  margin: -6px -6px 6px -6px;
`;

export const MenuItemWrapper = styled.div`
  position: relative;
`;

export const MenuItem = styled.div<{ $active?: boolean }>`
  padding: 2px 8px;
  cursor: pointer;
  background: ${p => (p.$active ? COLORS.MENU_HIGHLIGHT : 'transparent')};
  color: ${p => (p.$active ? 'white' : 'inherit')};

  &:hover {
    background: ${COLORS.MENU_HIGHLIGHT};
    color: white;
  }
`;

export const DropdownMenu = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  min-width: 160px;
  background: ${COLORS.GREY_F0};
  border: 1px solid ${COLORS.BLACK};
  box-shadow: 2px 2px 0px ${COLORS.BUTTON_SHADOW};
  padding: 2px 0;
  z-index: 9999;
  font-size: 12px;
  font-family: ${FONTS.UI};
`;

export const DropdownItem = styled.div<{ $disabled?: boolean }>`
  padding: 3px 24px 3px 24px;
  cursor: ${p => (p.$disabled ? 'default' : 'pointer')};
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: ${p => (p.$disabled ? COLORS.GREY_A0 : COLORS.BLACK)};
  position: relative;
  white-space: nowrap;

  &:hover {
    background: ${p => (p.$disabled ? 'transparent' : COLORS.MENU_HIGHLIGHT)};
    color: ${p => (p.$disabled ? COLORS.GREY_A0 : 'white')};
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
  background: ${COLORS.BUTTON_SHADOW};
  margin: 3px 2px;
`;

export const Toolbar = styled.div`
  display: flex;
  gap: 4px;
  margin-bottom: 6px;
  padding: 4px;
  background: ${COLORS.SURFACE};
  border: 1px solid;
  border-color: ${COLORS.WHITE} ${COLORS.BUTTON_SHADOW} ${COLORS.BUTTON_SHADOW} ${COLORS.WHITE};
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
  border-color: ${COLORS.WHITE} ${COLORS.BUTTON_SHADOW} ${COLORS.BUTTON_SHADOW} ${COLORS.WHITE};
  outline: none;
  background: ${COLORS.SURFACE};
  display: flex;
  align-items: center;
  justify-content: center;

  &:active {
    border-color: ${COLORS.BUTTON_SHADOW} ${COLORS.WHITE} ${COLORS.WHITE} ${COLORS.BUTTON_SHADOW};
    padding-top: 1px;
    padding-left: 1px;
  }

  &.active {
    background: ${COLORS.WORKSPACE_BLUE};
    color: ${COLORS.WHITE};
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
  border: 2px solid ${p => (p.$active ? COLORS.ERROR_RED : COLORS.BUTTON_SHADOW)};
  background: ${p => p.$color};
  cursor: pointer;
`;

export const CanvasWrapper = styled.div`
  flex: 1;
  background: ${COLORS.WHITE};
  border: 2px inset ${COLORS.BUTTON_SHADOW};
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
`;

export const Canvas = styled.canvas`
  background: ${COLORS.WHITE};
`;
