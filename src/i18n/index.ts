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

// Initialize the global i18n singleton as a fallback for standalone components
// or existing tests that render components without an I18nextProvider. This
// keeps the library usable out-of-the-box while the provider path remains the
// recommended integration.
if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init(i18nConfig);
}

export default xpI18n;
export { NAMESPACE };
