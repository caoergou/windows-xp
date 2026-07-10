import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import zh from './locales/zh.json';

const NAMESPACE = 'windows-xp';

const i18nConfig = {
  resources: {
    en: { [NAMESPACE]: en },
    zh: { [NAMESPACE]: zh }
  },
  ns: [NAMESPACE],
  defaultNS: NAMESPACE,
  lng: 'en', // Default to English (matches README/USAGE)
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false
  }
};

// Isolated instance used by AppProviders so multiple WindowsXP roots on the
// same page do not interfere with each other.
const xpI18n = i18n.createInstance();
xpI18n.use(initReactI18next).init(i18nConfig);

// NOTE: we intentionally do NOT initialize the global i18next singleton here.
// Doing so at module-load time would pre-configure the host application's
// i18next instance before it gets a chance to call init() itself (issue #73).
// Standalone component usage (without <WindowsXP/> or <AppProviders/>) must
// wrap components in an I18nextProvider bound to this instance - see USAGE.md.

export default xpI18n;
export { NAMESPACE, i18nConfig };
