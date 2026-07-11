import React from 'react';
import styled from 'styled-components';
import XPIcon from './XPIcon';
import {
  XPDialogWindow,
  XPDialogContent,
  XPDialogButtonRow,
} from './XPDialogChrome';
import { TitleBar } from './Window/WindowChrome';
import { CloseBtn } from './Window/WindowControls';

/**
 * Standalone, provider-free XP dialog (#78). Unlike XPAlert/XPConfirm (driven by
 * ModalContext), this can be dropped anywhere — no `<WindowsXP>`, no providers —
 * to compose a classic XP message box from `<XPDialog>` + `<XPButton>`:
 *
 * ```tsx
 * <XPDialog title="Notepad" icon="alert_warning" modal onClose={close}
 *   footer={<><XPButton onClick={save}>Yes</XPButton><XPButton onClick={close}>No</XPButton></>}>
 *   The text in the file has changed. Save?
 * </XPDialog>
 * ```
 *
 * Reuses the real window chrome (Luna title bar + close button), so it can never
 * drift from on-screen windows.
 */

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 2147482000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.15);
`;

const TitleInner = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  color: #fff;
  font-weight: bold;
  font-size: 13px;
  font-family: 'Trebuchet MS', 'Tahoma', 'SimSun', 'Microsoft YaHei', sans-serif;
  text-shadow: 1px 1px 1px #000;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;

  img {
    filter: drop-shadow(1px 1px 1px rgba(0, 0, 0, 0.3));
  }
`;

export interface XPDialogProps {
  title: string;
  /** XPIcon id shown in the title bar (e.g. 'alert_warning'). */
  icon?: string;
  onClose?: () => void;
  width?: number;
  /** Render a dimming overlay and center the dialog. */
  modal?: boolean;
  /** Footer content — typically XPButtons. Omit for a bodyless dialog. */
  footer?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  'data-testid'?: string;
}

export const XPDialog: React.FC<XPDialogProps> = ({
  title,
  icon,
  onClose,
  width = 380,
  modal = false,
  footer,
  children,
  className,
  'data-testid': testId,
}) => {
  const dialog = (
    <XPDialogWindow style={{ width }} className={className} data-testid={testId ?? 'xp-dialog'}>
      <TitleBar $isFocus>
        <TitleInner>
          {icon && <XPIcon name={icon} size={16} />}
          {title}
        </TitleInner>
        {onClose && <CloseBtn onClick={onClose} aria-label="Close" />}
      </TitleBar>
      {children != null && <XPDialogContent>{children}</XPDialogContent>}
      {footer && <XPDialogButtonRow>{footer}</XPDialogButtonRow>}
    </XPDialogWindow>
  );

  return modal ? <Overlay>{dialog}</Overlay> : dialog;
};
