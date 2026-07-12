/**
 * Scenario sticky notes (#207) — a per-instance store of desktop notes a
 * scenario pins/updates/removes as its cheapest "narration" channel. Pure state
 * + persistence; the visual layer lives in `components/StickyNotesLayer` (colours
 * belong there, not in this engine-dir context).
 *
 * Persisted under `<prefix>scenario_notes` so a note survives refresh alongside
 * the scenario's flags/journal.
 */
import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { useStorage } from './StorageContext';
import type { ScenarioNote } from '../scenario/types';

interface NotesContextValue {
  notes: ScenarioNote[];
  /** Upsert a note by id. */
  setNote: (note: ScenarioNote) => void;
  /** Remove a note by id. */
  removeNote: (id: string) => void;
}

const NotesContext = createContext<NotesContextValue | null>(null);

const STORAGE_KEY = 'scenario_notes';

export const NotesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const storage = useStorage();
  const key = storage.key(STORAGE_KEY);

  const [notes, setNotes] = useState<ScenarioNote[]>(() => {
    try {
      const raw = storage.local.getItem(key);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? (parsed as ScenarioNote[]) : [];
    } catch {
      return [];
    }
  });

  // Persist on every mutation (kept in a ref-free functional update so callers
  // can fire many upserts in one tick without stale reads).
  const persist = useRef((next: ScenarioNote[]) => {
    try {
      storage.local.setItem(key, JSON.stringify(next));
    } catch {
      /* storage unavailable — notes stay in-memory */
    }
  });

  const setNote = useCallback((note: ScenarioNote) => {
    setNotes(prev => {
      const next = prev.some(n => n.id === note.id)
        ? prev.map(n => (n.id === note.id ? note : n))
        : [...prev, note];
      persist.current(next);
      return next;
    });
  }, []);

  const removeNote = useCallback((id: string) => {
    setNotes(prev => {
      const next = prev.filter(n => n.id !== id);
      persist.current(next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ notes, setNote, removeNote }), [notes, setNote, removeNote]);
  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>;
};

/** Access the scenario-notes store. Returns a no-op store outside a provider. */
export const useNotes = (): NotesContextValue =>
  useContext(NotesContext) ?? { notes: [], setNote: () => {}, removeNote: () => {} };
