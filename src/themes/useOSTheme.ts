import { useTheme } from 'styled-components';
import type { DefaultTheme } from 'styled-components';
import type { OSTheme } from './contract';
import { xpTheme } from './xp';

/**
 * Resolve the active OS theme, falling back to the default XP theme when no
 * `ThemeProvider` is above the consumer (#213 B1).
 *
 * Bare usage of the public `/apps` and `/components` subpaths — and direct
 * unit renders — has no provider; `useTheme()` then yields an empty object
 * and reading `theme.tokens` crashes. Crashing there would break the
 * package's public API, so the fallback mirrors AppProviders' own
 * `theme = xpTheme` default. Consumers never test for this themselves: every
 * theme read goes through this resolver.
 */
export const resolveOSTheme = (theme: DefaultTheme | undefined): OSTheme =>
  // `theme.tokens` is always present per the type, but at runtime a missing
  // provider hands us `{}` — that is the case this branch exists for.
  theme && theme.tokens ? theme : xpTheme;

/**
 * Read the active OS theme from context (#213 B1).
 *
 * The composition root wraps the desktop in a styled-components `ThemeProvider`
 * carrying the selected {@link OSTheme} (default `xpTheme`). `useOSTheme()` is
 * the typed accessor non-styled TSX uses to reach tokens/fonts/assets at
 * runtime — the counterpart of `props.theme` inside styled components. It is the
 * migration target for consumers that currently import the static `COLORS` /
 * `FONTS`: once a call site reads the theme from context, a swapped theme
 * reaches it without a rebuild.
 *
 * Works with or without the provider (see {@link resolveOSTheme}); under the
 * provider the active theme is returned as-is. `DefaultTheme` is augmented to
 * `OSTheme` in `src/styled.d.ts`, so the return is already typed; the
 * annotation here just makes the contract explicit.
 */
export const useOSTheme = (): OSTheme => resolveOSTheme(useTheme());
