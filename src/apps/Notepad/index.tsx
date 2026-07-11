import React, { useRef, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import ContextMenu from '../../components/ContextMenu';
import { useApp } from '../../hooks/useApp';
import { useFileSystem } from '../../context/FileSystemContext';
import { isContainerNode, isFileContentNode } from '../../types';
import {
  Container,
  MenuBar,
  MenuItemWrapper,
  MenuItem,
  DropdownMenu,
  DropdownItem,
  DropdownSeparator,
  EditorArea,
  TextArea,
  StatusBar,
  StatusBarSection,
} from './styled';
import { MAX_HISTORY } from './constants';
import { getCursorPosition, findNextIndex, countOccurrences, replaceAll, equalsIgnoreCase } from './logic';
import FindReplaceDialog from './components/FindReplaceDialog';
import type { MenuKey, HistoryState, DialogMode, NotepadMenuItem, NotepadProps } from './types';

const Notepad = ({
  content: initialContent = '',
  readOnly = false,
  windowId,
  filePath,
  fileName,
}: NotepadProps) => {
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

  // Dialog state
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [findQuery, setFindQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [replaceWith, setReplaceWith] = useState('');
  const findStartIndexRef = useRef(0);
  const replaceStartIndexRef = useRef(0);
  const findInputRef = useRef<HTMLInputElement>(null);
  const replaceFindInputRef = useRef<HTMLInputElement>(null);

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
  const keyboardHandlersRef = useRef<{
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
  } | null>(null);

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

  // Find / Replace
  const handleFind = () => {
    const ta = textareaRef.current;
    const selected = ta ? ta.value.substring(ta.selectionStart, ta.selectionEnd) : '';
    setFindQuery(selected || findQuery);
    findStartIndexRef.current = ta ? ta.selectionEnd : 0;
    setDialogMode('find');
    setTimeout(() => findInputRef.current?.focus(), 0);
  };

  const handleOpenReplace = () => {
    const ta = textareaRef.current;
    const selected = ta ? ta.value.substring(ta.selectionStart, ta.selectionEnd) : '';
    setReplaceQuery(selected || replaceQuery);
    replaceStartIndexRef.current = ta ? ta.selectionEnd : 0;
    setDialogMode('replace');
    setTimeout(() => replaceFindInputRef.current?.focus(), 0);
  };

  const findNext = (query: string, startIndexRef: React.MutableRefObject<number>): boolean => {
    if (!query) return false;
    const idx = findNextIndex(content, query, startIndexRef.current);
    if (idx !== -1) {
      setTextareaSelection(idx, idx + query.length);
      startIndexRef.current = idx + query.length;
      textareaRef.current?.focus();
      return true;
    }
    return false;
  };

  const handleFindNext = () => {
    if (!findNext(findQuery, findStartIndexRef)) {
      api.dialog.alert({
        title: t('notepad.find.title'),
        message: t('notepad.find.notFound', { query: findQuery }),
        type: 'info',
      });
    }
  };

  const handleReplaceFindNext = () => {
    if (!findNext(replaceQuery, replaceStartIndexRef)) {
      api.dialog.alert({
        title: t('notepad.replace.title'),
        message: t('notepad.find.notFound', { query: replaceQuery }),
        type: 'info',
      });
    }
  };

  const handleReplace = () => {
    const ta = textareaRef.current;
    if (!ta || !replaceQuery) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = content.substring(start, end);
    if (equalsIgnoreCase(selected, replaceQuery)) {
      const newValue = content.substring(0, start) + replaceWith + content.substring(end);
      pushHistory();
      setContent(newValue);
      setIsModified(true);
      const newCursor = start + replaceWith.length;
      editorStateRef.current = {
        content: newValue,
        selectionStart: newCursor,
        selectionEnd: newCursor,
      };
      replaceStartIndexRef.current = newCursor;
      setTimeout(() => {
        setTextareaSelection(newCursor, newCursor);
        ta.focus();
      }, 0);
    }
    handleReplaceFindNext();
  };

  const handleReplaceAll = () => {
    if (!replaceQuery || replaceQuery === replaceWith) return;
    const count = countOccurrences(content, replaceQuery);
    if (count <= 0) {
      api.dialog.alert({
        title: t('notepad.replace.title'),
        message: t('notepad.find.notFound', { query: replaceQuery }),
        type: 'info',
      });
      return;
    }
    const newValue = replaceAll(content, replaceQuery, replaceWith);
    pushHistory();
    setContent(newValue);
    setIsModified(true);
    editorStateRef.current = { content: newValue, selectionStart: 0, selectionEnd: 0 };
    replaceStartIndexRef.current = 0;
    setTimeout(() => {
      setTextareaSelection(0, 0);
      textareaRef.current?.focus();
    }, 0);
    api.dialog.alert({
      title: t('notepad.replace.title'),
      message: t('notepad.replace.replacedCount', { count }),
      type: 'info',
    });
  };

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

  const renderDropdown = (key: Exclude<MenuKey, null>) => {
    if (openMenu !== key) return null;

    const fileMenuItems: NotepadMenuItem[] = [
      { label: t('notepad.menuitems.new'), shortcut: 'Ctrl+N', action: handleNew },
      { label: t('notepad.menuitems.open'), shortcut: 'Ctrl+O', action: handleOpen },
      {
        label: t('notepad.menuitems.save'),
        shortcut: 'Ctrl+S',
        action: handleSave,
        disabled: isReadOnly,
      },
      { label: t('notepad.menuitems.saveAs'), action: handleSaveAs },
      { type: 'separator' as const },
      { label: t('notepad.menuitems.download'), action: handleDownload },
      { type: 'separator' as const },
      { label: t('notepad.menuitems.exit'), action: handleExit },
    ];

    const editMenuItems: NotepadMenuItem[] = [
      {
        label: t('notepad.menuitems.undo'),
        shortcut: 'Ctrl+Z',
        action: handleUndo,
        disabled: !canUndo,
      },
      {
        label: t('notepad.menuitems.redo'),
        shortcut: 'Ctrl+Y',
        action: handleRedo,
        disabled: !canRedo,
      },
      { type: 'separator' as const },
      { label: t('notepad.menuitems.cut'), shortcut: 'Ctrl+X', action: handleCut },
      { label: t('notepad.menuitems.copy'), shortcut: 'Ctrl+C', action: handleCopy },
      { label: t('notepad.menuitems.paste'), shortcut: 'Ctrl+V', action: handlePaste },
      { label: t('notepad.menuitems.delete'), shortcut: 'Del', action: handleDelete },
      { type: 'separator' as const },
      { label: t('notepad.menuitems.find'), shortcut: 'Ctrl+F', action: handleFind },
      { label: t('notepad.menuitems.replace'), shortcut: 'Ctrl+H', action: handleOpenReplace },
      { type: 'separator' as const },
      { label: t('notepad.menuitems.selectAll'), shortcut: 'Ctrl+A', action: handleSelectAll },
    ];

    const formatMenuItems: NotepadMenuItem[] = [
      { label: t('notepad.menuitems.wrap'), action: handleToggleWrap, checked: wordWrap },
      { label: t('notepad.menuitems.font'), action: () => undefined, disabled: true },
    ];

    const viewMenuItems: NotepadMenuItem[] = [
      {
        label: t('notepad.menuitems.statusBar'),
        action: handleToggleStatusBar,
        checked: showStatusBar,
      },
    ];

    const helpMenuItems: NotepadMenuItem[] = [
      { label: t('notepad.menuitems.help'), action: () => undefined, disabled: true },
      { type: 'separator' as const },
      { label: t('notepad.menuitems.about'), action: handleAbout },
    ];

    const menuMap: Record<string, NotepadMenuItem[]> = {
      file: fileMenuItems,
      edit: editMenuItems,
      format: formatMenuItems,
      view: viewMenuItems,
      help: helpMenuItems,
    };

    const items = menuMap[key] || [];

    return (
      <DropdownMenu>
        {items.map((item, i) =>
          item.type === 'separator' ? (
            <DropdownSeparator key={i} />
          ) : (
            <DropdownItem
              key={i}
              $disabled={item.disabled}
              $checked={item.checked}
              onClick={() => {
                if (!item.disabled && item.action) {
                  item.action();
                }
                setOpenMenu(null);
              }}
            >
              <span>{item.label}</span>
              {item.shortcut && <span className="shortcut">{item.shortcut}</span>}
            </DropdownItem>
          )
        )}
      </DropdownMenu>
    );
  };

  const contextMenuItems = [
    { label: t('notepad.menuitems.undo'), action: handleUndo, disabled: !canUndo },
    { label: t('notepad.menuitems.redo'), action: handleRedo, disabled: !canRedo },
    { type: 'separator' as const },
    { label: t('notepad.menuitems.cut'), action: handleCut },
    { label: t('notepad.menuitems.copy'), action: handleCopy },
    { label: t('notepad.menuitems.paste'), action: handlePaste },
    { label: t('notepad.menuitems.delete'), action: handleDelete },
    { type: 'separator' as const },
    { label: t('notepad.menuitems.selectAll'), action: handleSelectAll },
  ];

  // Keyboard shortcuts — scoped to the Notepad window via onKeyDown on the
  // root container (not a window-level listener), so shortcuts only fire when
  // this window has focus and never leak Ctrl+S/F/H into the host page or a
  // second Notepad instance (#121, DEVELOPMENT.md §3).
  const handleShortcutKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const handlers = keyboardHandlersRef.current;
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
          case 'n':
            e.preventDefault();
            handlers.handleNew();
            break;
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
    },
    [dialogMode]
  );

  const closeDialog = () => {
    setDialogMode(null);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };
  return (
    <Container
      ref={menuRef}
      tabIndex={-1}
      style={{ outline: 'none' }}
      onKeyDown={handleShortcutKeyDown}
    >
      <MenuBar>
        <MenuItemWrapper>
          <MenuItem $active={openMenu === 'file'} onClick={() => toggleMenu('file')}>
            {t('notepad.menu.file')}
          </MenuItem>
          {renderDropdown('file')}
        </MenuItemWrapper>
        <MenuItemWrapper>
          <MenuItem $active={openMenu === 'edit'} onClick={() => toggleMenu('edit')}>
            {t('notepad.menu.edit')}
          </MenuItem>
          {renderDropdown('edit')}
        </MenuItemWrapper>
        <MenuItemWrapper>
          <MenuItem $active={openMenu === 'format'} onClick={() => toggleMenu('format')}>
            {t('notepad.menu.format')}
          </MenuItem>
          {renderDropdown('format')}
        </MenuItemWrapper>
        <MenuItemWrapper>
          <MenuItem $active={openMenu === 'view'} onClick={() => toggleMenu('view')}>
            {t('notepad.menu.view')}
          </MenuItem>
          {renderDropdown('view')}
        </MenuItemWrapper>
        <MenuItemWrapper>
          <MenuItem $active={openMenu === 'help'} onClick={() => toggleMenu('help')}>
            {t('notepad.menu.help')}
          </MenuItem>
          {renderDropdown('help')}
        </MenuItemWrapper>
      </MenuBar>
      <EditorArea>
        <TextArea
          ref={textareaRef}
          value={content}
          onChange={handleContentChange}
          onSelect={handleSelect}
          onKeyUp={updateCursorPosition}
          onClick={updateCursorPosition}
          onContextMenu={handleContextMenu}
          readOnly={isReadOnly}
          $wordWrap={wordWrap}
          wrap={wordWrap ? 'soft' : 'off'}
        />
        {showStatusBar && (
          <StatusBar>
            <StatusBarSection>
              {t('notepad.cursorPosition', { line: cursorPos.line, column: cursorPos.col })}
            </StatusBarSection>
          </StatusBar>
        )}
      </EditorArea>
      {createPortal(
        <ContextMenu
          visible={contextMenu.visible}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={closeContextMenu}
          menuItems={contextMenuItems}
        />,
        document.body
      )}
      <FindReplaceDialog
        mode={dialogMode}
        onClose={closeDialog}
        findInputRef={findInputRef}
        replaceFindInputRef={replaceFindInputRef}
        findQuery={findQuery}
        setFindQuery={setFindQuery}
        resetFindIndex={() => {
          findStartIndexRef.current = 0;
        }}
        replaceQuery={replaceQuery}
        setReplaceQuery={setReplaceQuery}
        resetReplaceIndex={() => {
          replaceStartIndexRef.current = 0;
        }}
        replaceWith={replaceWith}
        setReplaceWith={setReplaceWith}
        onFindNext={handleFindNext}
        onReplaceFindNext={handleReplaceFindNext}
        onReplace={handleReplace}
        onReplaceAll={handleReplaceAll}
      />
    </Container>
  );
};

export default Notepad;
