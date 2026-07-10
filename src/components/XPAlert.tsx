import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { XPButton } from './XPButton';
import { CloseBtn } from './Window/WindowControls';
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

const AlertWindow = styled.div`
  width: 350px;
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
                <AlertWindow ref={nodeRef} onMouseDown={(e) => e.stopPropagation()}>
                    <TitleBar className="title-bar">
                        <span>{title}</span>
                        <CloseBtn onClick={onClose} aria-label="Close" />
                    </TitleBar>
                    <ContentArea>
                        <XPIcon name={iconName} size={32} />
                        <Message>{message}</Message>
                    </ContentArea>
                    <ButtonArea>
                        <XPButton ref={okButtonRef} onClick={onClose}>{t('common.ok')}</XPButton>
                    </ButtonArea>
                </AlertWindow>
            </Draggable>
        </Overlay>
    );
};

export default XPAlert;
