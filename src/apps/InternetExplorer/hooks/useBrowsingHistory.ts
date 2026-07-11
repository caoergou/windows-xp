import { useState, useEffect, useCallback } from 'react';
import { BrowsingHistoryItem } from '../types';
import { useStorage } from '../../../context/StorageContext';

const STORAGE_KEY = 'ie_history';
const HISTORY_LIMIT = 100;

export const useBrowsingHistory = () => {
  const storage = useStorage();
  const [browsingHistory, setBrowsingHistory] = useState<BrowsingHistoryItem[]>([]);

  useEffect(() => {
    try {
      const saved = storage.local.getItem(storage.key(STORAGE_KEY));
      if (saved) {
        setBrowsingHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load browsing history:', e);
    }
  }, [storage]);

  const addToHistory = useCallback((url: string) => {
    if (!url || url === 'about:blank') return;

    try {
      const saved = JSON.parse(storage.local.getItem(storage.key(STORAGE_KEY)) || '[]');
      const newItem = { url, timestamp: Date.now() };
      const newHistory = [newItem, ...saved].slice(0, HISTORY_LIMIT);
      storage.local.setItem(storage.key(STORAGE_KEY), JSON.stringify(newHistory));
      setBrowsingHistory(newHistory);
    } catch (e) {
      console.error(e);
    }
  }, [storage]);

  const clearHistory = useCallback(() => {
    storage.local.removeItem(storage.key(STORAGE_KEY));
    setBrowsingHistory([]);
  }, [storage]);

  return {
    browsingHistory,
    addToHistory,
    clearHistory,
  };
};
