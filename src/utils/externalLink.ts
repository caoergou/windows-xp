import { canUseDOM } from './storage';

/**
 * Navigate out of the fiction to a real URL (#136). New tab by default so an
 * embedded desktop never hijacks its host page; pass `newTab: false` to
 * navigate the current tab instead. No-ops without a DOM (SSR / tests).
 */
export function openExternalUrl(url: string, newTab = true): void {
  if (!canUseDOM || !url) return;
  if (newTab) {
    window.open(url, '_blank', 'noopener,noreferrer');
  } else {
    window.location.assign(url);
  }
}
