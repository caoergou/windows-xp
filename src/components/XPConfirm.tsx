import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { XPButton } from './XPButton';
import { CloseBtn } from './Window/WindowControls';
import { XPDialogWindow, XPDialogTitleText } from './XPDialogChrome';
import { TitleBar as LunaTitleBar } from './Window/WindowChrome';
import { useTranslation } from 'react-i18next';
import XPIcon from './XPIcon';
import { useModalA11y } from '../hooks/useModalA11y';

// --- Styled components (kept visually consistent with XPAlert) ---------------------------

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 99999;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const ContentArea = styled.div`
  padding: 20px;
  display: flex;
  align-items: flex-start;
  gap: 15px;
`;

const Message = styled.div`
  font-size: 12px;
  color: black;
  flex: 1;
  word-wrap: break-word;
  line-height: 1.5;
`;

const ButtonArea = styled.div`
  padding: 10px 10px 14px;
  display: flex;
  justify-content: center;
  gap: 8px;
`;

// ── Component ──────────────────────────────────────────────────────────────

interface XPConfirmProps {
  title: string;
  message: string;
  type?: 'question' | 'info' | 'warning' | 'error';
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const XPConfirm = ({
  title,
  message,
  type = 'question',
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: XPConfirmProps) => {
  const { t } = useTranslation();
  const confirmRef = useRef<HTMLButtonElement>(null);
  const { containerRef, onKeyDown } = useModalA11y(onCancel);
  const finalConfirmLabel = confirmLabel || t('common.ok');
  const finalCancelLabel = cancelLabel || t('common.cancel');

  useEffect(() => {
    confirmRef.current?.focus();
  }, []);

  const iconName =
    type === 'error'
      ? 'alert_error'
      : type === 'warning'
        ? 'alert_warning'
        : /* question / info */ 'alert_info';

  return (
    <Overlay ref={containerRef} onKeyDown={onKeyDown} data-xp-context-boundary>
      <XPDialogWindow role="dialog" aria-modal="true" aria-label={title}>
        <LunaTitleBar $isFocus className="title-bar">
          <XPDialogTitleText>{title}</XPDialogTitleText>
          <CloseBtn onClick={onCancel} aria-label="Close" />
        </LunaTitleBar>
        <ContentArea>
          <XPIcon name={iconName} size={32} />
          <Message>{message}</Message>
        </ContentArea>
        <ButtonArea>
          <XPButton ref={confirmRef} $default onClick={onConfirm}>
            {finalConfirmLabel}
          </XPButton>
          <XPButton onClick={onCancel}>{finalCancelLabel}</XPButton>
        </ButtonArea>
      </XPDialogWindow>
    </Overlay>
  );
};

export default XPConfirm;
