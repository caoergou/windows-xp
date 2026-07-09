import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useFileSystem } from '../context/FileSystemContext';
import { useApp } from '../hooks/useApp';
import { isFileContentNode } from '../types';

const DRIVE_ROOT = ['root', '我的电脑', '本地磁盘 (C:)'] as const;

const Container = styled.div`
  font-family: 'Lucida Console', 'Courier New', monospace;
  font-size: 12px;
  background: #000000;
  color: #c0c0c0;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 2px 0;
  box-sizing: border-box;
`;

const Output = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  white-space: pre-wrap;
  word-wrap: break-word;
  padding: 0 6px;
  min-height: 0;
`;

const InputLine = styled.div`
  display: flex;
  align-items: center;
  flex-shrink: 0;
  padding: 0 6px;
  background: #000000;
`;

const Prompt = styled.span`
  color: #c0c0c0;
  white-space: pre;
  flex-shrink: 0;
`;

const Input = styled.input`
  flex: 1;
  min-width: 0;
  background: #000000 !important;
  border: none !important;
  box-shadow: none !important;
  border-radius: 0 !important;
  color: #c0c0c0;
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
  outline: none;
  padding: 0;
  margin: 0;
  caret-color: #c0c0c0;

  &:focus,
  &:focus-visible {
    outline: none !important;
    box-shadow: none !important;
  }
`;

interface CommandHistory {
  command: string;
}

interface CommandPromptProps {
  windowId?: string;
}

const CommandPrompt = ({ windowId = '' }: CommandPromptProps) => {
  const { getFile } = useFileSystem();
  const api = useApp(windowId);
  const [output, setOutput] = useState<string>(
    'Microsoft Windows XP [版本 5.1.2600]\n(C) 版权所有 1985-2001 Microsoft Corp.\n\n'
  );
  const [input, setInput] = useState<string>('');
  const [currentPath, setCurrentPath] = useState<string[]>([...DRIVE_ROOT]);
  const [history, setHistory] = useState<CommandHistory[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
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

  const resolvePath = (path: string): string[] => {
    if (path === '\\' || path === '/') {
      return [...DRIVE_ROOT];
    }

    if (path.startsWith('C:') || path.startsWith('c:')) {
      const stripped = path.slice(2).replace(/^[\\/]+/, '');
      if (!stripped) return [...DRIVE_ROOT];
      const parts = stripped.split(/[\\/]/).filter(Boolean);
      return [...DRIVE_ROOT, ...parts];
    }

    if (path.startsWith('\\') || path.startsWith('/')) {
      const parts = path.split(/[\\/]/).filter(Boolean);
      return ['root', ...parts];
    }

    const parts = path.split(/[\\/]/).filter(Boolean);
    return [...currentPath, ...parts];
  };

  const formatSize = (size?: number) => {
    if (!size) return '0';
    return size.toLocaleString();
  };

  const formatDate = () => {
    const now = new Date();
    return (
      now.toLocaleDateString('zh-CN') +
      '  ' +
      now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    );
  };

  const executeCommand = (cmd: string): string => {
    const trimmed = cmd.trim();
    if (!trimmed) return '';

    const [command, ...args] = trimmed.split(/\s+/);
    const lowerCmd = command.toLowerCase();

    switch (lowerCmd) {
      case 'help':
        return `有关某个命令的详细信息，请键入 HELP 命令名
