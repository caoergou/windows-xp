import type { FileNode } from '../../types';

// Desktop constants & helpers (#163/A).

// Elements that must not trigger desktop box-selection
export const BOX_SELECT_IGNORE = [
  '.desktop-icon-selectable',
  '[data-testid^="desktop-icon-"]',
  '[role="button"]',
  '.xp-window',
  '.title-bar',
  '.react-resizable-handle',
  '.sticky-note',
  '.xp-alert',
].join(', ');

export const SYSTEM_ICON_KEYS = new Set(['我的电脑', '我的文档', '回收站', '网上邻居']);

export const SYSTEM_ICON_ENGLISH_IDS: Record<string, string> = {
  我的电脑: 'my-computer',
  我的文档: 'my-documents',
  回收站: 'recycle-bin',
  网上邻居: 'network-neighborhood',
};

export const getEnglishTestId = (key: string, item: FileNode): string => {
  return SYSTEM_ICON_ENGLISH_IDS[key] || item.name;
};
