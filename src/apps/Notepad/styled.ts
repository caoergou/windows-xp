import styled from 'styled-components';
import { resolveOSTheme } from '../../themes/useOSTheme';

// Notepad styled-components (#163/A).

export const Container = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
`;

export const MenuBar = styled.div`
  height: 20px;
  background: ${({ theme }) => resolveOSTheme(theme).tokens.SURFACE};
  display: flex;
  align-items: center;
  padding: 0 2px;
  font-size: 11px;
  font-family: ${({ theme }) => resolveOSTheme(theme).fonts.UI};
  flex-shrink: 0;
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

export const DropdownItem = styled.div<{ $disabled?: boolean; $checked?: boolean }>`
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

  &::before {
    content: ${p => (p.$checked ? "'✓'" : "'\\00a0'")};
    position: absolute;
    left: 6px;
    width: 12px;
    text-align: center;
    font-size: 11px;
  }
`;

export const DropdownSeparator = styled.div`
  height: 1px;
  background: ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_SHADOW};
  margin: 3px 2px;
`;

export const EditorArea = styled.div`
  flex: 1;
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

export const TextArea = styled.textarea<{ $wordWrap: boolean }>`
  width: 100%;
  height: 100%;
  border: none;
  resize: none;
  font-family: ${({ theme }) => resolveOSTheme(theme).fonts.EDITOR};
  font-size: 14px;
  padding: 5px;
  outline: none;
  background: white;
  white-space: ${p => (p.$wordWrap ? 'pre-wrap' : 'pre')};
  word-wrap: ${p => (p.$wordWrap ? 'break-word' : 'normal')};
  overflow-wrap: ${p => (p.$wordWrap ? 'break-word' : 'normal')};
  overflow-x: ${p => (p.$wordWrap ? 'hidden' : 'auto')};
`;

export const StatusBar = styled.div`
  height: 20px;
  background: ${({ theme }) => resolveOSTheme(theme).tokens.SURFACE};
  border-top: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_SHADOW};
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 8px;
  font-size: 11px;
  font-family: ${({ theme }) => resolveOSTheme(theme).fonts.UI};
  flex-shrink: 0;
`;

export const StatusBarSection = styled.div`
  border-left: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_SHADOW};
  padding: 0 8px;
`;

export const DialogOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0);
  z-index: 99999;
  display: flex;
  justify-content: center;
  align-items: center;
`;

export const DialogContent = styled.div`
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const DialogRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const DialogLabel = styled.label`
  width: 70px;
  font-size: 12px;
  text-align: right;
`;

export const DialogInput = styled.input`
  flex: 1;
  border: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.FIELD_BORDER};
  padding: 3px;
  font-family: ${({ theme }) => resolveOSTheme(theme).fonts.UI};
  font-size: 12px;
`;

export const DialogButtonArea = styled.div`
  padding: 10px 16px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

export const DialogButton = styled.button`
  min-width: 75px;
  height: 23px;
  background: ${({ theme }) => resolveOSTheme(theme).tokens.SURFACE};
  border: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_BORDER};
  border-radius: 2px;
  font-family: ${({ theme }) => resolveOSTheme(theme).fonts.UI};
  font-size: 12px;
  cursor: pointer;
  box-shadow:
    inset 1px 1px 0px white,
    1px 1px 2px rgba(0, 0, 0, 0.3);

  &:hover {
    box-shadow:
      inset 1px 1px 0px ${({ theme }) => resolveOSTheme(theme).tokens.STATUS_GROOVE_HILIGHT},
      1px 1px 2px rgba(0, 0, 0, 0.3);
  }

  &:active {
    box-shadow: inset 1px 1px 1px rgba(0, 0, 0, 0.2);
    padding-top: 1px;
    padding-left: 1px;
  }

  &:focus {
    outline: 1px dotted black;
    outline-offset: -4px;
  }

  &:disabled {
    color: ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_SHADOW};
    cursor: default;
  }
`;
