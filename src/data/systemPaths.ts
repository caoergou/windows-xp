import type { TFunction } from 'i18next';

export const SYSTEM_PATHS = {
  myComputer: ['我的电脑'],
  myDocuments: ['我的文档'],
  myPictures: ['我的文档', '我的图片'],
  myMusic: ['我的文档', '我的音乐'],
  myVideos: ['我的文档', '我的视频'],
  network: ['网上邻居'],
  recycleBin: ['回收站'],
} as const;

const PATH_TITLE_KEYS: Record<string, string> = {
  我的电脑: 'desktop.myComputer',
  我的文档: 'desktop.myDocuments',
  我的图片: 'startMenu.myPictures',
  我的音乐: 'startMenu.myMusic',
  我的视频: 'startMenu.myVideos',
  网上邻居: 'desktop.networkNeighborhood',
  回收站: 'desktop.recycleBin',
};

export const getSystemPathTitle = (path: readonly string[], t: TFunction): string => {
  const segment = path[path.length - 1] ?? '';
  if (!segment) return t('desktop.myComputer');
  if (PATH_TITLE_KEYS[segment]) return t(PATH_TITLE_KEYS[segment]);
  const disk = segment.match(/^本地磁盘 \(([A-Z]:)\)$/);
  if (disk) return t('explorer.path.localDisk', { drive: disk[1] });
  if (segment === 'DVD/CD-RW 驱动器 (E:)') {
    return t('explorer.path.opticalDrive', { drive: 'E:' });
  }
  return segment;
};

export const getSystemPathDisplay = (path: readonly string[], t: TFunction): string =>
  path
    .map(segment => {
      if (PATH_TITLE_KEYS[segment]) return t(PATH_TITLE_KEYS[segment]);
      const disk = segment.match(/^本地磁盘 \(([A-Z]:)\)$/);
      if (disk) return t('explorer.path.localDisk', { drive: disk[1] });
      if (segment === 'DVD/CD-RW 驱动器 (E:)')
        return t('explorer.path.opticalDrive', { drive: 'E:' });
      return segment;
    })
    .join('\\');

export const resolveSystemPathDisplay = (path: string, t: TFunction): string[] => {
  const aliases: Record<string, string> = {
    [t('desktop.myComputer')]: '我的电脑',
    [t('desktop.myDocuments')]: '我的文档',
    [t('startMenu.myPictures')]: '我的图片',
    [t('startMenu.myMusic')]: '我的音乐',
    [t('startMenu.myVideos')]: '我的视频',
    [t('desktop.networkNeighborhood')]: '网上邻居',
    [t('desktop.recycleBin')]: '回收站',
  };

  return path
    .split('\\')
    .filter(Boolean)
    .map(segment => {
      if (aliases[segment]) return aliases[segment];
      const disk = segment.match(/\(([A-Z]:)\)$/);
      if (disk && segment === t('explorer.path.localDisk', { drive: disk[1] }))
        return `本地磁盘 (${disk[1]})`;
      if (disk && segment === t('explorer.path.opticalDrive', { drive: disk[1] }))
        return `DVD/CD-RW 驱动器 (${disk[1]})`;
      return segment;
    });
};
