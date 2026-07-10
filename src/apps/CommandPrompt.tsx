import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useFileSystem } from '../context/FileSystemContext';
import { useXPEventBus } from '../context/EventBusContext';
import { useApp } from '../hooks/useApp';
import { isFileContentNode, isContainerNode, FileNode } from '../types';
import { parseCmdArgs, resolveCmdPath } from '../utils/commandPath';

const DRIVE_ROOT = ['root', '我的电脑', '本地磁盘 (C:)'] as const;
const PROTECTED_FOLDERS = ['Windows', 'WINDOWS', 'Program Files'];

const Container = styled.div`
  font-family: 'Perfect DOS VGA 437 Win', 'Lucida Console', 'Courier New', monospace;
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
  const { i18n } = useTranslation();
  const isChinese = i18n.language === 'zh';
  const localize = (english: string, chinese: string) => (isChinese ? chinese : english);
  const banner = localize(
    'Microsoft Windows XP [Version 5.1.2600]\n(C) Copyright 1985-2001 Microsoft Corp.\n\n',
    'Microsoft Windows XP [版本 5.1.2600]\n(C) 版权所有 1985-2001 Microsoft Corp.\n\n'
  );
  const { getFile, createFolder, deleteFolder, renameFile, copyFile, deleteFile } = useFileSystem();
  const bus = useXPEventBus();
  const api = useApp(windowId);
  const [output, setOutput] = useState<string>(banner);
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

  const resolvePath = (path: string): string[] => resolveCmdPath(path, currentPath, DRIVE_ROOT);

  const formatSize = (size?: number) => {
    if (!size) return '0';
    return size.toLocaleString();
  };

  const formatDate = () => {
    const now = new Date();
    return (
      now.toLocaleDateString(isChinese ? 'zh-CN' : 'en-US') +
      '  ' +
      now.toLocaleTimeString(isChinese ? 'zh-CN' : 'en-US', { hour: '2-digit', minute: '2-digit' })
    );
  };

  const executeCommand = (cmd: string): string => {
    const trimmed = cmd.trim();
    if (!trimmed) return '';

    const [command, ...args] = parseCmdArgs(trimmed);
    const lowerCmd = command.toLowerCase();
    const syntaxError = localize('The syntax of the command is incorrect.\n', '语法不正确。\n');
    const pathNotFound = localize(
      'The system cannot find the path specified.\n',
      '系统找不到指定的路径。\n'
    );
    const fileNotFound = localize(
      'The system cannot find the file specified.\n',
      '系统找不到指定的文件。\n'
    );
    const accessDenied = localize('Access is denied.\n', '拒绝访问。\n');

    switch (lowerCmd) {
      case 'help':
        return localize(
          `For more information on a specific command, type HELP command-name
CLS         Clears the screen.
COPY        Copies one or more files to another location.
DATE        Displays or sets the date.
DEL         Deletes one or more files.
DIR         Displays a list of files and subdirectories.
ECHO        Displays messages, or turns command echoing on or off.
EXIT        Quits the CMD.EXE program.
HELP        Provides Help information for Windows commands.
MD          Creates a directory.
PING        Tests a network connection.
RD          Removes a directory.
REN         Renames a file.
TIME        Displays or sets the system time.
TREE        Graphically displays the directory structure.
TYPE        Displays the contents of a text file.
VER         Displays the Windows version.
VOL         Displays a disk volume label and serial number.`,
          `有关某个命令的详细信息，请键入 HELP 命令名
