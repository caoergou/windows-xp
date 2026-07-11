import type { FileNode } from '../../types';

// CommandPrompt types (#163/A).

export interface CommandHistory {
  command: string;
}

export interface CommandPromptProps {
  windowId?: string;
}

/**
 * Everything the command interpreter needs from the host component, injected so
 * `executeCommand` is a plain, unit-testable function (#163/E) rather than a
 * closure over React state. Filesystem mutators mirror `useFileSystem`.
 */
export interface CmdContext {
  currentPath: string[];
  isChinese: boolean;
  getFile: (path: string[]) => FileNode | null;
  createFolder: (parentPath: string[], folderName: string) => void;
  deleteFolder: (parentPath: string[], folderName: string) => void;
  renameFile: (parentPath: string[], oldName: string, newName: string) => void;
  copyFile: (sourcePath: string[], fileName: string, destinationPath: string[], newName?: string) => void;
  deleteFile: (parentPath: string[], fileName: string) => void;
  /** Change the shell's working directory (cd). */
  setCurrentPath: (path: string[]) => void;
  /** Change the console foreground colour (color / easter eggs). */
  setTextColor: (color: string) => void;
}
