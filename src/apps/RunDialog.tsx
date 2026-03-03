import React, { useState } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-family: Tahoma, Arial, sans-serif;
  font-size: 12px;
`;

const Label = styled.label`
  font-weight: bold;
  margin-bottom: 4px;
`;

const InputContainer = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const Input = styled.input`
  flex: 1;
  padding: 4px;
  border: 1px solid #7f9db9;
  border-radius: 2px;
  font-size: 12px;

  &:focus {
    outline: none;
    border-color: #000080;
    box-shadow: 0 0 0 1px #000080;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
`;

const Button = styled.button`
  padding: 4px 12px;
  font-size: 12px;
  background: linear-gradient(to bottom, #ffffff, #ece9d8);
  border: 1px solid #7f9db9;
  border-radius: 2px;
  cursor: pointer;

  &:hover {
    background: linear-gradient(to bottom, #f0f0f0, #dcd9c9);
  }

  &:active {
    background: linear-gradient(to bottom, #ece9d8, #ffffff);
  }
`;

interface RunDialogProps {
  onClose?: () => void;
}

const RunDialog = ({ onClose }: RunDialogProps) => {
  const [command, setCommand] = useState<string>('');

  const handleOk = () => {
    if (command.trim()) {
      console.log('Running command:', command);
    }
    onClose?.();
  };

  const handleCancel = () => {
    onClose?.();
  };

  return (
    <Container>
      <Label>打开(&O)：</Label>
      <InputContainer>
        <Input
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="输入要运行的程序、文件夹、文档或 Internet 资源的名称..."
          autoFocus
        />
      </InputContainer>
      <ButtonContainer>
        <Button onClick={handleOk}>确定</Button>
        <Button onClick={handleCancel}>取消</Button>
      </ButtonContainer>
    </Container>
  );
};

export default RunDialog;
