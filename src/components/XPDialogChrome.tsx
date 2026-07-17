import React from 'react';
import styled, { css, keyframes } from 'styled-components';
import { TitleBar, WindowContainer } from './Window/WindowChrome';
import { CloseBtn } from './Window/WindowControls';
import { resolveOSTheme } from '../themes/useOSTheme';

/**
 * Shared dialog chrome (#99): XPAlert, XPConfirm, PasswordDialog and XPInput
 * each hand-rolled a dialog window whose title bar was a flat HORIZONTAL
 * gradient (`to right, #0058EE → #3593FF`) - visibly different from every
 * real window on screen, which uses the vertical 8-stop Luna gradient. The
 * dialog frame border/radius/height diverged too.
 *
 * These wrappers reuse the exact same styled pieces as WindowChrome, so a
 * dialog's chrome can never drift from a window's chrome again.
 */

export const XPDialogWindow = styled(WindowContainer)`
  position: relative;
  min-width: 0;
  min-height: 0;
`;

export interface XPDialogPlacement {
  top: number;
  left: number;
  width: number;
  height: number;
  zIndex: number;
}

export const XPDialogOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 99999;
  display: flex;
  justify-content: center;
  align-items: center;
  pointer-events: none;
`;

const dialogAttention = keyframes`
  0%, 100% { filter: none; }
  25%, 75% { filter: brightness(1.55); }
  50% { filter: brightness(0.78); }
`;

export const XPDialogTitleBar = styled(TitleBar)<{ $attention?: boolean }>`
  ${({ $attention }) =>
    $attention &&
    css`
      animation: ${dialogAttention} 400ms linear 2;
    `}
`;

export const XPDialogTitleText = styled.div`
  color: white;
  font-weight: bold;
  font-size: 13px;
  font-family: ${({ theme }) => resolveOSTheme(theme).fonts.TITLEBAR};
  text-shadow: 1px 1px 1px black;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  padding-left: 3px;
`;

export const XPDialogContent = styled.div`
  padding: 14px 16px;
  font-size: 11px;
  color: ${({ theme }) => resolveOSTheme(theme).tokens.BLACK};
`;

export const XPDialogButtonRow = styled.div`
  display: flex;
  justify-content: center;
  gap: 8px;
  padding: 0 16px 14px;
`;

interface XPDialogFrameProps {
  title: string;
  onClose?: () => void;
  width?: number;
  children: React.ReactNode;
  'data-testid'?: string;
}

/** Complete dialog frame: Luna title bar + close button + body surface. */
export const XPDialogFrame: React.FC<XPDialogFrameProps> = ({
  title,
  onClose,
  width = 380,
  children,
  'data-testid': testId,
}) => (
  <XPDialogWindow $isFocus style={{ width }} data-testid={testId ?? 'xp-dialog'}>
    <TitleBar $isFocus>
      <XPDialogTitleText>{title}</XPDialogTitleText>
      {onClose && <CloseBtn onClick={onClose} aria-label="Close" />}
    </TitleBar>
    {children}
  </XPDialogWindow>
);
