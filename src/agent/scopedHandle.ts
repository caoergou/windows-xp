/**
 * Scoped agent handle (#150) — the security core.
 *
 * Wraps an {@link XPHandle} with a deny-by-default capability allowlist.
 * Every call — allowed or denied — is audited via `agent:call` /
 * `agent:denied` events on the same bus the host's `onEvent` reads.
 * Dangerous capabilities (`session.*`, `snapshot.load`, `reset`) are never
 * granted by wildcards.
 *
 * This module is pure mechanism (no XP-specific chrome, no imports from
 * `src/themes/`) and lives in the engine layer.
 */
import type { XPHandle, XPFsApi, XPWindowsApi, XPWindowInfo } from '../components/XPBridge';
import type { XPSnapshot } from '../snapshot';
import type { ScopedHandleConfig } from './types';
import { expandCaps } from './types';

/** A rate-limiter over a sliding window. */
class RateLimiter {
  private timestamps: number[] = [];
  constructor(
    private maxCalls: number,
    private windowMs: number
  ) {}

  check(): boolean {
    const now = Date.now();
    this.timestamps = this.timestamps.filter(t => now - t < this.windowMs);
    if (this.timestamps.length >= this.maxCalls) return false;
    this.timestamps.push(now);
    return true;
  }
}

/** The subset of XPHandle exposed through the scoped facade. */
export interface ScopedXPHandle {
  fs: Pick<
    XPFsApi,
    'readFile' | 'getNode' | 'exists' | 'writeFile' | 'createFile' | 'deleteFile' | 'unlockNode'
  >;
  windows: Pick<XPWindowsApi, 'list' | 'focus' | 'minimize' | 'maximize' | 'restore'>;
  openApp: (appId: string, props?: Record<string, unknown>) => string | null;
  openFile: (path: string[]) => string | null;
  notify: (options: Parameters<XPHandle['notify']>[0]) => string;
  sound: { play: (name: string) => void };
  getSnapshot: () => XPSnapshot | undefined;
  describe: () => ScopedDescription;
  /** The concrete set of capabilities this handle was granted. */
  capabilities: ReadonlySet<string>;
}

/** Compact, model-friendly world summary. */
export interface ScopedDescription {
  focusedWindow: string | null;
  windows: ScopedWindowInfo[];
  desktop: ScopedDesktopItem[];
  recentEvents?: unknown[];
  flags?: Record<string, unknown>;
}

export interface ScopedWindowInfo {
  id: string;
  appId: string;
  title: string;
  isMinimized: boolean;
  isMaximized: boolean;
}

export interface ScopedDesktopItem {
  name: string;
  type: string;
  icon?: string;
}

/**
 * Create a capability-scoped facade over an {@link XPHandle}.
 *
 * Every method is always present on the returned handle. Calling an
 * ungranted method emits `agent:denied` and returns a safe default (or
 * throws if `onDenied: 'throw'`). Calling a granted method emits
 * `agent:call` with timing.
 */
