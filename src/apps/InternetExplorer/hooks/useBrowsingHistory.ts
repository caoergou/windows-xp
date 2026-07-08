import { useState, useEffect, useCallback } from 'react';
import { BrowsingHistoryItem } from '../types';
import { safeLocalStorage, getStorageKey } from '../../../utils/storage';

const STORAGE_KEY = 'ie_history';
const HISTORY_LIMIT = 100;

export const useBrowsingHistory = () => {
  const [browsingHistory, setBrowsingHistory] = useState<BrowsingHistoryItem[]>([]);

  useEffect(() => {
    try {
      const saved = safeLocalStorage.getItem(getStorageKey(STORAGE_KEY));
      if (saved) {
        setBrowsingHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load browsing history:', e);
    }
  }, []);

  const addToHistory = useCallback((url: string) => {
    if (!url || url === 'about:blank') return;

    try {
      const saved = JSON.parse(safeLocalStorage.getItem(getStorageKey(STORAGE_KEY)) || '[]');
      const newItem = { url, timestamp: Date.now() };
      const newHistory = [newItem, ...saved].slice(0, HISTORY_LIMIT);
      safeLocalStorage.setItem(getStorageKey(STORAGE_KEY), JSON.stringify(newHistory));
      setBrowsingHistory(newHistory);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const clearHistory = useCallback(() => {
    safeLocalStorage.removeItem(getStorageKey(STORAGE_KEY));
    setBrowsingHistory([]);
  }, []);

  return {
    browsingHistory,
    addToHistory,
    clearHistory,
  };
};
