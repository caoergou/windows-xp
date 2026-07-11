/**
 * Easter-egg plumbing (#85).
 *
 * The BSOD was only reachable via Ctrl+Shift+Alt+B — effectively undiscoverable
 * in-game. This lets the CMD (`format c:`) and Run (`bsod`) paths trigger it too
 * via a DOM event the desktop shell listens for, and the shell turns the click
 * on the blue screen into a fake reboot.
 */
export const BSOD_EVENT = 'windows-xp:bsod';

/** Ask the desktop shell to show the Blue Screen of Death. */
export const triggerBsod = (): void => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(BSOD_EVENT));
};
