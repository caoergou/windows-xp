/**
 * Anchor resolution (#141).
 *
 * Anchors are a declarative DOM convention, not a ref registry: any element that
 * wants to be spotlightable carries `data-xp-anchor="<id>"`. Built-in chrome and
 * apps set it; custom apps add it too — so authoring a lesson for a custom app
 * needs only the attribute + lesson JSON, no engine change. The overlay resolves
 * the current step's anchor to a live rect (polled each frame, so it tracks
 * window drag/resize). Queries are scoped to a desktop-root element to stay
 * embedding-safe (never reaches into the host page).
 */
export const ANCHOR_ATTR = 'data-xp-anchor';

/** The desktop-root element enclosing `from` (falls back to document). */
export const findDesktopRoot = (from: Element | null): ParentNode => {
  return (from?.closest('.windows-xp-root') as ParentNode | null) ?? document;
};

/** Resolve an anchor id to its live element within `root`, or null. */
export const resolveAnchorEl = (root: ParentNode, id: string): Element | null => {
  const escaped = id.replace(/["\\]/g, '\\$&');
  return root.querySelector(`[${ANCHOR_ATTR}="${escaped}"]`);
};

/** Resolve an anchor id to its live bounding rect within `root`, or null. */
export const resolveAnchorRect = (root: ParentNode, id: string): DOMRect | null => {
  const el = resolveAnchorEl(root, id);
  return el ? el.getBoundingClientRect() : null;
};
