import { getStorageKey, safeLocalStorage } from './storage';

export type SupportedLanguage = 'en' | 'zh';

const isSupportedLanguage = (value: string | null): value is SupportedLanguage =>
  value === 'en' || value === 'zh';

export const getSavedLanguage = (fallback: SupportedLanguage = 'en'): SupportedLanguage => {
  const saved = safeLocalStorage.getItem(getStorageKey('language'));
  return isSupportedLanguage(saved) ? saved : fallback;
};

export const saveLanguage = (language: SupportedLanguage): void => {
  safeLocalStorage.setItem(getStorageKey('language'), language);
};
