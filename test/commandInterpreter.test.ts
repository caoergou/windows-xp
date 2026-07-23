/**
 * CommandPrompt interpreter unit tests (#163/A+E).
 *
 * The command set was extracted from the app into a pure `executeCommand(cmd,
 * ctx)` so it can be tested without rendering. Covers output, filesystem
 * side-effects, and the cd/color/cls/exit control paths.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeCommand, CMD_CLEAR, CMD_EXIT } from '../src/apps/CommandPrompt/commands';
import { DRIVE_ROOT } from '../src/apps/CommandPrompt/constants';
import type { CmdContext } from '../src/apps/CommandPrompt/types';
import type { FileNode } from '../src/types';

// A tiny C:\ fixture: a Docs folder with one text file, plus a protected Windows.
const tree: Record<string, FileNode> = {
  'C:': {
    type: 'folder',
    name: '本地磁盘 (C:)',
    children: {
      Docs: {
        type: 'folder',
        name: 'Docs',
        children: {
          'note.txt': { type: 'file', name: 'note.txt', content: 'hello world' } as FileNode,
        },
      } as FileNode,
      Windows: { type: 'folder', name: 'Windows', locked: true, children: {} } as FileNode,
    },
  } as FileNode,
};

const getFile = (path: string[]): FileNode | null => {
  // path is absolute from ['我的电脑','本地磁盘 (C:)', ...]
  if (path.length < DRIVE_ROOT.length) return null;
  let node: FileNode | undefined = tree['C:'];
  for (const seg of path.slice(DRIVE_ROOT.length)) {
    if (!node || !('children' in node) || !node.children) return null;
    node = node.children[seg];
  }
  return node ?? null;
};

let ctx: CmdContext;
let setCurrentPath: ReturnType<typeof vi.fn>;
let setTextColor: ReturnType<typeof vi.fn>;
let createFolder: ReturnType<typeof vi.fn>;
let deleteFolder: ReturnType<typeof vi.fn>;
let deleteFile: ReturnType<typeof vi.fn>;

beforeEach(() => {
  setCurrentPath = vi.fn();
  setTextColor = vi.fn();
  createFolder = vi.fn();
  deleteFolder = vi.fn();
  deleteFile = vi.fn();
  ctx = {
    currentPath: [...DRIVE_ROOT],
    isChinese: false,
    getFile,
    createFolder,
    deleteFolder,
    renameFile: vi.fn(),
    copyFile: vi.fn(),
    deleteFile,
    setCurrentPath,
    setTextColor,
  };
});

describe('CommandPrompt interpreter (#163)', () => {
  it('uses the same C: root shape as FileSystemContext', () => {
    expect(DRIVE_ROOT).toEqual(['我的电脑', '本地磁盘 (C:)']);
  });

  it('returns empty for blank input', () => {
    expect(executeCommand('   ', ctx)).toBe('');
  });

  it('reports unrecognized commands', () => {
    expect(executeCommand('frobnicate', ctx)).toMatch(/is not recognized/);
  });

  it('echo prints its arguments', () => {
    expect(executeCommand('echo hello there', ctx)).toBe('hello there\n');
  });

  it('ver reports the XP version', () => {
    expect(executeCommand('ver', ctx)).toMatch(/Version 5\.1\.2600/);
  });

  it('cls and exit signal via sentinels', () => {
    expect(executeCommand('cls', ctx)).toBe(CMD_CLEAR);
    expect(executeCommand('exit', ctx)).toBe(CMD_EXIT);
  });

  it('cd into an existing folder sets the working directory', () => {
    executeCommand('cd Docs', ctx);
    expect(setCurrentPath).toHaveBeenCalledWith([...DRIVE_ROOT, 'Docs']);
  });

  it('cd into a missing folder reports path-not-found and does not move', () => {
    const out = executeCommand('cd Nope', ctx);
    expect(out).toMatch(/cannot find the path/);
    expect(setCurrentPath).not.toHaveBeenCalled();
  });

  it('dir lists folder contents', () => {
    const out = executeCommand('dir Docs', ctx);
    expect(out).toMatch(/note\.txt/);
    expect(out).toMatch(/1 File\(s\)/);
  });

  it('dir at C:\\ lists the drive-root folders', () => {
    const out = executeCommand('dir', ctx);
    expect(out).toMatch(/Docs/);
    expect(out).toMatch(/Windows/);
  });

  it('type prints a file body', () => {
    expect(executeCommand('type Docs\\note.txt', ctx)).toBe('hello world\n');
  });

  it('color sets a valid foreground and rejects an invalid one', () => {
    executeCommand('color a', ctx);
    expect(setTextColor).toHaveBeenCalledWith('#00ff00');
    setTextColor.mockClear();
    const out = executeCommand('color z', ctx);
    expect(out).toMatch(/color is invalid/);
    expect(setTextColor).not.toHaveBeenCalled();
  });

  it('md creates a folder; rd on a protected/locked folder is denied', () => {
    executeCommand('md NewDir', ctx);
    expect(createFolder).toHaveBeenCalledWith([...DRIVE_ROOT], 'NewDir');
    const denied = executeCommand('rd Windows', ctx);
    expect(denied).toMatch(/Access is denied/);
    expect(deleteFolder).not.toHaveBeenCalled();
  });

  it('del removes a file but refuses a folder', () => {
    executeCommand('del Docs\\note.txt', ctx);
    expect(deleteFile).toHaveBeenCalledWith([...DRIVE_ROOT, 'Docs'], 'note.txt');
    const out = executeCommand('del Docs', ctx);
    expect(out).toMatch(/Access is denied/);
  });

  it('localizes output when isChinese', () => {
    ctx.isChinese = true;
    expect(executeCommand('frobnicate', ctx)).toMatch(/不是内部或外部命令/);
  });
});
