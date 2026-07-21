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
