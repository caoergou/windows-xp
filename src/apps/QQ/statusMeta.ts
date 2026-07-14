import type { QQStatus } from '../../data/qq/types';

/** Chinese labels for online status (shared by banner, buddy tooltip, tray/banner status menus). */
export const QQ_STATUS_LABEL: Record<QQStatus, string> = {
  online: '在线',
  away: '离开',
  busy: '忙碌',
  invisible: '隐身',
  offline: '离线',
};

/** Switchable status order for "me" (offline cannot be chosen actively). A commonly used subset matching the classic QQ status menu. */
export const QQ_SELECTABLE_STATUS: QQStatus[] = ['online', 'invisible', 'away', 'busy'];
