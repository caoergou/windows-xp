import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import XPIcon from './XPIcon';
import Draggable from 'react-draggable';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0); /* Transparent overlay usually for XP, but maybe slight dim? XP didn't dim. */
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
  line-height: 1;

  &:hover {
    filter: brightness(1.1);
  }

  &:active {
    filter: brightness(0.9);
    box-shadow: inset 1px 1px 1px rgba(0,0,0,0.5);
  }
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

const OkButton = styled.button`
  min-width: 75px;
  height: 23px;
  background: #ECE9D8;
  border: 1px solid #003C74;
  border-radius: 2px;
  font-family: 'Tahoma', sans-serif;
  font-size: 12px;
  cursor: pointer;
  box-shadow: inset 1px 1px 0px white, 1px 1px 2px rgba(0,0,0,0.3);

  &:hover {
    box-shadow: inset 1px 1px 0px #F5F2E4, 1px 1px 2px rgba(0,0,0,0.3);
  }

  &:active {
    box-shadow: inset 1px 1px 1px rgba(0,0,0,0.2);
    padding-top: 1px;
    padding-left: 1px;
  }

  &:focus {
     outline: 1px dotted black;
     outline-offset: -4px;
  }
`;

interface XPAlertProps {
  title: string;
  message: string;
  type?: 'error' | 'warning' | 'info';
  onClose: () => void;
}

const XPAlert: React.FC<XPAlertProps> = ({ title, message, type = 'info', onClose }) => {
    const okButtonRef = useRef<HTMLButtonElement>(null);

    // Play sound on mount could be cool but browsers block audio context usually

    useEffect(() => {
        if (okButtonRef.current) {
            okButtonRef.current.focus();
        }
    }, []);

    const iconName = type === 'error' ? 'alert_error' :
                     type === 'warning' ? 'alert_warning' : 'alert_info';

    const nodeRef = useRef<HTMLDivElement>(null);

    return (
        <Overlay onClick={(e) => { if(e.target === e.currentTarget) { /* Do nothing, must click ok or close */ } }}>
            <Draggable nodeRef={nodeRef} handle=".title-bar">
                <AlertWindow ref={nodeRef}>
                    <TitleBar className="title-bar">
                        <span>{title}</span>
                        <CloseButton onClick={onClose}>×</CloseButton>
                    </TitleBar>
                    <ContentArea>
                        <XPIcon name={iconName} size={32} />
                        <Message>{message}</Message>
                    </ContentArea>
                    <ButtonArea>
                        <OkButton ref={okButtonRef} onClick={onClose}>确定</OkButton>
                    </ButtonArea>
                </AlertWindow>
            </Draggable>
        </Overlay>
    );
};

export default XPAlert;
