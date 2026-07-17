import type { OSTheme } from './themes/contract';

/**
 * styled-components `DefaultTheme` augmentation (#213 B1).
 *
 * The composition root injects the active {@link OSTheme} through a
 * styled-components `ThemeProvider`, so `props.theme` (and `useTheme()`) resolve
 * to the whole OS theme — tokens, fonts, assets, styles. This is the runtime
 * seam the per-directory `COLORS`/`FONTS` codemod migrates onto: a styled
 * component reads `props.theme.tokens.SURFACE` instead of the static `COLORS`
 * import, so a swapped theme reaches it without a rebuild.
 */
declare module 'styled-components' {
  // The augmentation intentionally adds no members — it re-points the existing
  // `DefaultTheme` at the whole OSTheme contract.
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface DefaultTheme extends OSTheme {}
}
