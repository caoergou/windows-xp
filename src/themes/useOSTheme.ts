import { useTheme } from 'styled-components';
import type { OSTheme } from './contract';

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
 * Must be called under the provider (i.e. inside `<WindowsXP>`/`<AppProviders>`).
 * `DefaultTheme` is augmented to `OSTheme` in `src/styled.d.ts`, so the return
 * is already typed; the annotation here just makes the contract explicit.
 */
export const useOSTheme = (): OSTheme => useTheme() as OSTheme;
