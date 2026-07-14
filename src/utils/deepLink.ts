/**
 * URL <-> desktop-state mapping (#136).
 *
 * A deep link addresses a filesystem node by its **key path** - the sequence of
 * node keys from the desktop root, joined with '/' - e.g. '我的文档/readme.txt'.
 * This is the '?open=' value; it is host-router-agnostic and reversible via
 * {@link serializeOpenPath}, which 'XPHandle.getShareUrl' uses to build a
 * shareable permalink.
 */

/** Parse a `/`-joined key path (a `?open=` value) into filesystem segments. */
export function parseOpenPath(raw: string): string[] {
  return raw
    .split('/')
    .map(seg => seg.trim())
    .filter(Boolean);
}

/** Serialize filesystem segments back into a `?open=` value (segments URL-encoded). */
export function serializeOpenPath(path: string[]): string {
  return path.map(seg => encodeURIComponent(seg)).join('/');
}

/** A route maps matched path params to the windows to open on load. */
export type DeepLinkRoute = (params: Record<string, string>) => { open?: string | string[] };
/** Pretty URL patterns (`/blog/:slug`) → the file(s) they open (#136). */
export type DeepLinkRoutes = Record<string, DeepLinkRoute>;

/**
 * Match a location's pathname against a `routes` map and return the resolved
 * `open` targets. Patterns use `:name` segments (e.g. `/blog/:slug`); the first
 * pattern that matches wins. Purely lexical — no router dependency, so a host
 * on any framework can pass its current `location` in.
 */
export function resolveRoutes(routes: DeepLinkRoutes, pathname: string): string[] {
  const locSegs = pathname.split('/').filter(Boolean);
  for (const [pattern, handler] of Object.entries(routes)) {
    const patSegs = pattern.split('/').filter(Boolean);
    if (patSegs.length !== locSegs.length) continue;
    const params: Record<string, string> = {};
    let matched = true;
    for (let i = 0; i < patSegs.length; i++) {
      const p = patSegs[i];
      if (p.startsWith(':')) {
        params[p.slice(1)] = decodeURIComponent(locSegs[i]);
      } else if (p !== locSegs[i]) {
        matched = false;
        break;
      }
    }
    if (!matched) continue;
    const { open } = handler(params);
    if (!open) return [];
    return Array.isArray(open) ? open : [open];
  }
  return [];
}

/** Normalize the `open` prop (string | string[] | undefined) to a string list. */
export function toOpenList(open?: string | string[]): string[] {
  if (!open) return [];
  return Array.isArray(open) ? open : [open];
}
