import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  padding: 4px;
  font-family: 'Consolas', 'Courier New', monospace;
  font-size: 12px;
  background: #000080;
  color: #ffffff;
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const Output = styled.div`
  flex: 1;
  overflow-y: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
  padding: 4px;
`;

const InputContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
`;

const Prompt = styled.span`
  color: #ffffff;
  font-weight: bold;
`;

const Input = styled.input`
  flex: 1;
  background: transparent;
  border: none;
  color: #ffffff;
  font-family: inherit;
  font-size: inherit;
  outline: none;

  &::placeholder {
    color: #cccccc;
  }
`;

const CommandPrompt = () => {
  const [output, setOutput] = useState<string>('Microsoft Windows XP [版本 5.1.2600]\n(C) 版权所有 1985-2001 Microsoft Corp.\n\nC:\\Documents and Settings\\User>');
  const [input, setInput] = useState<string>('');
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const command = input.trim();
      let response = '';

      if (command) {
        if (command === 'help') {
          response = '可用命令: help, cls, date, time, ver';
        } else if (command === 'cls') {
          setOutput('Microsoft Windows XP [版本 5.1.2600]\n(C) 版权所有 1985-2001 Microsoft Corp.\n\nC:\\Documents and Settings\\User>');
          setInput('');
          return;
        } else if (command === 'ver') {
          response = 'Microsoft Windows XP [版本 5.1.2600]';
        } else if (command === 'date' || command === 'time') {
          response = new Date().toString();
        } else {
          response = `'${command}' 不是内部或外部命令，也不是可运行的程序或批处理文件。`;
        }
      }

      setOutput((prev) => `${prev}${input}\n${response}\nC:\\Documents and Settings\\User>`);
      setInput('');
    }
  };

  return (
    <Container>
      <Output ref={outputRef}>{output}</Output>
      <InputContainer>
        <Prompt>C:\Documents and Settings\User&gt;</Prompt>
        <Input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
      </InputContainer>
    </Container>
  );
};

export default CommandPrompt;
