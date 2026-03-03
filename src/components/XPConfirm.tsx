import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
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
  font-family: 'Tahoma', sans-serif;
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

const CloseButton = styled.button`
  width: 21px;
  height: 21px;
  background: linear-gradient(to bottom, #E79176, #DA5E42);
  border: 1px solid white;
  border-radius: 3px;
  color: white;
  font-weight: bold;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  &:hover { filter: brightness(1.1); }
  &:active { filter: brightness(0.9); box-shadow: inset 1px 1px 1px rgba(0,0,0,0.5); }
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

const Btn = styled.button`
  min-width: 75px;
  height: 23px;
  background: #ECE9D8;
  border: 1px solid #003C74;
  border-radius: 2px;
  font-family: 'Tahoma', sans-serif;
  font-size: 12px;
  cursor: pointer;
  box-shadow: inset 1px 1px 0px white, 1px 1px 2px rgba(0,0,0,0.3);
  &:hover { box-shadow: inset 1px 1px 0px #F5F2E4, 1px 1px 2px rgba(0,0,0,0.3); }
  &:active { box-shadow: inset 1px 1px 1px rgba(0,0,0,0.2); padding-top: 1px; padding-left: 1px; }
  &:focus { outline: 1px dotted black; outline-offset: -4px; }
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
  confirmLabel = '是(Y)',
  cancelLabel  = '否(N)',
  onConfirm,
  onCancel,
}: XPConfirmProps) => {
  const confirmRef = useRef<HTMLButtonElement>(null);

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
          <CloseButton onClick={onCancel}>×</CloseButton>
        </TitleBar>
        <ContentArea>
          <XPIcon name={iconName} size={32} />
          <Message>{message}</Message>
        </ContentArea>
        <ButtonArea>
          <Btn ref={confirmRef} onClick={onConfirm}>{confirmLabel}</Btn>
          <Btn onClick={onCancel}>{cancelLabel}</Btn>
        </ButtonArea>
      </AlertWindow>
    </Overlay>
  );
};

export default XPConfirm;
