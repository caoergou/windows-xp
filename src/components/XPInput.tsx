import React, { useEffect, useRef, useState } from 'react';
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
import { useModalA11y } from '../hooks/useModalA11y';
import Draggable from 'react-draggable';

const ContentArea = styled.div`
  padding: 18px 14px 7px 14px;
  display: flex;
  flex-direction: column;
  gap: 9px;
`;

const MessageRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 15px;
`;

const Message = styled.div`
  font-size: 12px;
  color: black;
  flex: 1;
  word-wrap: break-word;
  line-height: 18px;
`;

const ButtonArea = styled.div`
  padding: 0 9px 9px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

interface XPInputProps {
  title: string;
  message: string;
  defaultValue?: string;
  onOk: (value: string) => void;
  onCancel: () => void;
  attentionSequence?: number;
  placement?: XPDialogPlacement;
  isActive?: boolean;
}

const XPInput: React.FC<XPInputProps> = ({
  title,
  message,
  defaultValue = '',
  onOk,
  onCancel,
  attentionSequence = 0,
  placement,
  isActive = true,
}) => {
  const { t } = useTranslation();
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);
  const nodeRef = useRef<HTMLDivElement>(null);
  const { containerRef, onKeyDown } = useModalA11y(onCancel);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onOk(value);
    } else if (e.key === 'Escape') {
      onCancel();
    }
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
            <MessageRow>
              <Message>{message}</Message>
            </MessageRow>
            <XPTextInput
              ref={inputRef}
              value={value}
              onChange={e => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </ContentArea>
          <ButtonArea>
            <XPButton $default onClick={() => onOk(value)}>
              {t('common.ok')}
            </XPButton>
            <XPButton onClick={onCancel}>{t('common.cancel')}</XPButton>
          </ButtonArea>
        </XPDialogWindow>
      </Draggable>
    </XPDialogOverlay>
  );
};

export default XPInput;
