import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { XPButton } from './XPButton';
import { CloseBtn } from './Window/WindowControls';
import { XPDialogWindow, XPDialogTitleText } from './XPDialogChrome';
import { TitleBar as LunaTitleBar } from './Window/WindowChrome';
import { useTranslation } from 'react-i18next';

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

const InputField = styled.input`
    width: 100%;
    height: 21px;
    box-sizing: border-box;
    border: 1px solid #7F9DB9;
    padding: 2px 3px;
    font-family: "Tahoma", "SimSun", "Microsoft YaHei", sans-serif;
    font-size: 12px;
    background: #fff;
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
}

const XPInput: React.FC<XPInputProps> = ({ title, message, defaultValue = '', onOk, onCancel }) => {
    const { t } = useTranslation();
    const [value, setValue] = useState(defaultValue);
    const inputRef = useRef<HTMLInputElement>(null);

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
        <Overlay onClick={(e) => { if(e.target === e.currentTarget) { /* block outside click */ } }}>
            <XPDialogWindow>
                <LunaTitleBar $isFocus className="title-bar">
                    <XPDialogTitleText>{title}</XPDialogTitleText>
                    <CloseBtn onClick={onCancel} aria-label="Close" />
                </LunaTitleBar>
                <ContentArea>
                    <MessageRow>
                        <Message>{message}</Message>
                    </MessageRow>
                    <InputField
                        ref={inputRef}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                </ContentArea>
                <ButtonArea>
                    <XPButton onClick={() => onOk(value)}>{t('common.ok')}</XPButton>
                    <XPButton onClick={onCancel}>{t('common.cancel')}</XPButton>
                </ButtonArea>
            </XPDialogWindow>
        </Overlay>
    );
};

export default XPInput;
