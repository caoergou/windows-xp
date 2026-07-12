/**
 * Map a file name to its XP icon key based on extension and node type.
 * Falls back to the provided explicit icon, then to type-aware defaults.
 */
export function getFileIconName(
  fileName: string,
  nodeType?: 'file' | 'folder' | 'drive' | 'app_shortcut' | 'root' | 'external_link',
  explicitIcon?: string
): string {
  if (explicitIcon) {
    return explicitIcon;
  }

  if (nodeType === 'folder') return 'folder';
  if (nodeType === 'drive') return 'drive';
  if (nodeType === 'app_shortcut') return 'app_window';
  if (nodeType === 'external_link') return 'ie';

  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  const iconMap: Record<string, string> = {
    txt: 'txt',
    log: 'txt',
    ini: 'txt',
    cfg: 'txt',
    md: 'txt',
    doc: 'doc',
    docx: 'doc',
    xls: 'xls',
    xlsx: 'xls',
    pdf: 'pdf',
    exe: 'app_window',
    html: 'html',
    htm: 'html',
    jpg: 'image',
    jpeg: 'image',
    png: 'image',
    gif: 'image',
    bmp: 'image',
    webp: 'image',
    mp3: 'music_library',
    wav: 'music_library',
    wma: 'music_library',
    m3u: 'media_player',
    mp4: 'media_player',
    avi: 'media_player',
    wmv: 'media_player',
    mpg: 'media_player',
    mpeg: 'media_player',
    lnk: 'app_window',
    url: 'ie',
    zip: 'file',
    rar: 'file',
    '7z': 'file',
  };

  return iconMap[ext] || 'file';
}
