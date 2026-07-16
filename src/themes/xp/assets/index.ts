/**
 * Windows XP (Luna) asset registry (#135).
 *
 * The XP theme owns its chrome assets: the Luna window-control button PNGs and
 * the Start-button spritesheet/flag live **beside this registry**, under
 * `src/themes/xp/assets/`, so the theme is a self-contained package rather than
 * reaching into the shared `src/assets/` tree. A future theme supplies its own
 * `assets/` folder of the same shape; the chrome components read whichever
 * registry the active theme provides.
 *
 * Sound bindings moved behind the theme too (#213): `src/themes/xp/sounds.ts`
 * is registered into the engine's soundManager at the composition root, so the
 * engine no longer imports any audio. Icons resolve through `icons` below.
 */

// Luna window-control button states.
import minimizeButton from './window-controls/minimize.png';
import minimizeButtonHover from './window-controls/minimize-hover.png';
import minimizeButtonActive from './window-controls/minimize-active.png';
import maximizeButton from './window-controls/maximize.png';
import maximizeButtonHover from './window-controls/maximize-hover.png';
import maximizeButtonActive from './window-controls/maximize-active.png';
import restoreButton from './window-controls/unmaximize.png';
import restoreButtonHover from './window-controls/unmaximize-hover.png';
import restoreButtonActive from './window-controls/unmaximize-active.png';
import closeButton from './window-controls/close.png';
import closeButtonHover from './window-controls/close-hover.png';
import closeButtonActive from './window-controls/close-active.png';
// Taskbar Start button. `start-flag.png` is the authentic XP *waving* 4-colour
// flag lifted from the English `startButtonSprite` (its outer button-green
// flood-filled to transparency) — real XP pixels that match the English button,
// used by the localized ("开始") button which composites the flag over a CSS
// gradient. Not the flat modern Windows logo or a hand-drawn approximation.
import startButtonSprite from './start-button-sprite.png';
import windowsLogo from './start-flag.png';
import { XP_ICONS } from '../icons';

/** The three background images a window-control button swaps between. */
export interface ButtonStateImages {
  normal: string;
  hover: string;
  active: string;
}

/** Image assets a theme's window chrome needs. */
export interface WindowControlAssets {
  minimize: ButtonStateImages;
  maximize: ButtonStateImages;
  restore: ButtonStateImages;
  close: ButtonStateImages;
}

/** Image assets a theme's taskbar Start button needs. */
export interface StartButtonAssets {
  /** Spritesheet: 99×90, three 30px-tall frames (normal / hover / active). */
  sprite: string;
  /** The waving flag shown beside a localized "Start" label. */
  logo: string;
}

/** The asset registry contract a theme must fill. */
export interface ThemeAssets {
  windowControls: WindowControlAssets;
  startButton: StartButtonAssets;
  /** Icon name → URL map consumed by XPIcon and the app registry (#213). */
  icons: Record<string, string>;
}

export const XP_ASSETS: ThemeAssets = {
  windowControls: {
    minimize: { normal: minimizeButton, hover: minimizeButtonHover, active: minimizeButtonActive },
    maximize: { normal: maximizeButton, hover: maximizeButtonHover, active: maximizeButtonActive },
    restore: { normal: restoreButton, hover: restoreButtonHover, active: restoreButtonActive },
    close: { normal: closeButton, hover: closeButtonHover, active: closeButtonActive },
  },
  startButton: {
    sprite: startButtonSprite,
    logo: windowsLogo,
  },
  icons: XP_ICONS,
};
