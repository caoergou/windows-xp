import { css } from 'styled-components';

/**
 * The theme contract (#135).
 *
 * `OSTheme` is the abstraction a look-and-feel package must fill — tokens, an
 * asset registry, reusable style fragments, and (eventually) the chrome
 * component slots. Windows XP is the only implementation today (`themes/xp`);
 * this shape is what a future Win7 / macOS / custom theme would provide so the
 * engine (`src/context`, guarded by `guard:purity`) never has to change.
 */

/** Semantic theme-token dictionary. Numeric geometry tokens stay strongly typed. */
export interface ThemeTokens {
  readonly [token: string]: string | number;
  readonly TASKBAR_HEIGHT: number;
  readonly TITLE_BAR_HEIGHT: number;
  readonly MENU_ITEM_HEIGHT: number;
  readonly BLACK: string;
  readonly BUTTON_BORDER: string;
  readonly GREY_33: string;
  readonly GREY_66: string;
  readonly GREY_88: string;
  readonly GREY_99: string;
  readonly PERF_GRAPH_GRID: string;
  readonly PERF_GRAPH_LINE: string;
}

export interface ThemeFonts {
  UI: string;
  TITLEBAR: string;
  CLASSIC: string;
  MONO: string;
  EDITOR: string;
  CONSOLE: string;
  BOOT: string;
}

export interface ButtonStateImages {
  normal: string;
  hover: string;
  active: string;
}

export interface WindowControlAssets {
  minimize: ButtonStateImages;
  maximize: ButtonStateImages;
  restore: ButtonStateImages;
  close: ButtonStateImages;
}

export interface StartButtonAssets {
  sprite: string;
  logo: string;
}

export interface ThemeAssets {
  windowControls?: WindowControlAssets;
  startButton?: StartButtonAssets;
  icons: Record<string, string>;
}

/** A styled-components style fragment (what `css\`\`` returns). */
export type StyleFragment = ReturnType<typeof css>;

/**
 * Sound scheme: soundManager facade name → audio URL (#213). Registered into
 * the engine's soundManager at the composition root; the engine itself binds
 * no audio assets.
 */
export type SoundScheme = Record<string, string>;

/** Reusable styled-components fragments a theme exposes. */
export interface ThemeStyles {
  button: StyleFragment;
  scrollbar: StyleFragment;
  titleBar: StyleFragment;
  trackbar: StyleFragment;
}

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
  /** Named audio samples for the soundManager facade (#213 seam). */
  sounds: SoundScheme;
  /**
   * The theme's skin sheet(s) as one CSS string (#213 B1): mounted into
   * `document.head` at runtime by the composition root (see `mountThemeCss`)
   * instead of being statically imported by entries. XP packs the scoped
   * xp.css skin table plus its chrome sheet (Tahoma webfont, cursor set,
   * focus affordances). Optional — a theme that ships no sheet (or mounts its
   * own) simply omits it.
   */
  css?: string;
}
