import React from 'react';
import styled from 'styled-components';
import { TitleBar, WindowContainer } from './Window/WindowChrome';
import { CloseBtn } from './Window/WindowControls';

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

export const XPDialogWindow = styled(WindowContainer).attrs({ $isFocus: true })`
  position: relative;
  min-width: 0;
  min-height: 0;
`;

export const XPDialogTitleText = styled.div`
  color: white;
  font-weight: bold;
  font-size: 13px;
  font-family: 'Trebuchet MS', 'Tahoma', 'SimSun', 'Microsoft YaHei', sans-serif;
  text-shadow: 1px 1px 1px black;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  padding-left: 3px;
`;

export const XPDialogContent = styled.div`
  padding: 14px 16px;
  font-size: 11px;
  color: #000;
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
  <XPDialogWindow style={{ width }} data-testid={testId ?? 'xp-dialog'}>
    <TitleBar $isFocus>
      <XPDialogTitleText>{title}</XPDialogTitleText>
      {onClose && <CloseBtn onClick={onClose} aria-label="Close" />}
    </TitleBar>
    {children}
  </XPDialogWindow>
);
