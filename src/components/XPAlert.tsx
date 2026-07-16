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
import Draggable from 'react-draggable';
import { useModalA11y } from '../hooks/useModalA11y';

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
`;

const ButtonArea = styled.div`
  padding: 10px;
  display: flex;
  justify-content: center;
`;

interface XPAlertProps {
  title: string;
  message: string;
  type?: 'info' | 'warning' | 'error';
  onClose: () => void;
  attentionSequence?: number;
  placement?: XPDialogPlacement;
  isActive?: boolean;
}

const XPAlert = ({
  title,
  message,
  type = 'info',
  onClose,
  attentionSequence = 0,
  placement,
  isActive = true,
}: XPAlertProps) => {
  const { t } = useTranslation();
  const okButtonRef = useRef<HTMLButtonElement>(null);
  const { containerRef, onKeyDown } = useModalA11y(onClose);

  useEffect(() => {
    if (okButtonRef.current) {
      okButtonRef.current.focus();
    }
  }, []);

  const iconName =
    type === 'error' ? 'alert_error' : type === 'warning' ? 'alert_warning' : 'alert_info';

  const nodeRef = useRef<HTMLDivElement>(null);

  return (
    <XPDialogOverlay
      ref={containerRef}
      style={placement}
      onKeyDown={onKeyDown}
      data-xp-context-boundary
      className="xp-alert"
      onMouseDown={e => e.stopPropagation()}
    >
      <Draggable nodeRef={nodeRef} handle=".title-bar">
        <XPDialogWindow
          ref={nodeRef}
          $isFocus={isActive}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          style={{ pointerEvents: 'auto' }}
          onMouseDown={e => e.stopPropagation()}
        >
          <XPDialogTitleBar
            key={attentionSequence}
            $isFocus={isActive}
            $attention={attentionSequence > 0}
            className="title-bar"
          >
            <XPDialogTitleText>{title}</XPDialogTitleText>
            <CloseBtn onClick={onClose} aria-label="Close" />
          </XPDialogTitleBar>
          <ContentArea>
            <XPIcon name={iconName} size={32} />
            <Message>{message}</Message>
          </ContentArea>
          <ButtonArea>
            <XPButton ref={okButtonRef} $default onClick={onClose}>
              {t('common.ok')}
            </XPButton>
          </ButtonArea>
        </XPDialogWindow>
      </Draggable>
    </XPDialogOverlay>
  );
};

export default XPAlert;
