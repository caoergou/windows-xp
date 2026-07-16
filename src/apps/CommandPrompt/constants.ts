// CommandPrompt constants (#163/A — split out of the single-file app).

/** Absolute path of the C: drive root in the virtual filesystem. */
export const DRIVE_ROOT = ['root', '我的电脑', '本地磁盘 (C:)'] as const;

/** Folders that cannot be removed/renamed from the drive root. */
export const PROTECTED_FOLDERS = ['Windows', 'WINDOWS', 'Program Files'];

/** The CMD banner shown on launch and after `cls`. */
export const buildBanner = (isChinese: boolean): string =>
  isChinese
    ? 'Microsoft Windows XP [版本 5.1.2600]\n(C) 版权所有 1985-2001 Microsoft Corp.\n\n'
    : 'Microsoft Windows XP [Version 5.1.2600]\n(C) Copyright 1985-2001 Microsoft Corp.\n\n';

/* brand-palette:start — centrally declared app-content colours (#213 batch 4).
   The cmd.exe 16-colour VGA table is terminal CONTENT (the `color` command's
   dialect), not OS chrome — it stays with the app and is exempt from the
   guard:purity hex ratchet. */
/** cmd.exe `color` codes 0-F → VGA colours. */
export const CMD_COLORS: Record<string, string> = {
  '0': '#000000',
  '1': '#000080',
  '2': '#008000',
  '3': '#008080',
  '4': '#800000',
  '5': '#800080',
  '6': '#808000',
  '7': '#c0c0c0',
  '8': '#808080',
  '9': '#0000ff',
  a: '#00ff00',
  b: '#00ffff',
  c: '#ff0000',
  d: '#ff00ff',
  e: '#ffff00',
  f: '#ffffff',
};
/** Default console foreground (colour code 7, VGA silver). */
export const CMD_DEFAULT_TEXT = CMD_COLORS['7'];
/** Console background (colour code 0). */
export const CMD_BACKGROUND = CMD_COLORS['0'];
/** The `matrix` easter egg's green (colour code a). */
export const CMD_MATRIX_GREEN = CMD_COLORS.a;
/* brand-palette:end */
