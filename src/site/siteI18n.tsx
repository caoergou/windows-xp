import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import en from './locales/en.json';
import zh from './locales/zh.json';

/**
 * Site i18n (#160) — deliberately **isolated** from the engine's i18next
 * instance. The marketing shell picks its own language (persisted to
 * `site_lang`) so switching site copy never mutates the embedded desktop's
 * locale, and vice-versa. Flat dotted keys; English is the fallback.
 */
export type SiteLang = 'en' | 'zh';

const LOCALES: Record<SiteLang, Record<string, string>> = { en, zh };
const STORAGE_KEY = 'site_lang';

interface SiteI18n {
  lang: SiteLang;
  setLang: (lang: SiteLang) => void;
  t: (key: string) => string;
}

const SiteI18nContext = createContext<SiteI18n | null>(null);

const detectInitial = (): SiteLang => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'en' || saved === 'zh') return saved;
  } catch {
    /* ignore */
  }
  if (typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('zh')) {
    return 'zh';
  }
  return 'en';
};

export const SiteI18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<SiteLang>(detectInitial);

  // Keep <html lang> truthful from the first paint too — a zh visitor
  // auto-detected on load must not keep the shell's hardcoded lang="en".
  useEffect(() => {
    if (typeof document !== 'undefined') document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: SiteLang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<SiteI18n>(
    () => ({
      lang,
      setLang,
      t: (key: string) => LOCALES[lang][key] ?? LOCALES.en[key] ?? key,
    }),
    [lang, setLang]
  );

  return <SiteI18nContext.Provider value={value}>{children}</SiteI18nContext.Provider>;
};

export const useSiteI18n = (): SiteI18n => {
  const ctx = useContext(SiteI18nContext);
  if (!ctx) throw new Error('useSiteI18n must be used within a SiteI18nProvider');
  return ctx;
};
