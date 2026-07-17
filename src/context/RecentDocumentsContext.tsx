import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useStorage } from './StorageContext';
import { useXPEventBus } from './EventBusContext';
import { useClock } from './ClockContext';

export interface RecentDocumentEntry {
  path: string[];
  openedAt: string;
  source?: 'seeded' | 'runtime';
}

interface RecentDocumentsApi {
  entries: RecentDocumentEntry[];
}

const RecentDocumentsContext = createContext<RecentDocumentsApi>({ entries: [] });

export const RecentDocumentsProvider: React.FC<{
  children: React.ReactNode;
  seeded?: RecentDocumentEntry[];
}> = ({ children, seeded = [] }) => {
  const storage = useStorage();
  const bus = useXPEventBus();
  const clock = useClock();
  const key = storage.key('recent_documents');
  const [entries, setEntries] = useState<RecentDocumentEntry[]>(() => {
    try {
      const saved = storage.local.getItem(key);
      if (saved) return JSON.parse(saved) as RecentDocumentEntry[];
    } catch {
      // Ignore malformed legacy history.
    }
    return seeded.map(entry => ({ ...entry, source: entry.source ?? 'seeded' }));
  });

  useEffect(() => {
    storage.local.setItem(key, JSON.stringify(entries));
  }, [entries, key, storage]);

  useEffect(
    () =>
      bus.subscribe(event => {
        if (event.type !== 'file:open' || event.nodeType !== 'file') return;
        setEntries(previous => {
          const pathKey = event.path.join('\0');
          return [
            { path: event.path, openedAt: clock.now(), source: 'runtime' as const },
            ...previous.filter(item => item.path.join('\0') !== pathKey),
          ]
            .sort((a, b) => Date.parse(b.openedAt) - Date.parse(a.openedAt))
            .slice(0, 15);
        });
      }),
    [bus, clock]
  );

  const value = useMemo(() => ({ entries }), [entries]);
  return (
    <RecentDocumentsContext.Provider value={value}>{children}</RecentDocumentsContext.Provider>
  );
};

export const useRecentDocuments = (): RecentDocumentsApi => useContext(RecentDocumentsContext);
