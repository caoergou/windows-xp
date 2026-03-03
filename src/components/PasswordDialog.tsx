import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
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

const DialogWindow = styled.div`
  width: 380px;
  background-color: #ECE9D8;
  border: 1px solid #0055EA;
  border-radius: 3px;
  box-shadow: 2px 2px 5px rgba(0,0,0,0.3);
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

  &:hover { filter: brightness(1.1); }
  &:active { filter: brightness(0.9); box-shadow: inset 1px 1px 1px rgba(0,0,0,0.5); }
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
  font-family: 'Tahoma', sans-serif;
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

const Button = styled.button`
  min-width: 75px;
  height: 23px;
  background: #ECE9D8;
  border: 1px solid #003C74;
  border-radius: 2px;
  font-family: 'Tahoma', sans-serif;
  font-size: 12px;
  cursor: pointer;
  box-shadow: inset 1px 1px 0px white, 1px 1px 2px rgba(0,0,0,0.2);

  &:hover { background: #f5f2e4; }
  &:active { box-shadow: inset 1px 1px 1px rgba(0,0,0,0.2); }
  &:focus { outline: 1px dotted black; outline-offset: -4px; }
`;

interface PasswordDialogProps {
  title?: string;
  message?: string;
  hint?: string;
  correctPassword: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const PasswordDialog: React.FC<PasswordDialogProps> = ({
  title = '请输入密码',
  message = '此内容已加密，请输入密码访问。',
  hint = '',
  correctPassword,
  onSuccess,
  onCancel,
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    if (!password) { setError('请输入密码'); return; }

    if (password === correctPassword) {
      sounds.ding();
      onSuccess();
    } else {
      sounds.error();
      setError('密码错误，请重试');
      setPassword('');
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
    else if (e.key === 'Escape') onCancel();
  };

  return (
    <Overlay>
      <DialogWindow>
        <TitleBar>
          <span>{title}</span>
          <CloseButton onClick={onCancel}>×</CloseButton>
        </TitleBar>
        <ContentArea>
          <MessageRow>
            <XPIcon name="lock" size={32} />
            <div style={{ flex: 1 }}>
              <Message>{message}</Message>
              {hint && <HintText>提示：{hint}</HintText>}
            </div>
          </MessageRow>
          <div>
            <PasswordInput
              ref={inputRef}
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              onKeyDown={handleKeyDown}
              placeholder="输入密码..."
            />
            <ErrorText>{error}</ErrorText>
          </div>
        </ContentArea>
        <ButtonArea>
          <Button onClick={onCancel}>取消</Button>
          <Button onClick={handleSubmit}>确定</Button>
        </ButtonArea>
      </DialogWindow>
    </Overlay>
  );
};

export default PasswordDialog;