export function createScopedHandle(handle: XPHandle, config: ScopedHandleConfig): ScopedXPHandle {
  const granted = expandCaps(config.allow);
  const deniedPolicy = config.onDenied ?? 'event';
  const limiter = config.rateLimit
    ? new RateLimiter(config.rateLimit.maxCalls, config.rateLimit.windowMs)
    : null;

  const has = (cap: string): boolean => granted.has(cap);

  const emitAudit = (
    type: 'agent:call' | 'agent:denied' | 'agent:approved',
    cap: string,
    method: string,
    args?: Record<string, unknown>,
    latencyMs?: number
  ) => {
    const event: Record<string, unknown> = { type, cap, method };
    if (args) event.args = args;
    if (latencyMs !== undefined) event.latencyMs = latencyMs;
    handle.emit(event as Parameters<typeof handle.emit>[0]);
  };

  const deny = (cap: string, method: string, args?: Record<string, unknown>): undefined => {
    emitAudit('agent:denied', cap, method, args);
    if (deniedPolicy === 'throw') {
      throw new AgentDeniedError(cap, method);
    }
    return undefined;
  };

  const guard = <T>(
    cap: string,
    method: string,
    fn: () => T,
    args?: Record<string, unknown>
  ): T | undefined => {
    if (!has(cap)) return deny(cap, method, args);
    if (limiter && !limiter.check()) {
      emitAudit('agent:denied', cap, method, { ...args, reason: 'rate_limited' });
      if (deniedPolicy === 'throw') throw new AgentRateLimitError();
      return undefined;
    }
    const start = Date.now();
    const result = fn();
    emitAudit('agent:call', cap, method, args, Date.now() - start);
    return result;
  };

  // ── Build the scoped surface — all methods always present ─────────────────

  const fs: ScopedXPHandle['fs'] = {
    readFile: path =>
      guard('fs.read', 'fs.readFile', () => handle.fs.readFile(path), { path }) ?? null,
    getNode: path =>
      guard('fs.read', 'fs.getNode', () => handle.fs.getNode(path), { path }) ?? null,
    exists: path => guard('fs.read', 'fs.exists', () => handle.fs.exists(path), { path }) ?? false,
    writeFile: (path, content) => {
      guard('fs.write', 'fs.writeFile', () => handle.fs.writeFile(path, content), {
        path,
        contentLength: content.length,
      });
    },
    createFile: (path, node) => {
      guard('fs.create', 'fs.createFile', () => handle.fs.createFile(path, node), { path });
    },
    deleteFile: path => {
      guard('fs.delete', 'fs.deleteFile', () => handle.fs.deleteFile(path), { path });
    },
    unlockNode: path => {
      guard('fs.unlock', 'fs.unlockNode', () => handle.fs.unlockNode(path), { path });
    },
  };

  const windows: ScopedXPHandle['windows'] = {
    list: () => guard('windows.list', 'windows.list', () => handle.windows.list()) ?? [],
    focus: id => {
      guard('windows.focus', 'windows.focus', () => handle.windows.focus(id), { id });
    },
    minimize: id => {
      guard('windows.minimize', 'windows.minimize', () => handle.windows.minimize(id), { id });
    },
    maximize: id => {
      guard('windows.maximize', 'windows.maximize', () => handle.windows.maximize(id), { id });
    },
    restore: id => {
      guard('windows.restore', 'windows.restore', () => handle.windows.restore(id), { id });
    },
  };

  const openApp = (appId: string, props?: Record<string, unknown>) =>
    guard('apps.open', 'openApp', () => handle.openApp(appId, props), { appId }) ?? null;

  const openFile = (path: string[]) =>
    guard('files.open', 'openFile', () => handle.openFile(path), { path }) ?? null;

  const notifyFn = (options: Parameters<typeof handle.notify>[0]) =>
    guard('notify', 'notify', () => handle.notify(options), { title: options.title }) ?? '';

  const sound = {
    play: (name: string) => {
      guard('sound.play', 'sound.play', () => handle.sound.play(name), { name });
    },
  };

  const getSnapshot = () => guard('snapshot.read', 'getSnapshot', () => handle.getSnapshot());

  const describe = (): ScopedDescription => {
    const winList: ScopedWindowInfo[] = [];
    let focusedWindow: string | null = null;

    if (has('windows.list')) {
      const wins: XPWindowInfo[] = handle.windows.list();
      for (const w of wins) {
        winList.push({
          id: w.id,
          appId: w.appId,
          title: w.title,
          isMinimized: w.isMinimized,
          isMaximized: w.isMaximized,
        });
      }
      const focused = wins.find(w => !w.isMinimized);
      focusedWindow = focused?.id ?? null;
    }

    const desktop: ScopedDesktopItem[] = [];
    if (has('snapshot.read')) {
      const snap = handle.getSnapshot();
      const root = snap.fs?.root;
      if (root && 'children' in root) {
        for (const [, child] of Object.entries(root.children)) {
          if (child && typeof child === 'object' && 'name' in child) {
            const node = child as { name: string; type: string; icon?: string; hidden?: boolean };
            if (node.hidden) continue;
            desktop.push({ name: node.name, type: node.type, icon: node.icon });
          }
        }
      }
    }

    return { focusedWindow, windows: winList, desktop };
  };

  return {
    fs,
    windows,
    openApp,
    openFile,
    notify: notifyFn,
    sound,
    getSnapshot,
    describe,
    capabilities: granted,
  };
}

/** Thrown when a scoped call is denied and `onDenied` is `'throw'`. */
export class AgentDeniedError extends Error {
  constructor(
    public readonly cap: string,
    public readonly method: string
  ) {
    super(`Agent capability "${cap}" denied for method "${method}".`);
    this.name = 'AgentDeniedError';
  }
}

/** Thrown when a scoped call exceeds the rate limit and `onDenied` is `'throw'`. */
export class AgentRateLimitError extends Error {
  constructor() {
    super('Agent rate limit exceeded.');
    this.name = 'AgentRateLimitError';
  }
}
