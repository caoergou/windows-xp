import type { TFunction } from 'i18next';
import { FileNode } from '../types';

const DISPLAY_KEYS: Record<string, string> = {
  '我的电脑': 'desktop.myComputer',
  '我的文档': 'desktop.myDocuments',
  '回收站': 'desktop.recycleBin',
  '网上邻居': 'desktop.networkNeighborhood',
  'Internet Explorer': 'desktop.internetExplorer',
  'Notepad': 'apps.notepad',
  'Calculator': 'apps.calculator',
  'Microsoft Paint': 'apps.paint',
  'Minesweeper': 'apps.minesweeper',
  'Solitaire': 'apps.solitaire',
  'Windows Media Player': 'apps.mediaPlayer',
};

export const getFileDisplayName = (key: string, item: FileNode, t: TFunction): string => {
  const displayKey = DISPLAY_KEYS[key] || DISPLAY_KEYS[item.name];
  return displayKey ? t(displayKey) : item.name;
};
