/**
 * XP's chrome sheet as a theme-carried CSS string (#213 B1): the Tahoma
 * webfont, the authentic .cur cursor set and XP's focus/click affordances.
 * This is the former `xp-chrome.css`, converted to a module so every asset
 * reference goes through the bundler's asset pipeline (hashed files in the
 * site build, extracted files under `dist/assets/` in the lib build) instead
 * of a stylesheet-relative `url()` that would break once the sheet is mounted
 * as a runtime string via `OSTheme.css` + `mountThemeCss`.
 */
import tahomaWoff from './assets/fonts/Tahoma.woff';
import tahomaBoldWoff from './assets/fonts/Tahoma-Bold.woff';
import cursorArrow from './assets/cursors/arrow_r.cur';
import cursorHandArrow from './assets/cursors/harrow.cur';
import cursorBeam from './assets/cursors/beam_r.cur';
import cursorHelp from './assets/cursors/help_r.cur';
import cursorBusy from './assets/cursors/busy_r.cur';
import cursorWait from './assets/cursors/wait_r.cur';
import cursorMove from './assets/cursors/move_r.cur';
import cursorNo from './assets/cursors/no_r.cur';
import cursorCross from './assets/cursors/cross_r.cur';
import cursorSizeNesw from './assets/cursors/size1_r.cur';
import cursorSizeNwse from './assets/cursors/size2_r.cur';
import cursorSizeEw from './assets/cursors/size3_r.cur';
import cursorSizeNs from './assets/cursors/size4_r.cur';

