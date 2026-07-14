// Notepad keyboard shortcuts (#163/A, from #121/#132). The dispatch is a pure
// function over the current handler set + dialog mode, so the hook keeps only a
// thin `useCallback` wrapper. Scoped to the window via the root container's
// onKeyDown (not a window-level listener), so Ctrl+S/F/H never leak to the host
// page or a second Notepad instance. Relocated verbatim; no behavior change.
import type React from 'react';
import type { DialogMode } from './types';

export interface NotepadShortcutHandlers {
  handleNew: () => void;
  handleOpen: () => void;
  handleSave: () => Promise<void>;
  handleSaveAs: () => Promise<void>;
  handleUndo: () => void;
  handleRedo: () => void;
  handleCut: () => void;
  handlePaste: () => void;
  handleDelete: () => void;
  handleSelectAll: () => void;
  handleCopy: () => void;
  handleFind: () => void;
  handleOpenReplace: () => void;
  handleToggleWrap: () => void;
  handleToggleStatusBar: () => void;
  handleAbout: () => void;
}

export const dispatchNotepadShortcut = (
  e: React.KeyboardEvent<HTMLDivElement>,
  handlers: NotepadShortcutHandlers | null,
  dialogMode: DialogMode
): void => {
  if (!handlers) return;

  if (dialogMode) {
    // Let Escape close the dialog via the dialog's own handler
    if (e.key === 'Escape') return;
    // Don't intercept typing in dialogs
    if (e.ctrlKey && ['f', 'h'].includes(e.key.toLowerCase())) {
      e.preventDefault();
      return;
    }
    return;
  }

  if (e.ctrlKey) {
    switch (e.key.toLowerCase()) {
      // Ctrl+N intentionally NOT bound: it opens a new browser window
      // (browser-reserved, uncancelable). "New" stays on the menu. (#132)
      case 'o':
        e.preventDefault();
        handlers.handleOpen();
        break;
      case 's':
        e.preventDefault();
        if (e.shiftKey) {
          handlers.handleSaveAs();
        } else {
          handlers.handleSave();
        }
        break;
      case 'a':
        e.preventDefault();
        handlers.handleSelectAll();
        break;
      case 'x':
        e.preventDefault();
        handlers.handleCut();
        break;
      case 'c':
        e.preventDefault();
        handlers.handleCopy();
        break;
      case 'v':
        e.preventDefault();
        handlers.handlePaste();
        break;
      case 'z':
        e.preventDefault();
        handlers.handleUndo();
        break;
      case 'y':
        e.preventDefault();
        handlers.handleRedo();
        break;
      case 'f':
        e.preventDefault();
        handlers.handleFind();
        break;
      case 'h':
        e.preventDefault();
        handlers.handleOpenReplace();
        break;
    }
  } else if (e.key === 'Delete') {
    e.preventDefault();
    handlers.handleDelete();
  }
};
