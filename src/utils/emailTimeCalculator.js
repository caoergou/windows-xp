/**
 * 邮件时间计算工具
 * 用于计算邮件的动态时间和格式化显示
 */

/**
 * 根据触发条件计算邮件时间
 * @param {string} trigger - 触发条件
 * @param {object} progress - 游戏进度对象
 * @returns {string|null} - 格式化的邮件时间，如果未触发则返回null
 */
export const calculateEmailTime = (trigger, progress) => {
  const triggerTime = progress.emailTimestamps?.[trigger];

  if (!triggerTime) {
    return null; // 还未触发
  }

  // 根据触发类型设置不同的延迟（毫秒）
  const delayMap = {
    'game_start': 0,                                    // 游戏开始时立即可见
    'player_view_qzone': 2 * 3600000,                  // 2小时后
    'player_unlock_album': 4 * 3600000,                // 4小时后
    'player_read_father_diary_layer1': 6 * 3600000,    // 6小时后
    'player_read_linxiaoyu_diary': 3 * 3600000,        // 3小时后
    'player_read_father_diary_layer2': 2 * 3600000     // 2小时后
  };

  const delay = delayMap[trigger] || 3600000; // 默认1小时
  const emailTime = new Date(triggerTime + delay);

  // 格式化为 YYYY-MM-DD HH:mm:ss
  const year = emailTime.getFullYear();
  const month = String(emailTime.getMonth() + 1).padStart(2, '0');
  const day = String(emailTime.getDate()).padStart(2, '0');
  const hours = String(emailTime.getHours()).padStart(2, '0');
  const minutes = String(emailTime.getMinutes()).padStart(2, '0');
  const seconds = String(emailTime.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

/**
 * 格式化邮件时间为相对时间显示
 * @param {string|number} timestamp - 时间戳或时间字符串
 * @returns {string} - 格式化的相对时间
 */
export const formatEmailTime = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;

  // 刚刚（1分钟内）
  if (diff < 60000) {
    return '刚刚';
  }

  // X分钟前（1小时内）
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes}分钟前`;
  }

  // X小时前（今天）
  if (date.toDateString() === now.toDateString()) {
    const hours = Math.floor(diff / 3600000);
    return `${hours}小时前`;
  }

  // 昨天
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `昨天 ${hours}:${minutes}`;
  }

  // 完整日期
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * 检查邮件是否应该显示（基于触发时间和延迟）
 * @param {string} trigger - 触发条件
 * @param {object} progress - 游戏进度对象
 * @returns {boolean} - 是否应该显示
 */
export const shouldShowEmail = (trigger, progress) => {
  const triggerTime = progress.emailTimestamps?.[trigger];

  if (!triggerTime) {
    return false;
  }

  const delayMap = {
    'game_start': 0,
    'player_view_qzone': 2 * 3600000,
    'player_unlock_album': 4 * 3600000,
    'player_read_father_diary_layer1': 6 * 3600000,
    'player_read_linxiaoyu_diary': 3 * 3600000,
    'player_read_father_diary_layer2': 2 * 3600000
  };

  const delay = delayMap[trigger] || 3600000;
  const emailTime = triggerTime + delay;

  return Date.now() >= emailTime;
};
