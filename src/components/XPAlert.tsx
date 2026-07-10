import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { XPButton } from './XPButton';
import { CloseBtn } from './Window/WindowControls';
import { XPDialogWindow, XPDialogTitleText } from './XPDialogChrome';
import { TitleBar as LunaTitleBar } from './Window/WindowChrome';
import { useTranslation } from 'react-i18next';
import XPIcon from './XPIcon';
import Draggable from 'react-draggable';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0); /* Transparent overlay usually for XP, but maybe slight dim? XP didn't dim. */
  /* However, to block interaction with background, we need this overlay. */
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
}

const XPAlert = ({ title, message, type = 'info', onClose }: XPAlertProps) => {
    const { t } = useTranslation();
    const okButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (okButtonRef.current) {
            okButtonRef.current.focus();
        }
    }, []);

    const iconName = type === 'error' ? 'alert_error' :
                     type === 'warning' ? 'alert_warning' : 'alert_info';

    const nodeRef = useRef<HTMLDivElement>(null);

    return (
        <Overlay className="xp-alert" onMouseDown={(e) => e.stopPropagation()}>
            <Draggable nodeRef={nodeRef} handle=".title-bar">
                <XPDialogWindow ref={nodeRef} onMouseDown={(e) => e.stopPropagation()}>
                    <LunaTitleBar $isFocus className="title-bar">
                        <XPDialogTitleText>{title}</XPDialogTitleText>
                        <CloseBtn onClick={onClose} aria-label="Close" />
                    </LunaTitleBar>
                    <ContentArea>
                        <XPIcon name={iconName} size={32} />
                        <Message>{message}</Message>
                    </ContentArea>
                    <ButtonArea>
                        <XPButton ref={okButtonRef} onClick={onClose}>{t('common.ok')}</XPButton>
                    </ButtonArea>
                </XPDialogWindow>
            </Draggable>
        </Overlay>
    );
};

export default XPAlert;
