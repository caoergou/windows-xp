/**
 * Per-app typed settings store (#142).
 *
 * Apps declare a settings descriptor (typed key→default pairs) and consume
 * this hook to read/write them. Changes are persisted via the instance's
 * `useStorage()` handle and automatically emit a `ui:action` event on the
 * bus — so scenarios can gate on `settingEquals(appId, key, value)` without
 * the app doing anything extra.
 *
 * The store is JSON-serializable (values are primitives) and survives
 * page refresh.
 */
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useStorage } from '../context/StorageContext';
import { useXPEventBus } from '../context/EventBusContext';

export type SettingValue = string | number | boolean;

export type SettingsDescriptor = Record<string, SettingValue>;

export interface AppSettingsApi<T extends SettingsDescriptor> {
  /** Current settings snapshot. */
  settings: T;
  /** Update a single setting. Emits `ui:action`. */
  set: <K extends keyof T & string>(key: K, value: T[K]) => void;
  /** Reset all settings to defaults. */
  reset: () => void;
}

const SETTINGS_KEY_PREFIX = 'app_settings_';

/**
 * Hook for app-level persistent settings.
 *
 * @param appId  — the registry app id (must be stable across refreshes)
 * @param defaults — the settings descriptor (keys + default values)
 *
 * @example
 * ```tsx
 * const { settings, set } = useAppSettings('DisplaySettings', {
 *   wallpaper: 'bliss',
 *   screensaver: 'none',
 * });
 * set('wallpaper', 'hills');  // persists + emits ui:action
 * ```
 */
export function useAppSettings<T extends SettingsDescriptor>(
  appId: string,
  defaults: T
): AppSettingsApi<T> {
  const storage = useStorage();
  const bus = useXPEventBus();
  const defaultsRef = useRef(defaults);

  const storageKey = useMemo(() => storage.key(`${SETTINGS_KEY_PREFIX}${appId}`), [storage, appId]);

  const loadInitial = (): T => {
    try {
      const raw = storage.local.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<T>;
        return { ...defaultsRef.current, ...parsed };
      }
    } catch {
      // corrupt data — fall through to defaults
    }
    return { ...defaultsRef.current };
  };

  const [settings, setSettings] = useState<T>(loadInitial);

  const persist = useCallback(
    (next: T) => {
      storage.local.setItem(storageKey, JSON.stringify(next));
    },
    [storage, storageKey]
  );

  const set = useCallback(
    <K extends keyof T & string>(key: K, value: T[K]) => {
      setSettings(prev => {
        if (prev[key] === value) return prev;
        const next = { ...prev, [key]: value };
        persist(next);
        bus.emit({
          type: 'ui:action',
          appId,
          control: key,
          value: value as string | number | boolean,
        });
        return next;
      });
    },
    [appId, bus, persist]
  );

  const reset = useCallback(() => {
    const fresh = { ...defaultsRef.current };
    setSettings(fresh);
    persist(fresh);
  }, [persist]);

  useEffect(() => {
    defaultsRef.current = defaults;
  });

  return { settings, set, reset };
}

/**
 * Read app settings from storage without a React context — used by the
 * scenario engine's `settingEquals` predicate at evaluation time.
 */
export function readAppSetting(
  storageLocal: { getItem: (key: string) => string | null },
  storageKey: (shortKey: string) => string,
  appId: string,
  key: string
): SettingValue | undefined {
  try {
    const raw = storageLocal.getItem(storageKey(`${SETTINGS_KEY_PREFIX}${appId}`));
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as Record<string, SettingValue>;
    return parsed[key];
  } catch {
    return undefined;
  }
}
