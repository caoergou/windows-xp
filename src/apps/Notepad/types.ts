// Notepad types (#163/A).

export type MenuKey = 'file' | 'edit' | 'format' | 'view' | 'help' | null;
export type HistoryState = { content: string; selectionStart: number; selectionEnd: number };
export type DialogMode = 'find' | 'replace' | null;

export type NotepadMenuItem =
  | { type: 'separator' }
  | {
      type?: undefined;
      label: string;
      action: () => void | Promise<unknown>;
      shortcut?: string;
      disabled?: boolean;
      checked?: boolean;
    };

export interface NotepadProps {
  content?: string;
  /**
   * A #241 reference to the file body (host asset / pack asset). When present it
   * takes over from `content`, resolved lazily before the editable buffer is
   * seeded. JSON-serializable, so it survives window restoration.
   */
  contentRef?: import('../../content/types').ContentRef;
  readOnly?: boolean;
  windowId?: string;
  filePath?: string[];
  fileName?: string;
  /**
   * Typewriter mode: the document types itself keystroke-by-keystroke, then
   * becomes a fully editable, ordinary Notepad. Any pointer interaction skips
   * to the end; `prefers-reduced-motion` renders the full text instantly.
   * JSON-serializable by design (window-restore safe).
   */
  autoTypeText?: string;
  /** Milliseconds per character for {@link NotepadProps.autoTypeText}. */
  autoTypeSpeed?: number;
}