CLS         清除屏幕。
DATE        显示或设置日期。
DIR         显示目录中的文件和子目录列表。
ECHO        显示消息，或将命令回显打开或关闭。
EXIT        退出 CMD.EXE 程序(命令解释程序)。
HELP        提供 Windows 命令的帮助信息。
MD          创建目录。
PING        测试网络连接。
RD          删除目录。
REN         重命名文件。
TIME        显示或设置系统时间。
TYPE        显示文本文件的内容。
VER         显示 Windows 版本。
VOL         显示磁盘卷标和序列号。`;

      case 'cls':
        return '__CLEAR__';

      case 'ver':
        return '\nMicrosoft Windows XP [版本 5.1.2600]\n';

      case 'date': {
        const now = new Date();
        const days = ['日', '一', '二', '三', '四', '五', '六'];
        return `当前日期是: ${now.toLocaleDateString('zh-CN')} 星期${days[now.getDay()]}`;
      }

      case 'time': {
        const now = new Date();
        return `当前时间是: ${now.toLocaleTimeString('zh-CN')}`;
      }

      case 'vol':
        return ' 驱动器 C 中的卷是 Windows\n 卷的序列号是 0C5E-1D5A\n';

      case 'dir': {
        const targetPath = args[0] ? resolvePath(args[0]) : currentPath;
        const folder = getFile(targetPath);

        if (!folder || folder.type === 'file') {
          return '找不到文件\n';
        }

        if (!('children' in folder)) {
          return '找不到文件\n';
        }

        const entries = Object.entries(folder.children);
        const displayPath = targetPath.slice(DRIVE_ROOT.length);
        const dirLabel = displayPath.length ? `C:\\${displayPath.join('\\')}` : 'C:\\';
        let result = `\n ${dirLabel} 的目录\n\n`;

        let fileCount = 0;
        let dirCount = 0;
        let totalSize = 0;

        for (const [name, item] of entries) {
          if (item.type === 'folder') {
            result += `${formatDate()}    <DIR>          ${name}\n`;
            dirCount++;
          } else {
            const fileContent = isFileContentNode(item) ? item.content : undefined;
            const size = fileContent?.length || 0;
            result += `${formatDate()}             ${formatSize(size)} ${name}\n`;
            fileCount++;
            totalSize += size;
          }
        }

        result += `             ${fileCount} 个文件    ${formatSize(totalSize)} 字节\n`;
        result += `             ${dirCount} 个目录  可用字节\n`;
        return result;
      }

      case 'cd':
      case 'chdir': {
        if (!args[0]) {
          const relative = currentPath.slice(DRIVE_ROOT.length);
          return (relative.length ? `C:\\${relative.join('\\')}` : 'C:\\') + '\n';
        }

        if (args[0] === '..') {
          if (currentPath.length > DRIVE_ROOT.length) {
            setCurrentPath(currentPath.slice(0, -1));
          }
          return '';
        }

        if (args[0] === '\\' || args[0] === '/') {
          setCurrentPath([...DRIVE_ROOT]);
          return '';
        }

        const newPath = resolvePath(args[0]);
        const folder = getFile(newPath);

        if (!folder || folder.type === 'file' || !('children' in folder)) {
          return `系统找不到指定的路径。\n`;
        }

        setCurrentPath(newPath);
        return '';
      }

      case 'type': {
        if (!args[0]) {
          return '语法不正确。\n';
        }

        const filePath = resolvePath(args[0]);
        const file = getFile(filePath);

        if (!file) {
          return `系统找不到指定的文件 - ${args[0]}\n`;
        }

        if (file.type === 'folder') {
          return `拒绝访问。\n`;
        }

        if (!isFileContentNode(file) || file.content === undefined) {
          return `无法读取此文件类型。\n`;
        }

        return (file.content || '') + '\n';
      }

      case 'echo': {
        if (!args.length) {
          return 'ECHO 处于打开状态。\n';
        }
        return args.join(' ') + '\n';
      }

      case 'md':
      case 'mkdir':
        return `目录已存在或无法创建。\n`;

      case 'rd':
      case 'rmdir':
        return `目录不是空的。\n`;

      case 'ren':
        return args.length < 2 ? '语法不正确。\n' : '拒绝访问。\n';

      case 'ping': {
        if (!args[0]) {
          return '用法: ping [-t] [-a] [-n count] [-l size] destination\n';
        }
        const host = args[0];
        return (
          `\nPinging ${host} [127.0.0.1] with 32 bytes of data:\n\n` +
          `Reply from 127.0.0.1: bytes=32 time<1ms TTL=128\n` +
          `Reply from 127.0.0.1: bytes=32 time<1ms TTL=128\n` +
          `Reply from 127.0.0.1: bytes=32 time<1ms TTL=128\n` +
          `Reply from 127.0.0.1: bytes=32 time<1ms TTL=128\n\n` +
          `Ping statistics for 127.0.0.1:\n` +
          `    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),\n` +
          `Approximate round trip times in milli-seconds:\n` +
          `    Minimum = 0ms, Maximum = 0ms, Average = 0ms\n`
        );
      }

      case 'exit':
        return '__EXIT__';

      case 'ipconfig':
        return (
          `\nWindows IP Configuration\n\n` +
          `Ethernet adapter 本地连接:\n\n` +
          `   Connection-specific DNS Suffix  . : \n` +
          `   IP Address. . . . . . . . . . . . : 192.168.1.100\n` +
          `   Subnet Mask . . . . . . . . . . . : 255.255.255.0\n` +
          `   Default Gateway . . . . . . . . . : 192.168.1.1\n`
        );

      default:
        return `'${command}' 不是内部或外部命令，也不是可运行的程序或批处理文件。\n`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const command = input;
      const prompt = getPrompt();

      if (command.trim()) {
        setHistory(prev => [...prev, { command }]);
        setHistoryIndex(-1);
      }

      const result = executeCommand(command);

      if (result === '__CLEAR__') {
        setOutput(
          'Microsoft Windows XP [版本 5.1.2600]\n(C) 版权所有 1985-2001 Microsoft Corp.\n\n'
        );
      } else if (result === '__EXIT__') {
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
    <Container onClick={() => inputRef.current?.focus()}>
      <Output ref={outputRef}>{output}</Output>
      <InputLine>
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
      </InputLine>
    </Container>
  );
};

export default CommandPrompt;
