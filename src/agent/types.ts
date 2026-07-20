/**
 * Agent bridge capability taxonomy (#150).
 *
 * Defines the deny-by-default capability model for {@link createScopedHandle}.
 * Capabilities follow the `group.action` naming from the XPHandle surface;
 * wildcards expand per group but never cover dangerous capabilities.
 */

/**
 * Every granular capability the scoped handle recognizes.
 * Grouped by the XPHandle domain they gate.
 */
export type Capability =
  // filesystem
  | 'fs.read'
  | 'fs.write'
  | 'fs.create'
  | 'fs.delete'
  | 'fs.unlock'
  // windows
  | 'windows.list'
  | 'windows.focus'
  | 'windows.minimize'
  | 'windows.maximize'
  | 'windows.restore'
  // apps / files
  | 'apps.open'
  | 'files.open'
  // notification & sound
  | 'notify'
  | 'sound.play'
  // event injection
  | `emit:${string}`
  // snapshot (read-only)
  | 'snapshot.read'
  // ── dangerous: never granted by wildcards ──
  | 'session.login'
  | 'session.logout'
  | 'session.shutdown'
  | 'session.restart'
  | 'snapshot.load'
  | 'reset'
  | 'schedule';

/** Capabilities that are NEVER granted by a group wildcard (`*` or `group.*`). */
export const DANGEROUS_CAPS: ReadonlySet<string> = new Set([
  'session.login',
  'session.logout',
  'session.shutdown',
  'session.restart',
  'snapshot.load',
  'reset',
  'schedule',
]);

/** Group prefixes that can be expanded with `group.*`. */
export const CAP_GROUPS: Record<string, readonly string[]> = {
  fs: ['fs.read', 'fs.write', 'fs.create', 'fs.delete', 'fs.unlock'],
  windows: [
    'windows.list',
    'windows.focus',
    'windows.minimize',
    'windows.maximize',
    'windows.restore',
  ],
  session: ['session.login', 'session.logout', 'session.shutdown', 'session.restart'],
};

/**
 * Expand a capability spec (which may contain `group.*` wildcards) into the
 * concrete set of granted capabilities. Dangerous caps are stripped unless
 * they appear as explicit entries (not via wildcard).
 */
export function expandCaps(specs: string[]): Set<string> {
  const result = new Set<string>();
  const explicitDangerous = new Set<string>();

  for (const spec of specs) {
    if (spec.endsWith('.*')) {
      const group = spec.slice(0, -2);
      const members = CAP_GROUPS[group];
      if (members) {
        for (const cap of members) {
          if (!DANGEROUS_CAPS.has(cap)) result.add(cap);
        }
      }
    } else if (DANGEROUS_CAPS.has(spec)) {
      explicitDangerous.add(spec);
    } else {
      result.add(spec);
    }
  }

  for (const cap of explicitDangerous) result.add(cap);
  return result;
}

/** How a denied call is handled. */
export type DeniedPolicy = 'event' | 'throw';

/** Configuration for {@link createScopedHandle}. */
export interface ScopedHandleConfig {
  /** Capability allowlist. Supports `group.*` wildcards. */
  allow: string[];
  /** What happens when a call is denied. Default `'event'`. */
  onDenied?: DeniedPolicy;
  /** Maximum calls per sliding window. */
  rateLimit?: { maxCalls: number; windowMs: number };
}
