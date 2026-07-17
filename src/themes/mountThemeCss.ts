import type { OSTheme } from './contract';

/**
 * Mount a theme's skin sheet (`OSTheme.css`, #213 B1) into the document head.
 *
 * Entries used to hardcode `import 'xp.css/dist/XP.css'`; the skin now follows
 * the selected theme instead: the composition root (`AppProviders`) calls this
 * for the active theme, and dev entries that render without providers (the
 * micro-component gallery) mount `xpTheme`'s sheet the same way. Bare
 * `/apps`/`/components` consumers that render without `AppProviders` can call
 * it from their own entry (`mountThemeCss(xpTheme)`).
 *
 * The tag is prepended to `<head>` so it lands before the engine scaffold
 * (`scoped.css`) and any styled-components runtime styles, preserving the
 * cascade order the static imports had (skin → scaffold → component styles).
 *
 * Sharing/lifecycle: state lives on the element itself (no module-level
 * registry) — several mounted desktops using the same theme share one tag via
 * a refcount attribute; the last unmount removes it. Themes without a `css`
 * field mount nothing.
 */
const ATTR = 'data-os-theme-css';
const COUNT_ATTR = 'data-os-theme-css-count';

export const mountThemeCss = (theme: OSTheme): (() => void) => {
  if (!theme.css || typeof document === 'undefined') return () => {};

  const selector = `style[${ATTR}="${theme.id}"]`;
  let el = document.head.querySelector<HTMLStyleElement>(selector);
  if (el) {
    el.setAttribute(COUNT_ATTR, String(Number(el.getAttribute(COUNT_ATTR) ?? '1') + 1));
  } else {
    el = document.createElement('style');
    el.setAttribute(ATTR, theme.id);
    el.setAttribute(COUNT_ATTR, '1');
    el.textContent = theme.css;
    document.head.insertBefore(el, document.head.firstChild);
  }

  return () => {
    const remaining = Number(el!.getAttribute(COUNT_ATTR) ?? '1') - 1;
    if (remaining <= 0) el!.remove();
    else el!.setAttribute(COUNT_ATTR, String(remaining));
  };
};
