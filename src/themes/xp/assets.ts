/**
 * Windows XP (Luna) asset registry (#135).
 *
 * The two out-of-band asset importers the theme-audit called out — the Luna
 * window-control button PNGs and the Start-button spritesheet — now resolve
 * through this one module instead of being imported ad-hoc inside components.
 * A future theme supplies its own registry of the same shape; the chrome
 * components read whichever registry the active theme provides.
 *
 * (Sound-file bindings stay in the engine's `soundManager` for now: it lives in
 * `src/utils` and must not import the theme layer under the #135 engine-purity
 * invariant. Moving them behind the theme needs runtime injection — a follow-up.)
 */

// Luna window-control button states.
import minimizeButton from '../../assets/images/window/luna/minimize.png';
import minimizeButtonHover from '../../assets/images/window/luna/minimize-hover.png';
import minimizeButtonActive from '../../assets/images/window/luna/minimize-active.png';
import maximizeButton from '../../assets/images/window/luna/maximize.png';
import maximizeButtonHover from '../../assets/images/window/luna/maximize-hover.png';
import maximizeButtonActive from '../../assets/images/window/luna/maximize-active.png';
import restoreButton from '../../assets/images/window/luna/unmaximize.png';
import restoreButtonHover from '../../assets/images/window/luna/unmaximize-hover.png';
import restoreButtonActive from '../../assets/images/window/luna/unmaximize-active.png';
import closeButton from '../../assets/images/window/luna/close.png';
import closeButtonHover from '../../assets/images/window/luna/close-hover.png';
import closeButtonActive from '../../assets/images/window/luna/close-active.png';
// Taskbar Start button. The localized ("开始") button composites the flag over a
// CSS gradient, so it needs the authentic XP *waving* 4-colour flag — not the
// flat modern Windows logo (`windowsIcons/windows.png`) that read as
// anachronistic next to the English sprite's baked-in waving flag.
import startButtonSprite from '../../assets/images/taskbar/startButton__spriteSheet.png';
import windowsLogo from '../../assets/icons/xp-flag-logo.svg';

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
  /** Flag logo shown beside a localized "Start" label. */
  logo: string;
}

/** The asset registry contract a theme must fill. */
export interface ThemeAssets {
  windowControls: WindowControlAssets;
  startButton: StartButtonAssets;
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
};
