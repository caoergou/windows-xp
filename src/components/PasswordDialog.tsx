import React, { useState, useEffect, useRef } from 'react';
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
import { XPTextInput } from './XPTextInput';
import { useTranslation } from 'react-i18next';
import XPIcon from './XPIcon';
import { sounds } from '../utils/soundManager';
import { useModalA11y } from '../hooks/useModalA11y';
import Draggable from 'react-draggable';
import { COLORS } from '../constants';

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
  color: ${COLORS.GREY_66};
  margin-top: 4px;
  font-style: italic;
`;

const ErrorText = styled.div`
  font-size: 11px;
  color: ${COLORS.ALERT_RED};
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
  attentionSequence?: number;
  placement?: XPDialogPlacement;
  isActive?: boolean;
}

const PasswordDialog = ({
  title,
  message,
  hint = '',
  correctPassword,
  onSuccess,
  onCancel,
  onFail,
  attentionSequence = 0,
  placement,
  isActive = true,
}: PasswordDialogProps) => {
  const { t } = useTranslation();
  const dialogTitle = title || t('passwordDialog.defaultTitle');
  const dialogMessage = message || t('passwordDialog.defaultMessage');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const nodeRef = useRef<HTMLDivElement>(null);
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
          aria-label={dialogTitle}
          style={{ pointerEvents: 'auto' }}
        >
          <XPDialogTitleBar
            key={attentionSequence}
            $isFocus={isActive}
            $attention={attentionSequence > 0}
            className="title-bar"
          >
            <XPDialogTitleText>{dialogTitle}</XPDialogTitleText>
            <CloseBtn onClick={onCancel} aria-label="Close" />
          </XPDialogTitleBar>
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
      </Draggable>
    </XPDialogOverlay>
  );
};

export default PasswordDialog;
