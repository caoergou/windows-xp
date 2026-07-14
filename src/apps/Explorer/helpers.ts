// Explorer pure helpers (#163/A+E).
import type { TFunction } from 'i18next';
import { FileNode, isContainerNode, isFileContentNode } from '../../types';

/** Whether a My-Computer drive key names an optical (CD/DVD) drive. */
export const isOpticalDrive = (key: string): boolean => /DVD|CD-RW|CD-ROM/i.test(key);

/**
 * Details-view (#120, EXP-02) column formatters for the sortable
 * Name / Size / Type / Date list. Bound once to the active `t` / locale so the
 * hook and view keep calling them with their original single-arg signatures.
 */
export const makeDetailsHelpers = (t: TFunction, language: string) => {
  const nodeSizeBytes = (item: FileNode): number | null =>
    isContainerNode(item)
      ? null
      : isFileContentNode(item) && item.content
        ? item.content.length
        : 0;

  const nodeTypeLabel = (item: FileNode): string => {
    if (item.type === 'folder') return t('explorer.types.folder');
    const dot = item.name.lastIndexOf('.');
    if (dot <= 0 || dot === item.name.length - 1) return t('explorer.fileTypes.noExtension');
    const ext = item.name.slice(dot + 1).toLowerCase();
    // Known extensions map to a friendly XP name; unknown ones fall back to
    // "EXT File" (e.g. "M3U File"), matching how XP labels unregistered types.
    return t(`explorer.fileTypes.${ext}`, {
      defaultValue: t('explorer.fileTypes.generic', { ext: ext.toUpperCase() }),
    });
  };

  const formatBytes = (bytes: number | null): string =>
    bytes === null ? '' : t('fileProperties.bytes', { count: bytes });

  const detailsDate = (item?: FileNode) => {
    const d = new Date(item?.mtime ?? '2003-10-25');
    return new Intl.DateTimeFormat(language, {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    }).format(d);
  };

  const nodeMtime = (item: FileNode): string => item.mtime ?? '2003-10-25';

  return { nodeSizeBytes, nodeTypeLabel, formatBytes, detailsDate, nodeMtime };
};
