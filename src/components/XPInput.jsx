import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import XPIcon from './XPIcon';

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
  flex-direction: column;
  gap: 10px;
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
`;

const InputField = styled.input`
    width: 100%;
    margin-top: 10px;
    border: 1px solid #7F9DB9;
    padding: 3px;
    font-family: 'Tahoma', sans-serif;
    font-size: 12px;
`;

const ButtonArea = styled.div`
  padding: 10px;
  display: flex;
  justify-content: flex-end; /* XP Input dialog usually has buttons on the right or center. Let's align right or follow Alert style. */
  gap: 10px;
`;

const XPButton = styled.button`
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

const XPInput = ({ title, message, defaultValue = '', onOk, onCancel }) => {
    const [value, setValue] = useState(defaultValue);
    const inputRef = useRef(null);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, []);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            onOk(value);
        } else if (e.key === 'Escape') {
            onCancel();
        }
    };

    return (
        <Overlay onClick={(e) => { if(e.target === e.currentTarget) { /* block outside click */ } }}>
            <AlertWindow>
                <TitleBar>
                    <span>{title}</span>
                    <CloseButton onClick={onCancel}>×</CloseButton>
                </TitleBar>
                <ContentArea>
                    <MessageRow>
                         {/* Usually prompts don't have icons, but we can reuse the generic info icon or none. Let's verify prompt style.
                             Standard JS prompt is just text and input. But XP style dialogs usually have icons.
                             Let's skip icon for prompt to keep it simple or assume question.
                         */}
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
                    <XPButton onClick={() => onOk(value)}>确定</XPButton>
                    <XPButton onClick={onCancel}>取消</XPButton>
                </ButtonArea>
            </AlertWindow>
        </Overlay>
    );
};

export default XPInput;
