import { useMemo } from 'react';
import historyData from '../data/qq/history.json';

// 动态导入群聊数据
const groupHistoryFiles = import.meta.glob('../data/qq/groups/*.json', { eager: true });

/**
 * 统一的 QQ 聊天记录加载 hook
 * @param {Object} target - 聊天对象 (好友或群组)
 * @param {string} type - 类型 ('friend' 或 'group')
 * @returns {Array} 排序后的完整聊天记录
 */
export const useQQChatHistory = (target, type) => {
    return useMemo(() => {
        // 1. 获取最近的聊天记录 (来自 target.chatHistory)
        const recentMessages = (target.chatHistory || []).map(m => ({
            ...m,
            date: m.date || '2023-10-27',
            fullTimestamp: m.fullTimestamp || `${m.date || '2023-10-27'}T${m.timestamp}`
        }));

        // 2. 加载历史存档记录
        let archivedMessages = [];

        if (type === 'group' && target.id === 'mountain_office') {
            // 群聊：从动态导入的文件中加载
            Object.values(groupHistoryFiles).forEach(module => {
                const data = module.default || module;
                if (Array.isArray(data)) {
                    archivedMessages = [...archivedMessages, ...data];
                }
            });
        } else {
            // 好友：从 history.json 加载
            archivedMessages = historyData[target.id] || [];
        }

        // 3. 标准化存档消息的时间戳格式
        const normalizedArchived = archivedMessages.map(m => ({
            ...m,
            fullTimestamp: m.fullTimestamp || `${m.date}T${m.timestamp}`
        }));

        // 4. 合并所有消息并按时间排序
        const allMessages = [...recentMessages, ...normalizedArchived];
        return allMessages.sort((a, b) => {
            return a.fullTimestamp.localeCompare(b.fullTimestamp);
        });
    }, [target.chatHistory, target.id, type]);
};
