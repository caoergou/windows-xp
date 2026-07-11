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
