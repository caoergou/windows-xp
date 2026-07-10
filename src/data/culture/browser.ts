import { normalizeCultureLang, BrowserCultureProfile } from './types';

const BROWSER_PROFILES: Record<string, BrowserCultureProfile> = {
  zh: { homepage: 'http://www.hao123.com' },
  en: { homepage: 'http://www.msn.com' },
};

export const getBrowserCultureProfile = (lang: string): BrowserCultureProfile =>
  BROWSER_PROFILES[normalizeCultureLang(lang)] ?? BROWSER_PROFILES.en;
