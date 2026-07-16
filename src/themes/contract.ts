import type React from 'react';
import { css } from 'styled-components';
import type { ThemeTokens, ThemeFonts } from './xp/tokens';
import type { ThemeAssets } from './xp/assets';

/**
 * The theme contract (#135).
 *
 * `OSTheme` is the abstraction a look-and-feel package must fill — tokens, an
 * asset registry, reusable style fragments, and (eventually) the chrome
 * component slots. Windows XP is the only implementation today (`themes/xp`);
 * this shape is what a future Win7 / macOS / custom theme would provide so the
 * engine (`src/context`, guarded by `guard:purity`) never has to change.
 */

export type { ThemeTokens, ThemeFonts } from './xp/tokens';
export type {
  ThemeAssets,
  WindowControlAssets,
  StartButtonAssets,
  ButtonStateImages,
} from './xp/assets';

/** A styled-components style fragment (what `css\`\`` returns). */
export type StyleFragment = ReturnType<typeof css>;

/** Reusable styled-components fragments a theme exposes. */
export interface ThemeStyles {
  button: StyleFragment;
  scrollbar: StyleFragment;
  titleBar: StyleFragment;
  trackbar: StyleFragment;
}

/**
 * Chrome component slots — the SHAPE a theme's window/taskbar/menu chrome fills
 * (#135 seam 4). Declared as the documented seam; XP wires its chrome directly
 * today, so populating this map is deferred until a second theme exists (a real
 * new theme is an explicit non-goal of #135).
 */
export type ChromeSlots = Record<string, React.ComponentType<Record<string, unknown>>>;

/** A complete OS theme: the contract a new theme (Win7 / macOS / custom) fills. */
export interface OSTheme {
  /** Stable id, e.g. `'xp'`. */
  id: string;
  /** Human-facing name, e.g. `'Windows XP (Luna)'`. */
  name: string;
  tokens: ThemeTokens;
  /** Font stacks (UI / titlebar / console …) — STY-03's single outlet. */
  fonts: ThemeFonts;
  assets: ThemeAssets;
  styles: ThemeStyles;
  /** Optional chrome slot map — the deferred seam (see above). */
  chrome?: Partial<ChromeSlots>;
}
