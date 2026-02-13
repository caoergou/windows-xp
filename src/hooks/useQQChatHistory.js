import { useState, useMemo, useCallback } from 'react';
import historyData from '../data/qq/history.json';

// 动态导入群聊数据
const groupHistoryFiles = import.meta.glob('../data/qq/groups/*.json', { eager: true });

const PAGE_SIZE = 20; // 每页加载20条消息

/**
 * 统一的 QQ 聊天记录加载 hook（支持分页）
 * @param {Object} target - 聊天对象 (好友或群组)
 * @param {string} type - 类型 ('friend' 或 'group')
 * @returns {Object} { messages, loadMore, hasMore, isLoading }
 */
export const useQQChatHistory = (target, type) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    // 获取所有消息（不分页）
    const allMessages = useMemo(() => {
        // 1. 获取最近的聊天记录 (来自 target.chatHistory)
        const recentMessages = (target.chatHistory || []).map(m => ({
            ...m,
            date: m.date || '2023-10-27',
            fullTimestamp: m.fullTimestamp || `${m.date || '2023-10-27'}T${m.timestamp}`
        }));

        // 2. 加载历史存档记录
        let archivedMessages = [];

        if (type === 'group') {
            // 群聊：从动态导入的文件中加载对应群的记录
            Object.entries(groupHistoryFiles).forEach(([path, module]) => {
                // 从路径中提取文件名（不含扩展名）
                const fileName = path.split('/').pop().replace('.json', '');
                // 只加载匹配当前群ID的文件
                if (fileName === target.id || fileName.startsWith(target.id + '_')) {
                    const data = module.default || module;
                    if (Array.isArray(data)) {
                        archivedMessages = [...archivedMessages, ...data];
                    }
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

        // 4. 合并所有消息并按时间排序（降序，最新的在前）
        const allMessages = [...recentMessages, ...normalizedArchived];
        return allMessages.sort((a, b) => {
            return b.fullTimestamp.localeCompare(a.fullTimestamp);
        });
    }, [target.chatHistory, target.id, type]);

    // 当前显示的消息（分页后）
    const displayedMessages = useMemo(() => {
        const endIndex = currentPage * PAGE_SIZE;
        return allMessages.slice(0, endIndex).reverse(); // 反转回正序显示
    }, [allMessages, currentPage]);

    // 是否还有更多消息
    const hasMore = currentPage * PAGE_SIZE < allMessages.length;

    // 加载更多消息
    const loadMore = useCallback(() => {
        if (isLoading || !hasMore) return;

        setIsLoading(true);
        // 模拟网络延迟
        setTimeout(() => {
            setCurrentPage(prev => prev + 1);
            setIsLoading(false);
        }, 300);
    }, [isLoading, hasMore]);

    return {
        messages: displayedMessages,
        loadMore,
        hasMore,
        isLoading
    };
};
