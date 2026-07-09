import { useState, useCallback } from 'react';
import { HistoryEntry } from '../types';

interface UseBrowserHistoryOptions {
  initialUrl?: string;
  initialHtml?: string | null;
}

export const useBrowserHistory = ({
  initialUrl,
  initialHtml,
}: UseBrowserHistoryOptions) => {
  const [history, setHistory] = useState<HistoryEntry[]>([
    { url: initialUrl || 'about:blank', html: initialHtml ?? null },
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentEntry = history[currentIndex];

  const navigateTo = useCallback((newUrl: string, newHtml: string | null = null) => {
    const newEntry: HistoryEntry = { url: newUrl, html: newHtml };
    setHistory(prev => {
      const newHistory = prev.slice(0, currentIndex + 1);
      newHistory.push(newEntry);
      return newHistory;
    });
    setCurrentIndex(prev => prev + 1);
  }, [currentIndex]);

  const pushErrorEntry = useCallback((url: string) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, currentIndex + 1);
      newHistory.push({ url, html: null, error: true });
      return newHistory;
    });
    setCurrentIndex(prev => prev + 1);
  }, [currentIndex]);

  const goBack = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  const goForward = useCallback(() => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, history.length]);

  return {
    history,
    currentIndex,
    currentEntry,
    navigateTo,
    goBack,
    goForward,
    pushErrorEntry,
    setHistory,
    setCurrentIndex,
  };
};
