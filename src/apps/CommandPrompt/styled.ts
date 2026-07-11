import styled from 'styled-components';

// CommandPrompt styled-components (#163/A — split out of the single-file app).

export const Container = styled.div<{ $color?: string }>`
  font-family: 'Perfect DOS VGA 437 Win', 'Lucida Console', 'Courier New', monospace;
  font-size: 12px;
  background: #000000;
  color: ${p => p.$color || '#c0c0c0'};
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 2px 0;
  box-sizing: border-box;
`;

export const Output = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  white-space: pre-wrap;
  word-wrap: break-word;
  padding: 0 6px;
  min-height: 0;
`;

export const InputLine = styled.div`
  display: flex;
  align-items: center;
  flex-shrink: 0;
  padding: 0 6px;
  background: #000000;
`;

export const Prompt = styled.span`
  color: inherit;
  white-space: pre;
  flex-shrink: 0;
`;

export const Input = styled.input`
  flex: 1;
  min-width: 0;
  background: #000000 !important;
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
