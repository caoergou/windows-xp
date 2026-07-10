import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { XPButton } from './XPButton';
import { CloseBtn } from './Window/WindowControls';
import { useTranslation } from 'react-i18next';
import XPIcon from './XPIcon';

// ── Styled components（与 XPAlert 保持视觉一致）─────────────────────────────

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 99999;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const AlertWindow = styled.div`
  width: 380px;
  background-color: #ECE9D8;
  border: 1px solid #0055EA;
  border-radius: 3px;
  box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  font-family: "Tahoma", "SimSun", "Microsoft YaHei", sans-serif;
`;

const TitleBar = styled.div`
  height: 30px;
  background: linear-gradient(to right, #0058EE 0%, #3593FF 100%);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 5px;
  color: white;
  font-weight: bold;
  font-size: 13px;
  text-shadow: 1px 1px 1px black;
  border-radius: 2px 2px 0 0;
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
  const finalConfirmLabel = confirmLabel || t('common.ok');
  const finalCancelLabel = cancelLabel || t('common.cancel');

  useEffect(() => {
    confirmRef.current?.focus();
  }, []);

  const iconName =
    type === 'error'   ? 'alert_error'   :
    type === 'warning' ? 'alert_warning' :
    /* question / info */  'alert_info';

  return (
    <Overlay>
      <AlertWindow>
        <TitleBar>
          <span>{title}</span>
          <CloseBtn onClick={onCancel} aria-label="Close" />
        </TitleBar>
        <ContentArea>
          <XPIcon name={iconName} size={32} />
          <Message>{message}</Message>
        </ContentArea>
        <ButtonArea>
          <XPButton ref={confirmRef} onClick={onConfirm}>{finalConfirmLabel}</XPButton>
          <XPButton onClick={onCancel}>{finalCancelLabel}</XPButton>
        </ButtonArea>
      </AlertWindow>
    </Overlay>
  );
};

export default XPConfirm;
