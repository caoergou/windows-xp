// Notepad types (#163/A).

export type MenuKey = 'file' | 'edit' | 'format' | 'view' | 'help' | null;
export type HistoryState = { content: string; selectionStart: number; selectionEnd: number };
export type DialogMode = 'find' | 'replace' | null;

export type NotepadMenuItem =
  | { type: 'separator' }
  | {
      type?: undefined;
      label: string;
      action: () => void | Promise<void>;
      shortcut?: string;
      disabled?: boolean;
      checked?: boolean;
    };

export interface NotepadProps {
  content?: string;
  readOnly?: boolean;
  windowId?: string;
  filePath?: string[];
  fileName?: string;
}
