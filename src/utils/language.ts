import { getStorageKey, safeLocalStorage } from './storage';

/** Locales that ship with the library. Custom culture packages may register
 * additional codes (see USAGE.md), so language values are plain strings. */
export type SupportedLanguage = 'en' | 'zh';

export const getSavedLanguage = (fallback = 'en'): string => {
  const saved = safeLocalStorage.getItem(getStorageKey('language'));
  return saved || fallback;
};

export const saveLanguage = (language: string): void => {
  safeLocalStorage.setItem(getStorageKey('language'), language);
};
