import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ContentRef } from '../content/types';
import { isAssetRef, isUrlRef } from '../content/types';
import { useXPEventBus } from './EventBusContext';
import { useStorage } from './StorageContext';
import { useContentPacks } from './ContentPackContext';
import { canUseDOM } from '../utils/storage';
import { playCustomSound, sounds } from '../utils/soundManager';

export type PowerMode = 'shutdown' | 'restart' | 'logout';
export type PowerSequenceItem =
  | { kind: 'audio'; src: ContentRef; delayMs?: number; durationMs?: number; captions?: string }
  | { kind: 'text'; text?: string; textKey?: string; delayMs?: number; durationMs?: number };

export interface PowerSequence {
  blackoutAfterMs?: number;
  reload?: 'immediate' | 'after-sequence' | 'manual';
  maxDurationMs?: number;
  blackout?: PowerSequenceItem[];
}

export interface PowerTransitionApi {
  request: (mode: PowerMode) => void;
  complete: () => void;
  active: boolean;
  text: string;
}

const PowerTransitionContext = createContext<PowerTransitionApi | undefined>(undefined);
const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, Math.max(0, ms)));

export const PowerTransitionProvider: React.FC<{
  children: React.ReactNode;
  sequence?: PowerSequence;
}> = ({ children, sequence }) => {
  const bus = useXPEventBus();
  const storage = useStorage();
  const content = useContentPacks();
  const [active, setActive] = useState(false);
  const [text, setText] = useState('');
  const modeRef = useRef<PowerMode>('shutdown');
  const completedRef = useRef(false);
  const hardLimitRef = useRef<ReturnType<typeof setTimeout>>();

  const complete = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    if (hardLimitRef.current) clearTimeout(hardLimitRef.current);
    bus.emit({ type: 'session:shutdown-complete', mode: modeRef.current });
    if (sequence?.reload !== 'manual' && canUseDOM) window.location.reload();
  }, [bus, sequence?.reload]);

  const resolveAudio = useCallback(
    (ref: ContentRef): string | null => {
      if (typeof ref === 'string') return ref;
      if (isUrlRef(ref)) return ref.url;
      if (isAssetRef(ref)) {
        const asset = content.assets[ref.asset];
        return typeof asset === 'string' ? asset : asset && isUrlRef(asset) ? asset.url : null;
      }
      return null;
    },
    [content.assets]
  );

  const request = useCallback(
    (mode: PowerMode) => {
      modeRef.current = mode;
      completedRef.current = false;
      storage.local.removeItem(storage.key('open_windows'));
      storage.local.setItem(storage.key('power_state'), mode);
      bus.emit({ type: 'session:shutdown-request', mode });
      bus.emit({ type: 'session:shutdown', mode });
      sounds.shutdown();
      if (!sequence) {
        setTimeout(complete, 600);
        return;
      }
      if (sequence.reload === 'immediate') {
        setTimeout(complete, sequence.blackoutAfterMs ?? 600);
        return;
      }
      hardLimitRef.current = setTimeout(complete, sequence.maxDurationMs ?? 30_000);
      void (async () => {
        await wait(sequence.blackoutAfterMs ?? 600);
        setActive(true);
        bus.emit({ type: 'session:blackout', mode });
        for (const item of sequence.blackout ?? []) {
          await wait(item.delayMs ?? 0);
          if (item.kind === 'text') setText(item.text ?? '');
          else {
            setText(item.captions ?? '');
            const url = resolveAudio(item.src);
            if (url) playCustomSound(url);
          }
          await wait(item.durationMs ?? 0);
        }
        if (sequence.reload !== 'manual') complete();
      })().catch(complete);
    },
    [bus, complete, resolveAudio, sequence, storage]
  );

  const value = useMemo(
    () => ({ request, complete, active, text }),
    [active, complete, request, text]
  );
  return (
    <PowerTransitionContext.Provider value={value}>{children}</PowerTransitionContext.Provider>
  );
};

export const usePowerTransition = (): PowerTransitionApi => {
  const value = useContext(PowerTransitionContext);
  if (!value) throw new Error('usePowerTransition must be used inside PowerTransitionProvider.');
  return value;
};
