import styled from 'styled-components';
import { resolveOSTheme } from '../../themes/useOSTheme';
import { CMD_BACKGROUND, CMD_DEFAULT_TEXT } from './constants';

// CommandPrompt styled-components (#163/A — split out of the single-file app).

// The console is a single scrolling text buffer: output and the active prompt
// live in one top-aligned flow, so the prompt sits right after the last line
// (near the top when little has printed) exactly like real cmd.exe — not pinned
// to the window's bottom edge.
export const Container = styled.div<{ $color?: string }>`
  font-family: ${({ theme }) => resolveOSTheme(theme).fonts.CONSOLE};
  font-size: 12px;
  line-height: 1.2;
  background: ${CMD_BACKGROUND};
  color: ${p => p.$color || CMD_DEFAULT_TEXT};
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 2px 6px;
  box-sizing: border-box;
  white-space: pre-wrap;
  word-wrap: break-word;
  cursor: text;
`;

/** The active prompt + input, flowing inline after the buffered output. */
export const CurrentLine = styled.div`
  display: flex;
  align-items: flex-start;
`;

export const Prompt = styled.span`
  color: inherit;
  white-space: pre;
  flex-shrink: 0;
`;

export const Input = styled.input`
  flex: 1;
  min-width: 0;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  border-radius: 0 !important;
  color: inherit;
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
  outline: none;
  padding: 0;
  margin: 0;
  caret-color: currentColor;

  &:focus,
  &:focus-visible {
    outline: none !important;
    box-shadow: none !important;
  }
`;
