import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { XPButton } from './XPButton';
import { CloseBtn } from './Window/WindowControls';
import {
  XPDialogOverlay,
  XPDialogPlacement,
  XPDialogTitleBar,
  XPDialogWindow,
  XPDialogTitleText,
} from './XPDialogChrome';
import { useTranslation } from 'react-i18next';
import XPIcon from './XPIcon';
import { useModalA11y } from '../hooks/useModalA11y';
import Draggable from 'react-draggable';

// --- Styled components (kept visually consistent with XPAlert) ---------------------------

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
  attentionSequence?: number;
  placement?: XPDialogPlacement;
  isActive?: boolean;
}

const XPConfirm = ({
  title,
  message,
  type = 'question',
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  attentionSequence = 0,
  placement,
  isActive = true,
}: XPConfirmProps) => {
  const { t } = useTranslation();
  const confirmRef = useRef<HTMLButtonElement>(null);
  const nodeRef = useRef<HTMLDivElement>(null);
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
    <XPDialogOverlay
      ref={containerRef}
      style={placement}
      onKeyDown={onKeyDown}
      data-xp-context-boundary
    >
      <Draggable nodeRef={nodeRef} handle=".title-bar">
        <XPDialogWindow
          ref={nodeRef}
          $isFocus={isActive}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          style={{ pointerEvents: 'auto' }}
        >
          <XPDialogTitleBar
            key={attentionSequence}
            $isFocus={isActive}
            $attention={attentionSequence > 0}
            className="title-bar"
          >
            <XPDialogTitleText>{title}</XPDialogTitleText>
            <CloseBtn onClick={onCancel} aria-label="Close" />
          </XPDialogTitleBar>
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
      </Draggable>
    </XPDialogOverlay>
  );
};

export default XPConfirm;
