// Notepad menu data builders (#163/A) — pure functions that map the hook's
// handlers/flags into the dropdown and context-menu item arrays. No DOM, no
// state: given a context they return exactly the same items the component used
// to build inline, so rendering stays pixel-and-behavior identical.

import type { TFunction } from 'i18next';
import type { NotepadMenuItem } from './types';

export interface NotepadMenuContext {
  t: TFunction;
  handleNew: () => void;
  handleOpen: () => void;
  handleSave: () => Promise<boolean>;
  handleSaveAs: () => Promise<boolean>;
  handleDownload: () => void;
  handleExit: () => void;
  handleUndo: () => void;
  handleRedo: () => void;
  handleCut: () => void;
  handleCopy: () => void;
  handlePaste: () => void;
  handleDelete: () => void;
  handleFind: () => void;
  handleOpenReplace: () => void;
  handleSelectAll: () => void;
  handleToggleWrap: () => void;
  handleToggleStatusBar: () => void;
  handleAbout: () => void;
  isReadOnly: boolean;
  canUndo: boolean;
  canRedo: boolean;
  wordWrap: boolean;
  showStatusBar: boolean;
}

export function buildDropdownMenus(
  ctx: NotepadMenuContext
): Record<'file' | 'edit' | 'format' | 'view' | 'help', NotepadMenuItem[]> {
  const {
    t,
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
    isReadOnly,
    canUndo,
    canRedo,
    wordWrap,
    showStatusBar,
  } = ctx;

  const fileMenuItems: NotepadMenuItem[] = [
    { label: t('notepad.menuitems.new'), action: handleNew },
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

  return {
    file: fileMenuItems,
    edit: editMenuItems,
    format: formatMenuItems,
    view: viewMenuItems,
    help: helpMenuItems,
  };
}

export function buildContextMenuItems(ctx: NotepadMenuContext): NotepadMenuItem[] {
  const {
    t,
    handleUndo,
    handleRedo,
    handleCut,
    handleCopy,
    handlePaste,
    handleDelete,
    handleSelectAll,
    canUndo,
    canRedo,
  } = ctx;

  return [
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
}