export const XP_CHROME_CSS = `
@font-face {
  font-family: 'Tahoma';
  src: url('${tahomaWoff}') format('woff');
  font-weight: normal;
  font-style: normal;
}

@font-face {
  font-family: 'Tahoma';
  src: url('${tahomaBoldWoff}') format('woff');
  font-weight: bold;
  font-style: normal;
}

/*
 * XP.css (mounted beside this sheet in the same theme css) provides
 * "Pixelated MS Sans Serif" and "Perfect DOS VGA 437 Win" webfonts.
 * We reference those families here and keep system fallbacks for CJK glyphs.
 * XP's default UI font was Tahoma (or MS Sans Serif in earlier builds).
 * SimSun is the authentic XP Chinese fallback; YaHei is kept only as a
 * last-resort modern fallback. The stack matches FONTS.UI (src/themes/xp/tokens.ts).
 */
.windows-xp-root,
.windows-xp-portal {
  font-family: 'Tahoma', 'SimSun', 'Microsoft YaHei', sans-serif;
}

/* Windows XP authentic cursor set from src/themes/xp/assets/cursors/. */
.windows-xp-root,
.windows-xp-portal {
  cursor: url('${cursorArrow}'), default;
}

/*
 * XP.css applies a blue inset glow on button:focus, which persists after mouse
 * clicks and feels like a "selected" state. Real Windows XP only shows:
 * - momentary sunken border while the mouse is held (:active)
 * - dotted inner outline for keyboard focus, not after mouse click
 */
.windows-xp-root button:focus:not(:focus-visible) {
  outline: none !important;
  box-shadow: none !important;
}

.windows-xp-root button:focus-visible {
  outline: 1px dotted #000;
  outline-offset: -4px;
  box-shadow: none !important;
}

/*
 * STY-09 (#124): XP's native keyboard focus indicator — the 1px dotted
 * rectangle — extended past buttons to the other interactive surfaces
 * (links, menu items, focusable icons/list items, tab entry points). Only on
 * :focus-visible, so mouse clicks never show it (matches XP + WCAG). Applied
 * in the portal scope too, since menus/dialogs render through createPortal.
 */
.windows-xp-root a:focus-visible,
.windows-xp-root [role='button']:focus-visible,
.windows-xp-root [role='menuitem']:focus-visible,
.windows-xp-root [role='option']:focus-visible,
.windows-xp-root [tabindex]:not([tabindex='-1']):focus-visible,
.windows-xp-portal a:focus-visible,
.windows-xp-portal button:focus-visible,
.windows-xp-portal [role='button']:focus-visible,
.windows-xp-portal [role='menuitem']:focus-visible,
.windows-xp-portal [tabindex]:not([tabindex='-1']):focus-visible {
  outline: 1px dotted #000;
  outline-offset: -2px;
}

/* Native XP controls keep the normal arrow. Only actual hyperlinks use the
   link-select hand; applying it to every button is a modern web convention. */
.windows-xp-root button,
.windows-xp-root [role='button'],
.windows-xp-root .xp-clickable,
.windows-xp-portal button,
.windows-xp-portal [role='button'],
.windows-xp-portal .xp-clickable {
  cursor: url('${cursorArrow}'), default;
}

.windows-xp-root a[href],
.windows-xp-root .xp-link,
.windows-xp-portal a[href],
.windows-xp-portal .xp-link {
  cursor:
    url('${cursorHandArrow}') 12 1,
    pointer !important;
}

.windows-xp-root input:not([type]),
.windows-xp-root input[type='text'],
.windows-xp-root input[type='password'],
.windows-xp-root input[type='search'],
.windows-xp-root input[type='email'],
.windows-xp-root input[type='url'],
.windows-xp-root input[type='tel'],
.windows-xp-root input[type='number'],
.windows-xp-root textarea,
.windows-xp-root [contenteditable]:not([contenteditable='false']),
.windows-xp-portal input:not([type]),
.windows-xp-portal input[type='text'],
.windows-xp-portal input[type='password'],
.windows-xp-portal input[type='search'],
.windows-xp-portal input[type='email'],
.windows-xp-portal input[type='url'],
.windows-xp-portal input[type='tel'],
.windows-xp-portal input[type='number'],
.windows-xp-portal textarea,
.windows-xp-portal [contenteditable]:not([contenteditable='false']) {
  cursor: url('${cursorBeam}'), text !important;
}

.windows-xp-root .xp-help,
.windows-xp-portal .xp-help {
  cursor: url('${cursorHelp}'), help !important;
}
.windows-xp-root .xp-busy,
.windows-xp-root .xp-busy *,
.windows-xp-portal .xp-busy,
.windows-xp-portal .xp-busy * {
  cursor: url('${cursorBusy}'), wait !important;
}
.windows-xp-root .xp-progress,
.windows-xp-root .xp-progress *,
.windows-xp-portal .xp-progress,
.windows-xp-portal .xp-progress * {
  cursor: url('${cursorWait}'), progress !important;
}
.windows-xp-root .xp-move,
.windows-xp-root .xp-move *,
.windows-xp-portal .xp-move,
.windows-xp-portal .xp-move * {
  cursor: url('${cursorMove}'), move !important;
}
.windows-xp-root .xp-not-allowed,
.windows-xp-portal .xp-not-allowed {
  cursor: url('${cursorNo}'), not-allowed !important;
}
.windows-xp-root .xp-crosshair,
.windows-xp-portal .xp-crosshair {
  cursor: url('${cursorCross}'), crosshair !important;
}

.windows-xp-root .resize-nesw {
  cursor: url('${cursorSizeNesw}'), nesw-resize !important;
}
.windows-xp-root .resize-nwse {
  cursor: url('${cursorSizeNwse}'), nwse-resize !important;
}
.windows-xp-root .resize-ew {
  cursor: url('${cursorSizeEw}'), ew-resize !important;
}
.windows-xp-root .resize-ns {
  cursor: url('${cursorSizeNs}'), ns-resize !important;
}

/* react-resizable handles: geometry lives in the scaffold (src/scoped.css);
   only the XP resize pointers are assigned here. */
.windows-xp-root .react-resizable-handle-n,
.windows-xp-root .react-resizable-handle-s {
  cursor: url('${cursorSizeNs}'), ns-resize !important;
}

.windows-xp-root .react-resizable-handle-e,
.windows-xp-root .react-resizable-handle-w {
  cursor: url('${cursorSizeEw}'), ew-resize !important;
}

.windows-xp-root .react-resizable-handle-ne,
.windows-xp-root .react-resizable-handle-sw {
  cursor: url('${cursorSizeNesw}'), nesw-resize !important;
}

.windows-xp-root .react-resizable-handle-nw,
.windows-xp-root .react-resizable-handle-se {
  cursor: url('${cursorSizeNwse}'), nwse-resize !important;
}
`;
