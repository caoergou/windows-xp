import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useFileSystem } from '../../context/FileSystemContext';
import { useXPEventBus } from '../../context/EventBusContext';
import { useApp } from '../../hooks/useApp';
import { Container, CurrentLine, Prompt, Input } from './styled';
import { DRIVE_ROOT, buildBanner } from './constants';
import { executeCommand, CMD_CLEAR, CMD_EXIT } from './commands';
import type { CommandHistory, CommandPromptProps } from './types';

const CommandPrompt = ({ windowId = '' }: CommandPromptProps) => {
  const { i18n } = useTranslation();
  const isChinese = i18n.language === 'zh';
  const banner = buildBanner(isChinese);
  const { getFile, createFolder, deleteFolder, renameFile, copyFile, deleteFile } = useFileSystem();
  const bus = useXPEventBus();
  const api = useApp(windowId);
  const [output, setOutput] = useState<string>(banner);
  const [input, setInput] = useState<string>('');
  const [currentPath, setCurrentPath] = useState<string[]>([...DRIVE_ROOT]);
  const [history, setHistory] = useState<CommandHistory[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [textColor, setTextColor] = useState<string>('#c0c0c0');
  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const getPrompt = () => {
    const relative = currentPath.slice(DRIVE_ROOT.length);
    return relative.length ? `C:\\${relative.join('\\')}>` : 'C:\\>';
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const command = input;
      const prompt = getPrompt();

      if (command.trim()) {
        setHistory(prev => [...prev, { command }]);
        setHistoryIndex(-1);
      }

      bus.emit({ type: 'cmd:exec', command });
      const result = executeCommand(command, {
        currentPath,
        isChinese,
        getFile,
        createFolder,
        deleteFolder,
        renameFile,
        copyFile,
        deleteFile,
        setCurrentPath,
        setTextColor,
      });

      if (result === CMD_CLEAR) {
        setOutput(banner);
      } else if (result === CMD_EXIT) {
        setOutput(prev => prev + prompt + command + '\n');
        api.window.close();
      } else {
        setOutput(prev => prev + prompt + command + '\n' + result);
      }

      setInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const newIndex = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setInput(history[newIndex].command);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= history.length) {
          setHistoryIndex(-1);
          setInput('');
        } else {
          setHistoryIndex(newIndex);
          setInput(history[newIndex].command);
        }
      }
    }
  };

  return (
    <Container ref={outputRef} $color={textColor} onClick={() => inputRef.current?.focus()}>
      {output}
      <CurrentLine>
        <Prompt>{getPrompt()}</Prompt>
        <Input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          aria-label="Command input"
        />
      </CurrentLine>
    </Container>
  );
};

export default CommandPrompt;