CLS         清除屏幕。
COPY        将至少一个文件复制到另一个位置。
DATE        显示或设置日期。
DEL         删除至少一个文件。
DIR         显示目录中的文件和子目录列表。
ECHO        显示消息，或将命令回显打开或关闭。
EXIT        退出 CMD.EXE 程序(命令解释程序)。
HELP        提供 Windows 命令的帮助信息。
MD          创建目录。
PING        测试网络连接。
RD          删除目录。
REN         重命名文件。
TIME        显示或设置系统时间。
TREE        以图形显示驱动器或路径的目录结构。
TYPE        显示文本文件的内容。
VER         显示 Windows 版本。
VOL         显示磁盘卷标和序列号。`
        );

      case 'cls':
        return '__CLEAR__';

      case 'ver':
        return localize(
          '\nMicrosoft Windows XP [Version 5.1.2600]\n',
          '\nMicrosoft Windows XP [版本 5.1.2600]\n'
        );

      case 'date': {
        const now = new Date();
        const days = ['日', '一', '二', '三', '四', '五', '六'];
        return isChinese
          ? `当前日期是: ${now.toLocaleDateString('zh-CN')} 星期${days[now.getDay()]}`
          : `The current date is: ${now.toLocaleDateString('en-US')}`;
      }

      case 'time': {
        const now = new Date();
        return localize(
          `The current time is: ${now.toLocaleTimeString('en-US')}`,
          `当前时间是: ${now.toLocaleTimeString('zh-CN')}`
        );
      }

      case 'vol':
        return localize(
          ' Volume in drive C is Windows\n Volume Serial Number is 0C5E-1D5A\n',
          ' 驱动器 C 中的卷是 Windows\n 卷的序列号是 0C5E-1D5A\n'
        );

      case 'dir': {
        const targetPath = args[0] ? resolvePath(args[0]) : currentPath;
        const folder = getFile(targetPath);

        if (!folder || folder.type === 'file') {
          return localize('File Not Found\n', '找不到文件\n');
        }

        if (!('children' in folder)) {
          return localize('File Not Found\n', '找不到文件\n');
        }

        const entries = Object.entries(folder.children);
        const displayPath = targetPath.slice(DRIVE_ROOT.length);
        const dirLabel = displayPath.length ? `C:\\${displayPath.join('\\')}` : 'C:\\';
        let result = localize(`\n Directory of ${dirLabel}\n\n`, `\n ${dirLabel} 的目录\n\n`);

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

        result += localize(
          `             ${fileCount} File(s)    ${formatSize(totalSize)} bytes\n`,
          `             ${fileCount} 个文件    ${formatSize(totalSize)} 字节\n`
        );
        result += localize(
          `             ${dirCount} Dir(s)\n`,
          `             ${dirCount} 个目录  可用字节\n`
        );
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
          return pathNotFound;
        }

        setCurrentPath(newPath);
        return '';
      }

      case 'type': {
        if (!args[0]) {
          return syntaxError;
        }

        const filePath = resolvePath(args[0]);
        const file = getFile(filePath);

        if (!file) {
          return localize(
            `The system cannot find the file specified - ${args[0]}\n`,
            `系统找不到指定的文件 - ${args[0]}\n`
          );
        }

        if (file.type === 'folder') {
          return accessDenied;
        }

        if (!isFileContentNode(file) || file.content === undefined) {
          return localize('This file type cannot be read.\n', '无法读取此文件类型。\n');
        }

        return (file.content || '') + '\n';
      }

      case 'echo': {
        if (!args.length) {
          return localize('ECHO is on.\n', 'ECHO 处于打开状态。\n');
        }
        return args.join(' ') + '\n';
      }

      case 'md':
      case 'mkdir': {
        if (!args[0]) {
          return syntaxError;
        }

        const targetPath = resolvePath(args[0]);
        const parentPath = targetPath.slice(0, -1);
        const folderName = targetPath[targetPath.length - 1];

        if (!folderName) {
          return syntaxError;
        }

        const parent = getFile(parentPath);
        if (!parent || !isContainerNode(parent)) {
          return pathNotFound;
        }

        if (parent.locked) {
          return accessDenied;
        }

        if (getFile(targetPath)) {
          return localize('A subdirectory or file already exists.\n', '子目录或文件 已存在。\n');
        }

        createFolder(parentPath, folderName);
        return '';
      }

      case 'rd':
      case 'rmdir': {
        if (!args[0]) {
          return syntaxError;
        }

        const targetPath = resolvePath(args[0]);
        const parentPath = targetPath.slice(0, -1);
        const folderName = targetPath[targetPath.length - 1];
        const folder = getFile(targetPath);
        const parent = getFile(parentPath);

        if (!folder) {
          return fileNotFound;
        }

        if (folder.type !== 'folder') {
          return localize('The directory name is invalid.\n', '目录名称无效。\n');
        }

        if (
          folder.locked ||
          parent?.locked ||
          (PROTECTED_FOLDERS.includes(folderName) && parentPath.length === DRIVE_ROOT.length)
        ) {
          return accessDenied;
        }

        if (isContainerNode(folder) && Object.keys(folder.children || {}).length > 0) {
          return localize('The directory is not empty.\n', '目录不是空的。\n');
        }

        deleteFolder(parentPath, folderName);
        return '';
      }

      case 'ren':
      case 'rename': {
        if (args.length < 2) {
          return syntaxError;
        }

        const sourcePath = resolvePath(args[0]);
        const sourceName = sourcePath[sourcePath.length - 1];
        const parentPath = sourcePath.slice(0, -1);
        const targetName = args[1].replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
        const source = getFile(sourcePath);

        if (!source) {
          return fileNotFound;
        }

        if (/[\\/]/.test(targetName)) {
          return syntaxError;
        }

        if (
          source.locked ||
          (source.type === 'folder' &&
            PROTECTED_FOLDERS.includes(sourceName) &&
            parentPath.length === DRIVE_ROOT.length)
        ) {
          return accessDenied;
        }

        const parent = getFile(parentPath);
        if (!parent || !isContainerNode(parent)) {
          return pathNotFound;
        }

        if (parent.locked) {
          return accessDenied;
        }

        if (parent.children?.[targetName]) {
          return localize(
            'A file with the same name already exists.\n',
            '当文件已存在时，无法创建该文件。\n'
          );
        }

        renameFile(parentPath, sourceName, targetName);
        return '';
      }

      case 'copy': {
        if (args.length < 2) {
          return syntaxError;
        }

        const sourcePath = resolvePath(args[0]);
        const destPath = resolvePath(args[1]);
        const sourceName = sourcePath[sourcePath.length - 1];
        const sourceParent = sourcePath.slice(0, -1);
        const source = getFile(sourcePath);
        const sourceParentNode = getFile(sourceParent);

        if (!source) {
          return fileNotFound;
        }

        if (source.type === 'folder' || sourceParentNode?.locked) {
          return accessDenied;
        }

        let destParent: string[];
        let destName: string;
        const destNode = getFile(destPath);

        if (destNode && destNode.type === 'folder' && isContainerNode(destNode)) {
          destParent = destPath;
          destName = sourceName;
        } else {
          destName = destPath[destPath.length - 1] || sourceName;
          destParent = destPath.slice(0, -1);
        }

        const destParentNode = getFile(destParent);
        if (!destParentNode || !isContainerNode(destParentNode)) {
          return pathNotFound;
        }

        if (destParentNode.locked || destParentNode.children?.[destName]) {
          return accessDenied;
        }

        copyFile(sourceParent, sourceName, destParent, destName);
        return localize('        1 file(s) copied.\n', '        1 个文件已被复制。\n');
      }

      case 'del': {
        if (!args[0]) {
          return syntaxError;
        }

        const targetPath = resolvePath(args[0]);
        const fileName = targetPath[targetPath.length - 1];
        const parentPath = targetPath.slice(0, -1);
        const target = getFile(targetPath);
        const parent = getFile(parentPath);

        if (!target) {
          return fileNotFound;
        }

        if (target.type === 'folder' || parent?.locked) {
          return accessDenied;
        }

        deleteFile(parentPath, fileName);
        return '';
      }

      case 'tree': {
        const targetPath = args[0] ? resolvePath(args[0]) : currentPath;
        const folder = getFile(targetPath);

        if (!folder || !isContainerNode(folder)) {
          return pathNotFound;
        }

        const buildTree = (node: FileNode, prefix: string): string => {
          if (!isContainerNode(node) || !node.children) return '';
          const entries = Object.entries(node.children).filter(
            ([, child]) => child.type === 'folder'
          );
          let result = '';
          for (let i = 0; i < entries.length; i++) {
            const [name, child] = entries[i];
            const isLast = i === entries.length - 1;
            result += `${prefix}${isLast ? '└──' : '├──'}${name}\n`;
            result += buildTree(child, prefix + (isLast ? '    ' : '│   '));
          }
          return result;
        };

        const displayPath = targetPath.slice(DRIVE_ROOT.length);
        const label = displayPath.length ? `C:\\${displayPath.join('\\')}` : 'C:\\';
        return localize(
          `Folder PATH listing\nVolume serial number is 0C5E-1D5A\n${label}\n${buildTree(folder, '')}`,
          `文件夹 PATH 列表\n卷序列号为 0C5E-1D5A\n${label}\n${buildTree(folder, '')}`
        );
      }

      case 'ping': {
        if (!args[0]) {
          return localize(
            'Usage: ping [-t] [-a] [-n count] [-l size] destination\n',
            '用法: ping [-t] [-a] [-n count] [-l size] destination\n'
          );
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
          localize(
            'Ethernet adapter Local Area Connection:\n\n',
            'Ethernet adapter 本地连接:\n\n'
          ) +
          `   Connection-specific DNS Suffix  . : \n` +
          `   IP Address. . . . . . . . . . . . : 192.168.1.100\n` +
          `   Subnet Mask. . . . . . . . . . . . : 255.255.255.0\n` +
          `   Default Gateway. . . . . . . . . . . . : 192.168.1.1\n`
        );

      default:
        return localize(
          `'${command}' is not recognized as an internal or external command, operable program or batch file.\n`,
          `'${command}' 不是内部或外部命令，也不是可运行的程序或批处理文件。\n`
        );
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

      bus.emit({ type: 'cmd:exec', command });
      const result = executeCommand(command);

      if (result === '__CLEAR__') {
        setOutput(banner);
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
