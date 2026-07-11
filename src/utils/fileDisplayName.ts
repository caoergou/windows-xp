import type { TFunction } from 'i18next';
import { FileNode } from '../types';

const DISPLAY_KEYS: Record<string, string> = {
  我的电脑: 'desktop.myComputer',
  我的文档: 'desktop.myDocuments',
  回收站: 'desktop.recycleBin',
  网上邻居: 'desktop.networkNeighborhood',
  'Internet Explorer': 'desktop.internetExplorer',
  Notepad: 'apps.notepad',
  Calculator: 'apps.calculator',
  'Microsoft Paint': 'apps.paint',
  Minesweeper: 'apps.minesweeper',
  Solitaire: 'apps.solitaire',
  'Windows Media Player': 'apps.mediaPlayer',
  我的音乐: 'startMenu.myMusic',
  我的图片: 'startMenu.myPictures',
  我的视频: 'startMenu.myVideos',
};

export const getFileDisplayName = (key: string, item: FileNode, t: TFunction): string => {
  const displayKey = DISPLAY_KEYS[key] || DISPLAY_KEYS[item.name];
  if (displayKey) return t(displayKey);
  const disk = item.name.match(/^本地磁盘 \(([A-Z]:)\)$/);
  if (disk) return t('explorer.path.localDisk', { drive: disk[1] });
  if (item.name === 'DVD/CD-RW 驱动器 (E:)')
    return t('explorer.path.opticalDrive', { drive: 'E:' });
  return item.name;
};
