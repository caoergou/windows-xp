// Notepad logic hook (#163/A) — all state, refs, effects, and handlers for the
// Notepad app. Extracted verbatim from the component so index.tsx is a thin
// view. This is a pure relocation: no behavior, timing, or string changes.

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../../hooks/useApp';
import { useFileSystem } from '../../../context/FileSystemContext';
import { isContainerNode, isFileContentNode } from '../../../types';
import { MAX_HISTORY } from '../constants';
import { getCursorPosition } from '../logic';
import { dispatchNotepadShortcut, type NotepadShortcutHandlers } from '../keyboard';
import { useNotepadFindReplace } from './useNotepadFindReplace';
import type { MenuKey, HistoryState, DialogMode, NotepadProps } from '../types';

export function useNotepad({
  content: initialContent = '',
  readOnly = false,
  windowId,
  filePath,
  fileName,
}: NotepadProps) {
  const { t } = useTranslation();
  const api = useApp(windowId);
  const { getFile, updateFile, createFile } = useFileSystem();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0 });
  const [openMenu, setOpenMenu] = useState<MenuKey>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Editor state
  const [content, setContent] = useState(initialContent);
  const [currentFilePath, setCurrentFilePath] = useState<string[] | undefined>(filePath);
  const [currentFileName, setCurrentFileName] = useState<string | undefined>(fileName);
  const [isModified, setIsModified] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(readOnly);

  // Format / view state
  const [wordWrap, setWordWrap] = useState(false);
  const [showStatusBar, setShowStatusBar] = useState(true);

  // Dialog state (find/replace query state lives in useNotepadFindReplace).
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);

  // Status bar state
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });

  // History for undo/redo
  const historyRef = useRef<{ past: HistoryState[]; future: HistoryState[] }>({
    past: [],
    future: [],
  });
  const editorStateRef = useRef<HistoryState>({
    content: initialContent,
    selectionStart: 0,
    selectionEnd: 0,
  });
  const applyingHistoryRef = useRef(false);

  // Ref to always access the latest keyboard handlers without re-registering the listener
  const keyboardHandlersRef = useRef<NotepadShortcutHandlers | null>(null);

  // Update window title when file changes
  useEffect(() => {
    const appName = t('apps.notepad');
    const untitled = t('notepad.untitled');
    if (currentFileName) {
      const title = isModified
        ? `${currentFileName} * - ${appName}`
        : `${currentFileName} - ${appName}`;
      api.window.setTitle(title);
    } else {
      api.window.setTitle(isModified ? `${untitled} * - ${appName}` : `${untitled} - ${appName}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFileName, isModified, t]);

  const pushHistory = () => {
    historyRef.current.past.push({ ...editorStateRef.current });
    if (historyRef.current.past.length > MAX_HISTORY) {
      historyRef.current.past.shift();
    }
    historyRef.current.future = [];
  };

  const updateCursorPosition = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    setCursorPos(getCursorPosition(content, ta.selectionStart));
  }, [content]);

  const setTextareaSelection = (start: number, end: number) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const len = content.length;
    const safeStart = Math.max(0, Math.min(start, len));
    const safeEnd = Math.max(0, Math.min(end, len));
    ta.selectionStart = safeStart;
    ta.selectionEnd = safeEnd;
    editorStateRef.current.selectionStart = safeStart;
    editorStateRef.current.selectionEnd = safeEnd;
    updateCursorPosition();
  };

  const applyHistoryState = (state: HistoryState) => {
    applyingHistoryRef.current = true;
    setContent(state.content);
    setIsModified(true);
    editorStateRef.current = { ...state };
    setTimeout(() => {
      setTextareaSelection(state.selectionStart, state.selectionEnd);
      textareaRef.current?.focus();
      applyingHistoryRef.current = false;
    }, 0);
  };

  const handleUndo = () => {
    const { past } = historyRef.current;
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    historyRef.current.future.push({ ...editorStateRef.current });
    past.pop();
    applyHistoryState(previous);
  };

  const handleRedo = () => {
    const { future } = historyRef.current;
    if (future.length === 0) return;
    const next = future[future.length - 1];
    historyRef.current.past.push({ ...editorStateRef.current });
    future.pop();
    applyHistoryState(next);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const ta = e.target;
    if (!applyingHistoryRef.current) {
      pushHistory();
    }
    setContent(ta.value);
    setIsModified(true);
    editorStateRef.current = {
      content: ta.value,
      selectionStart: ta.selectionStart,
      selectionEnd: ta.selectionEnd,
    };
    updateCursorPosition();
  };

  const handleSelect = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    editorStateRef.current.selectionStart = ta.selectionStart;
    editorStateRef.current.selectionEnd = ta.selectionEnd;
    updateCursorPosition();
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY });
  };

  const closeContextMenu = () => {
    setContextMenu({ visible: false, x: 0, y: 0 });
  };

  const handleCopy = () => {
    const ta = textareaRef.current;
    if (ta) {
      const selected = ta.value.substring(ta.selectionStart, ta.selectionEnd);
      if (selected) {
        navigator.clipboard.writeText(selected);
      }
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const ta = textareaRef.current;
      if (ta) {
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const newValue = content.substring(0, start) + text + content.substring(end);
        pushHistory();
        setContent(newValue);
        setIsModified(true);
        const newCursor = start + text.length;
        editorStateRef.current = {
          content: newValue,
          selectionStart: newCursor,
          selectionEnd: newCursor,
        };
        setTimeout(() => {
          setTextareaSelection(newCursor, newCursor);
          ta.focus();
        }, 0);
      }
    } catch (e) {
      console.error('Failed to paste:', e);
    }
  };

  const handleSelectAll = () => {
    if (textareaRef.current) {
      textareaRef.current.select();
      editorStateRef.current.selectionStart = 0;
      editorStateRef.current.selectionEnd = content.length;
      updateCursorPosition();
    }
  };

  const handleCut = () => {
    const ta = textareaRef.current;
    if (ta) {
      const selected = ta.value.substring(ta.selectionStart, ta.selectionEnd);
      if (selected) {
        navigator.clipboard.writeText(selected);
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const newValue = content.substring(0, start) + content.substring(end);
        pushHistory();
        setContent(newValue);
        setIsModified(true);
        editorStateRef.current = { content: newValue, selectionStart: start, selectionEnd: start };
        setTimeout(() => {
          setTextareaSelection(start, start);
          ta.focus();
        }, 0);
      }
    }
  };

  const handleDelete = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    if (start === end) {
      if (start >= content.length) return;
      const newValue = content.slice(0, start) + content.slice(start + 1);
      pushHistory();
      setContent(newValue);
      setIsModified(true);
      editorStateRef.current = { content: newValue, selectionStart: start, selectionEnd: start };
      setTimeout(() => {
        setTextareaSelection(start, start);
        ta.focus();
      }, 0);
    } else {
      const newValue = content.slice(0, start) + content.slice(end);
      pushHistory();
      setContent(newValue);
      setIsModified(true);
      editorStateRef.current = { content: newValue, selectionStart: start, selectionEnd: start };
      setTimeout(() => {
        setTextareaSelection(start, start);
        ta.focus();
      }, 0);
    }
  };

  // Find / Replace lives in its own hook (#163/A), operating on the editor
  // handle below. Declared after the editor primitives it depends on.
  const {
    findQuery,
    setFindQuery,
    replaceQuery,
    setReplaceQuery,
    replaceWith,
    setReplaceWith,
    findInputRef,
    replaceFindInputRef,
    findStartIndexRef,
    replaceStartIndexRef,
    handleFind,
    handleOpenReplace,
    handleFindNext,
    handleReplaceFindNext,
    handleReplace,
    handleReplaceAll,
  } = useNotepadFindReplace({
    editor: {
      content,
      setContent,
      setIsModified,
      pushHistory,
      editorStateRef,
      setTextareaSelection,
      textareaRef,
    },
    api,
    t,
    setDialogMode,
  });

  const handleToggleWrap = () => {
    setWordWrap(prev => !prev);
  };

  const handleToggleStatusBar = () => {
    setShowStatusBar(prev => !prev);
  };

  const handleAbout = () => {
    api.dialog.alert({
      title: t('notepad.about.title'),
      message: t('notepad.about.message'),
      type: 'info',
    });
  };

  // File Operations
  const handleNew = () => {
    if (isModified) {
      api.dialog
        .confirm({
          title: t('apps.notepad'),
          message: t('notepad.dialogs.unsavedChanges'),
          type: 'question',
        })
        .then(confirmed => {
          if (confirmed) {
            handleSave().then(() => {
              resetEditor();
            });
          } else {
            resetEditor();
          }
        });
    } else {
      resetEditor();
    }
  };

  const resetEditor = () => {
    setContent('');
    setCurrentFilePath(undefined);
    setCurrentFileName(undefined);
    setIsModified(false);
    setIsReadOnly(false);
    historyRef.current = { past: [], future: [] };
    editorStateRef.current = { content: '', selectionStart: 0, selectionEnd: 0 };
    setCursorPos({ line: 1, col: 1 });
  };

  const handleOpen = () => {
    if (isModified) {
      api.dialog
        .confirm({
          title: t('apps.notepad'),
          message: t('notepad.dialogs.unsavedChanges'),
          type: 'question',
        })
        .then(confirmed => {
          if (confirmed) {
            handleSave().then(() => {
              showOpenDialog();
            });
          } else {
            showOpenDialog();
          }
        });
    } else {
      showOpenDialog();
    }
  };

  const showOpenDialog = () => {
    // Create a file browser dialog for selecting text files
    openFileBrowserForOpen();
  };

  const openFileBrowserForOpen = () => {
    // We'll use a simple approach - open Explorer and let user navigate
    // For now, show a prompt to enter file path
    api.dialog
      .prompt({
        title: t('notepad.dialogs.openTitle'),
        message: t('notepad.dialogs.openPrompt'),
        defaultValue: currentFileName || '',
      })
      .then(filePathStr => {
        if (!filePathStr) return;

        const parts = filePathStr.split('\\').filter(Boolean);
        if (parts.length === 0) return;

        const fileName = parts[parts.length - 1];
        const parentPath = parts.slice(0, -1);

        const node = getFile(parts);
        if (!node) {
          api.dialog.alert({
            title: t('notepad.dialogs.openTitle'),
            message: t('notepad.dialogs.fileNotFound'),
            type: 'error',
          });
          return;
        }

        if (node.type !== 'file') {
          api.dialog.alert({
            title: t('notepad.dialogs.openTitle'),
            message: t('notepad.dialogs.cannotOpenFolder'),
            type: 'error',
          });
          return;
        }

        if (!isFileContentNode(node) || node.content === undefined) {
          api.dialog.alert({
            title: t('notepad.dialogs.openTitle'),
            message: t('notepad.dialogs.unsupportedType'),
            type: 'error',
          });
          return;
        }

        setContent(node.content);
        setCurrentFilePath(parentPath);
        setCurrentFileName(fileName);
        setIsModified(false);
        setIsReadOnly(!!node.readOnly);
        historyRef.current = { past: [], future: [] };
        editorStateRef.current = { content: node.content, selectionStart: 0, selectionEnd: 0 };
        setCursorPos({ line: 1, col: 1 });
      });
  };

  const handleSave = async (): Promise<void> => {
    if (currentFilePath && currentFileName) {
      // Save to existing file
      const fullPath = [...currentFilePath, currentFileName];
      const node = getFile(fullPath);

      if (node && isFileContentNode(node)) {
        if (node.readOnly) {
          await api.dialog.alert({
            title: t('notepad.dialogs.saveTitle'),
            message: t('notepad.dialogs.readOnly'),
            type: 'error',
          });
          return;
        }

        updateFile(fullPath, { content });
        setIsModified(false);
      }
    } else {
      // Save As for new file
      await handleSaveAs();
    }
  };

  const handleSaveAs = async (): Promise<void> => {
    const filePathStr = await api.dialog.prompt({
      title: t('notepad.dialogs.saveAsTitle'),
      message: t('notepad.dialogs.saveAsPrompt'),
      defaultValue: currentFileName || t('notepad.untitledFile'),
    });

    if (!filePathStr) return;

    const parts = filePathStr.split('\\').filter(Boolean);
    if (parts.length === 0) return;

    const newFileName = parts[parts.length - 1];
    const parentPath = parts.slice(0, -1);

    // Validate parent path exists
    const parent = getFile(parentPath);
    if (!parent) {
      await api.dialog.alert({
        title: t('notepad.dialogs.saveAsTitle'),
        message: t('notepad.dialogs.pathNotFound'),
        type: 'error',
      });
      return;
    }

    if (!isContainerNode(parent)) {
      await api.dialog.alert({
        title: t('notepad.dialogs.saveAsTitle'),
        message: t('notepad.dialogs.invalidPath'),
        type: 'error',
      });
      return;
    }

    // Check if file already exists
    const existingFile = getFile(parts);
    if (existingFile) {
      const overwrite = await api.dialog.confirm({
        title: t('notepad.dialogs.saveAsTitle'),
        message: t('notepad.dialogs.fileExists', { name: newFileName }),
        type: 'warning',
      });
      if (!overwrite) return;

      // Update existing file
      updateFile(parts, { content });
    } else {
      // Create new file
      createFile(parentPath, newFileName, 'file', {
        content,
        app: 'Notepad',
      });
    }

    setCurrentFilePath(parentPath);
    setCurrentFileName(newFileName);
    setIsModified(false);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFileName || t('notepad.untitledFile');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExit = () => {
    if (isModified) {
      api.dialog
        .confirm({
          title: t('apps.notepad'),
          message: t('notepad.dialogs.unsavedChanges'),
          type: 'question',
        })
        .then(confirmed => {
          if (confirmed) {
            handleSave().then(() => {
              api.window.close();
            });
          } else {
            api.window.close();
          }
        });
    } else {
      api.window.close();
    }
  };

  // Populate the ref after all handlers are initialized so we never read
  // them from the temporary dead zone (TDZ) during the initial render.
  keyboardHandlersRef.current = {
    handleNew,
    handleOpen,
    handleSave,
    handleSaveAs,
    handleUndo,
    handleRedo,
    handleCut,
    handlePaste,
    handleDelete,
    handleSelectAll,
    handleCopy,
    handleFind,
    handleOpenReplace,
    handleToggleWrap,
    handleToggleStatusBar,
    handleAbout,
  };

  // Click outside to close menu
  useEffect(() => {
    if (!openMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenu]);

  // Update cursor position when content changes from external sources
  useEffect(() => {
    updateCursorPosition();
  }, [content, updateCursorPosition]);

  const toggleMenu = (key: Exclude<MenuKey, null>) => {
    setOpenMenu(prev => (prev === key ? null : key));
  };

  const canUndo = historyRef.current.past.length > 0;
  const canRedo = historyRef.current.future.length > 0;

  // Keyboard shortcuts — scoped to the Notepad window via onKeyDown on the
  // root container (not a window-level listener), so shortcuts only fire when
  // this window has focus and never leak Ctrl+S/F/H into the host page or a
  // second Notepad instance (#121, DEVELOPMENT.md §3).
  const handleShortcutKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) =>
      dispatchNotepadShortcut(e, keyboardHandlersRef.current, dialogMode),
    [dialogMode]
  );

  const closeDialog = () => {
    setDialogMode(null);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  return {
    t,
    textareaRef,
    menuRef,
    content,
    isReadOnly,
    wordWrap,
    showStatusBar,
    cursorPos,
    openMenu,
    setOpenMenu,
    contextMenu,
    dialogMode,
    findQuery,
    setFindQuery,
    replaceQuery,
    setReplaceQuery,
    replaceWith,
    setReplaceWith,
    findInputRef,
    replaceFindInputRef,
    findStartIndexRef,
    replaceStartIndexRef,
    canUndo,
    canRedo,
    toggleMenu,
    closeDialog,
    closeContextMenu,
    handleContextMenu,
    handleContentChange,
    handleSelect,
    updateCursorPosition,
    handleShortcutKeyDown,
    handleNew,
    handleOpen,
    handleSave,
    handleSaveAs,
    handleDownload,
    handleExit,
    handleUndo,
    handleRedo,
    handleCut,
    handleCopy,
    handlePaste,
    handleDelete,
    handleFind,
    handleOpenReplace,
    handleSelectAll,
    handleToggleWrap,
    handleToggleStatusBar,
    handleAbout,
    handleFindNext,
    handleReplaceFindNext,
    handleReplace,
    handleReplaceAll,
  };
}
