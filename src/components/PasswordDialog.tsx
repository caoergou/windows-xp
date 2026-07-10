import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { XPButton } from './XPButton';
import { CloseBtn } from './Window/WindowControls';
import { XPDialogWindow, XPDialogTitleText } from './XPDialogChrome';
import { TitleBar as LunaTitleBar } from './Window/WindowChrome';
import { useTranslation } from 'react-i18next';
import XPIcon from './XPIcon';
import { sounds } from '../utils/soundManager';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0,0,0,0);
  z-index: 99999;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const ContentArea = styled.div`
  padding: 18px 20px 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const MessageRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
`;

const Message = styled.div`
  font-size: 12px;
  color: black;
  flex: 1;
`;

const HintText = styled.div`
  font-size: 11px;
  color: #666;
  margin-top: 4px;
  font-style: italic;
`;

const PasswordInput = styled.input`
  width: 100%;
  height: 23px;
  padding: 2px 5px;
  border: 1px solid #7F9DB9;
  border-radius: 1px;
  font-family: "Tahoma", "SimSun", "Microsoft YaHei", sans-serif;
  font-size: 12px;
  box-shadow: inset 1px 1px 1px rgba(0,0,0,0.1);
  box-sizing: border-box;

  &:focus { outline: 1px solid #0055EA; outline-offset: -1px; }
`;

const ErrorText = styled.div`
  font-size: 11px;
  color: #D32F2F;
  min-height: 16px;
`;

const ButtonArea = styled.div`
  padding: 8px 20px 12px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

interface PasswordDialogProps {
  title?: string;
  message?: string;
  hint?: string;
  correctPassword: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const PasswordDialog = ({
  title,
  message,
  hint = '',
  correctPassword,
  onSuccess,
  onCancel,
}: PasswordDialogProps) => {
  const { t } = useTranslation();
  const dialogTitle = title || t('passwordDialog.defaultTitle');
  const dialogMessage = message || t('passwordDialog.defaultMessage');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    if (!password) { setError(t('passwordDialog.emptyError')); return; }

    if (password === correctPassword) {
      sounds.ding();
      onSuccess();
    } else {
      sounds.error();
      setError(t('passwordDialog.incorrectError'));
      setPassword('');
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSubmit();
    else if (e.key === 'Escape') onCancel();
  };

  return (
    <Overlay>
      <XPDialogWindow>
        <LunaTitleBar $isFocus className="title-bar">
          <XPDialogTitleText>{dialogTitle}</XPDialogTitleText>
          <CloseBtn onClick={onCancel} aria-label="Close" />
        </LunaTitleBar>
        <ContentArea>
          <MessageRow>
            <XPIcon name="lock" size={32} />
            <div style={{ flex: 1 }}>
              <Message>{dialogMessage}</Message>
              {hint && <HintText>{t('passwordDialog.hintPrefix')} {hint}</HintText>}
            </div>
          </MessageRow>
          <div>
            <PasswordInput
              ref={inputRef}
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              onKeyDown={handleKeyDown}
              placeholder={t('passwordDialog.placeholder')}
            />
            <ErrorText>{error}</ErrorText>
          </div>
        </ContentArea>
        <ButtonArea>
          <XPButton onClick={onCancel}>{t('common.cancel')}</XPButton>
          <XPButton onClick={handleSubmit}>{t('common.ok')}</XPButton>
        </ButtonArea>
      </XPDialogWindow>
    </Overlay>
  );
};

export default PasswordDialog;
