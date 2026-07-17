import { isFileContentNode, isContainerNode, FileNode } from '../../types';
import { parseCmdArgs, resolveCmdPath } from '../../utils/commandPath';
import { triggerBsod } from '../../utils/easterEggs';
import {
  CMD_COLORS,
  CMD_DEFAULT_TEXT,
  CMD_MATRIX_GREEN,
  DRIVE_ROOT,
  PROTECTED_FOLDERS,
} from './constants';
import type { CmdContext } from './types';

/**
 * CommandPrompt interpreter (#163/A+E), extracted verbatim from the app so the
 * command set is a pure, unit-testable function. Side effects (cd, color, fs
 * mutations, the BSOD egg) go through the injected {@link CmdContext}; `cls`
 * and `exit` are signalled to the caller via these sentinels.
 */
export const CMD_CLEAR = '__CLEAR__';
export const CMD_EXIT = '__EXIT__';

export function executeCommand(cmd: string, ctx: CmdContext): string {
  const {
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
  } = ctx;

  const localize = (english: string, chinese: string) => (isChinese ? chinese : english);
  const resolvePath = (path: string): string[] => resolveCmdPath(path, currentPath, DRIVE_ROOT);
  const formatSize = (size?: number) => (!size ? '0' : size.toLocaleString());
  const formatDate = () => {
    const now = new Date();
    return (
      now.toLocaleDateString(isChinese ? 'zh-CN' : 'en-US') +
      '  ' +
      now.toLocaleTimeString(isChinese ? 'zh-CN' : 'en-US', { hour: '2-digit', minute: '2-digit' })
    );
  };

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
COLOR       Sets the default console foreground and background colors.
COPY        Copies one or more files to another location.
DATE        Displays or sets the date.
DEL         Deletes one or more files.
DIR         Displays a list of files and subdirectories.
ECHO        Displays messages, or turns command echoing on or off.
EXIT        Quits the CMD.EXE program.
FORMAT      Formats a disk for use with Windows.
HELP        Provides Help information for Windows commands.
MD          Creates a directory.
PING        Tests a network connection.
RD          Removes a directory.
REN         Renames a file.
TELNET      Communicates with a Telnet server.
TIME        Displays or sets the system time.
TREE        Graphically displays the directory structure.
TYPE        Displays the contents of a text file.
VER         Displays the Windows version.
VOL         Displays a disk volume label and serial number.`,
        `有关某个命令的详细信息，请键入 HELP 命令名
CLS         清除屏幕。
COLOR       设置默认的控制台前景和背景颜色。
COPY        将至少一个文件复制到另一个位置。
DATE        显示或设置日期。
DEL         删除至少一个文件。
DIR         显示目录中的文件和子目录列表。
ECHO        显示消息，或将命令回显打开或关闭。
EXIT        退出 CMD.EXE 程序(命令解释程序)。
FORMAT      格式化磁盘以配合 Windows 使用。
HELP        提供 Windows 命令的帮助信息。
MD          创建目录。
PING        测试网络连接。
RD          删除目录。
REN         重命名文件。
TELNET      与 Telnet 服务器通信。
TIME        显示或设置系统时间。
TREE        以图形显示驱动器或路径的目录结构。
TYPE        显示文本文件的内容。
VER         显示 Windows 版本。
VOL         显示磁盘卷标和序列号。`
      );

    case 'cls':
      return CMD_CLEAR;

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
      return CMD_EXIT;

    // ── Easter eggs (#85) ────────────────────────────────────────────────
    case 'color': {
      const codes = CMD_COLORS;
      const code = (args[0] || '').toLowerCase();
      if (!code) {
        setTextColor(CMD_DEFAULT_TEXT);
        return '';
      }
      // XP `color BF`: B = background, F = foreground. Single digit = foreground.
      const fg = code.length >= 2 ? code[1] : code[0];
      if (codes[fg]) {
        setTextColor(codes[fg]);
        return '';
      }
      return localize('The specified color is invalid.\n', '指定的颜色无效。\n');
    }

    case 'matrix':
      setTextColor(CMD_MATRIX_GREEN);
      return (
        '\n01001101 01100001 01110100 01110010 01101001 01111000\n' +
        '  ｱ0ﾃ1ﾔｷ ﾘ01ﾈ ﾂ1ｦ0ﾏ ﾗ0ｻ1ﾃ 0ﾘ1ｦ ﾂﾔ01ﾉ\n' +
        '  0ﾆ1ｳ0 ﾑ01ﾜ ｦ1ﾂ0ﾋ 0ﾚ1ﾔ ﾈ01ｻ ﾏﾂ0ﾞ1\n' +
        '  1ﾟ0ｴ1 ﾜ10ﾆ ﾂ0ﾉ1ｦ ﾞ01ﾔ ﾗ10ｻ ﾃﾂ1ﾈ0\n' +
        '\n' +
        localize('Wake up, Neo...\n', '醒醒，Neo……\n')
      );

    case 'telnet': {
      const host = (args[0] || '').toLowerCase();
      if (host.includes('towel.blinkenlights')) {
        return (
          '\n         Star Wars: Episode IV\n' +
          '            A NEW HOPE\n\n' +
          '   It is a period of civil war.\n' +
          '   Rebel spaceships, striking\n' +
          '   from a hidden base, have won\n' +
          '   their first victory against\n' +
          '   the evil Galactic Empire.\n\n' +
          '        .-.\n' +
          '       (o o)   ~ May the Force be with you ~\n' +
          '        |=|\n' +
          '       __|__\n'
        );
      }
      if (!host) {
        return localize('Usage: telnet host\n', '用法: telnet host\n');
      }
      return localize(
        `Connecting To ${args[0]}...Could not open connection to the host.\n`,
        `正在连接 ${args[0]}……无法打开到主机的连接。\n`
      );
    }

    case 'format': {
      const target = (args[0] || '').toLowerCase();
      if (/^[a-z]:$/.test(target)) {
        // The classic "don't run this" command: crash into the BSOD after the
        // warning renders. Clicking the blue screen fake-reboots the machine.
        setTimeout(triggerBsod, 600);
        return localize(
          `\nWARNING, ALL DATA ON NON-REMOVABLE DISK\nDRIVE ${target.toUpperCase()} WILL BE LOST!\nProceed with Format (Y/N)? y\n\nFormatting...\n`,
          `\n警告: 驱动器 ${target.toUpperCase()} 上的所有数据\n都将丢失！\n是否继续格式化 (Y/N)? y\n\n正在格式化...\n`
        );
      }
      return localize(
        'Required parameter missing: drive letter (e.g. format c:)\n',
        '缺少必需的参数: 驱动器盘符 (例如 format c:)\n'
      );
    }

    case 'ipconfig':
      return (
        `\nWindows IP Configuration\n\n` +
        localize('Ethernet adapter Local Area Connection:\n\n', 'Ethernet adapter 本地连接:\n\n') +
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
}
