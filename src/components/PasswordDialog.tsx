import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { XPButton } from './XPButton';
import { CloseBtn } from './Window/WindowControls';
import { XPDialogWindow, XPDialogTitleText } from './XPDialogChrome';
import { TitleBar as LunaTitleBar } from './Window/WindowChrome';
import { XPTextInput } from './XPTextInput';
import { useTranslation } from 'react-i18next';
import XPIcon from './XPIcon';
import { sounds } from '../utils/soundManager';
import { useModalA11y } from '../hooks/useModalA11y';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0);
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

const ErrorText = styled.div`
  font-size: 11px;
  color: #d32f2f;
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
  /** Fires on each incorrect entry; the dialog stays open for another try (#116). */
  onFail?: () => void;
}

const PasswordDialog = ({
  title,
  message,
  hint = '',
  correctPassword,
  onSuccess,
  onCancel,
  onFail,
}: PasswordDialogProps) => {
  const { t } = useTranslation();
  const dialogTitle = title || t('passwordDialog.defaultTitle');
  const dialogMessage = message || t('passwordDialog.defaultMessage');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { containerRef, onKeyDown } = useModalA11y(onCancel);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    if (!password) {
      setError(t('passwordDialog.emptyError'));
      return;
    }

    if (password === correctPassword) {
      sounds.ding();
      onSuccess();
    } else {
      sounds.error();
      onFail?.();
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
    <Overlay ref={containerRef} onKeyDown={onKeyDown} data-xp-context-boundary>
      <XPDialogWindow role="dialog" aria-modal="true" aria-label={dialogTitle}>
        <LunaTitleBar $isFocus className="title-bar">
          <XPDialogTitleText>{dialogTitle}</XPDialogTitleText>
          <CloseBtn onClick={onCancel} aria-label="Close" />
        </LunaTitleBar>
        <ContentArea>
          <MessageRow>
            <XPIcon name="lock" size={32} />
            <div style={{ flex: 1 }}>
              <Message>{dialogMessage}</Message>
              {hint && (
                <HintText>
                  {t('passwordDialog.hintPrefix')} {hint}
                </HintText>
              )}
            </div>
          </MessageRow>
          <div>
            <XPTextInput
              ref={inputRef}
              type="password"
              value={password}
              onChange={e => {
                setPassword(e.target.value);
                setError('');
              }}
              onKeyDown={handleKeyDown}
              placeholder={t('passwordDialog.placeholder')}
            />
            <ErrorText>{error}</ErrorText>
          </div>
        </ContentArea>
        <ButtonArea>
          <XPButton onClick={onCancel}>{t('common.cancel')}</XPButton>
          <XPButton $default onClick={handleSubmit}>
            {t('common.ok')}
          </XPButton>
        </ButtonArea>
      </XPDialogWindow>
    </Overlay>
  );
};

export default PasswordDialog;
