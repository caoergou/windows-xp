import type { QQStatus } from '../../data/qq/types';

/** 在线状态的中文标签（横幅、好友 tooltip、托盘/横幅状态菜单共用）。 */
export const QQ_STATUS_LABEL: Record<QQStatus, string> = {
  online: '在线',
  away: '离开',
  busy: '忙碌',
  invisible: '隐身',
  offline: '离线',
};

/** 「我」可切换的状态顺序（离线不可主动选择）。与经典 QQ 状态菜单一致的常用子集。 */
export const QQ_SELECTABLE_STATUS: QQStatus[] = ['online', 'invisible', 'away', 'busy'];
