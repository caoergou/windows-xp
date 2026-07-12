/**
 * Boot & login branding (#139) — opt-in content-level skinning of the first
 * five seconds. These are plain serializable values (image URLs, strings,
 * CSS colors), so they compose with snapshots and scenario packs. Defaults
 * remain pixel-faithful Windows XP; setting any field on a screen suppresses
 * the remaining Microsoft trademarks on that screen (no half-branded
 * frankenscreens). This is skinning, not the theme engine (#135).
 */

/** Boot-screen branding. */
export interface BootBranding {
  /** Primary logo image (URL or import) shown instead of the XP logo. */
  logo?: string;
  /** Caption under the logo (e.g. your product name), replacing "Microsoft Windows XP". */
  text?: string;
  /** CSS color for the loading bar; when set, a branded bar replaces the XP GIF. */
  progressColor?: string;
  /** Audio URL played on boot instead of the XP startup chime (respects mute/volume). */
  startupSound?: string;
}

/** Login-screen branding. Extends the top-level `avatar`/`username` props. */
export interface LoginBranding {
  /** CSS background for the screen: a color, a gradient, or an image URL. */
  background?: string;
  /** Wordmark text replacing "Microsoft Windows XP". */
  title?: string;
  /** User-tile image (alias of `avatar`, scoped to the login screen). */
  userTile?: string;
  /** User display name (alias of `username`, scoped to the login screen). */
  userName?: string;
}
