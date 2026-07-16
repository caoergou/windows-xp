/**
 * Central keymap module (#132).
 *
 * The single source of truth for every **global** and **app-command** keyboard
 * shortcut. It exists because the browser is not one platform: bindings must be
 * planned around what is actually interceptable per OS/browser (see
 * `docs/KEYMAP.md`), conflicts between bindings (or with an embedding host) must
 * be detectable, and a host must be able to remap or disable any binding.
 *
 * This file is pure mechanism — no React, no styling — so it stays engine-side
 * of the #143 layering (`guard:purity`). React wiring lives in
 * `src/context/KeymapContext.tsx`.
 *
 * ## Modifier normalization
 * `Mod` is the platform primary modifier: **Ctrl** on Windows/Linux, **⌘** on
 * macOS. A single `Mod+A` registration is Ctrl+A on Windows and Cmd+A on a Mac.
 * `Ctrl`/`Cmd`(`Meta`)/`Alt`/`Shift` in a combo are literal physical keys.
 */

export type KeymapScope = 'global' | 'desktop' | 'app';

export interface ShortcutSpec {
  /** Stable id, e.g. `'window.close'`, `'startMenu.toggle'`, `'calc.equals'`. */
  id: string;
  /** Combo string, e.g. `'Mod+A'`, `'Alt+F4'`, `'Ctrl+Esc'`, `'F2'`, 'Alt+`'`. */
  combo: string;
  /**
   * - `'global'` — fires whenever the instance is active (even with a window focused).
   * - `'desktop'` — fires only when the desktop plane is focused (no window/dialog/input).
   * - `'app'` — fires only when `appId`'s window is focused.
   */
  scope: KeymapScope;
  /** Required for `scope: 'app'` — the owning app's id. */
  appId?: string;
  /** Allow the binding while a text input/textarea/contentEditable is focused. Default false. */
  allowInInput?: boolean;
  /** Call `preventDefault()` when matched. Default true. */
  preventDefault?: boolean;
  /** Higher values dispatch first. Use for temporary modal interaction modes. */
  priority?: number;
  /** Human label for docs/UI (optional). */
  label?: string;
}

export interface ParsedCombo {
  mod: boolean;
  ctrl: boolean;
  meta: boolean;
  alt: boolean;
  shift: boolean;
  key: string;
}

const KEY_ALIASES: Record<string, string> = {
  esc: 'escape',
  del: 'delete',
  ins: 'insert',
  up: 'arrowup',
  down: 'arrowdown',
  left: 'arrowleft',
  right: 'arrowright',
  return: 'enter',
  space: ' ',
  spacebar: ' ',
};

/** Normalize a key token (from a combo string or a KeyboardEvent.key) to a canonical form. */
export function normalizeKey(raw: string): string {
  const k = raw.toLowerCase();
  return KEY_ALIASES[k] ?? k;
}

/** Parse a combo string like `'Mod+Shift+S'` into its canonical parts. */
export function parseCombo(combo: string): ParsedCombo {
  const parts = combo
    .split('+')
    .map(p => p.trim())
    .filter(Boolean);
  const out: ParsedCombo = {
    mod: false,
    ctrl: false,
    meta: false,
    alt: false,
    shift: false,
    key: '',
  };
  for (const part of parts) {
    switch (part.toLowerCase()) {
      case 'mod':
        out.mod = true;
        break;
      case 'ctrl':
      case 'control':
        out.ctrl = true;
        break;
      case 'cmd':
      case 'meta':
      case 'command':
      case 'win':
      case 'super':
        out.meta = true;
        break;
      case 'alt':
      case 'option':
      case 'opt':
        out.alt = true;
        break;
      case 'shift':
        out.shift = true;
        break;
      default:
        out.key = normalizeKey(part);
    }
  }
  return out;
}

/** Best-effort macOS detection (overridable for tests via the Keymap constructor). */
export function detectIsMac(): boolean {
  if (typeof navigator === 'undefined') return false;
  const uaData = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData;
  const platform = uaData?.platform || navigator.platform || navigator.userAgent || '';
  return /mac|iphone|ipad|ipod/i.test(platform);
}

interface ModifierEvent {
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
  key: string;
}

/**
 * Does a parsed combo match a keyboard event on this platform? `Mod` resolves to
 * the physical primary modifier (Cmd on macOS, Ctrl elsewhere).
 */
export function comboMatchesEvent(p: ParsedCombo, e: ModifierEvent, isMac: boolean): boolean {
  const reqCtrl = p.ctrl || (p.mod && !isMac);
  const reqMeta = p.meta || (p.mod && isMac);
  return (
    e.ctrlKey === reqCtrl &&
    e.metaKey === reqMeta &&
    e.altKey === p.alt &&
    e.shiftKey === p.shift &&
    normalizeKey(e.key) === p.key
  );
}

/** A conflict key groups registrations that would collide: same scope, same app, same effective combo. */
function conflictKey(spec: ShortcutSpec, combo: string): string {
  return `${spec.scope}::${spec.appId ?? ''}::${normalizeCombo(combo)}`;
}

/** Canonicalize a combo string so `'Shift+Mod+s'` and `'mod+shift+S'` collide. */
export function normalizeCombo(combo: string): string {
  const p = parseCombo(combo);
  return [
    p.mod && 'mod',
    p.ctrl && 'ctrl',
    p.meta && 'meta',
    p.alt && 'alt',
    p.shift && 'shift',
    p.key,
  ]
    .filter(Boolean)
    .join('+');
}

export interface DispatchContext {
  /** appId of the currently focused window, if any. */
  focusedAppId?: string;
  /** Whether a text input / textarea / contentEditable currently has focus. */
  inInput: boolean;
  /** Whether focus is inside a window/dialog/menu (i.e. NOT on the bare desktop plane). */
  inWindow?: boolean;
}

export interface KeymapOptions {
  isMac?: boolean;
  /** Per-id overrides: a new combo string, or `null` to disable that binding. */
  overrides?: Record<string, string | null>;
  /** Disable every `scope: 'global'` binding (sugar for the `disableGlobalShortcuts` prop). */
  disableGlobalShortcuts?: boolean;
  /** Emit dev conflict warnings. Default: `import.meta.env.DEV`. */
  warnOnConflict?: boolean;
}

interface Entry {
  spec: ShortcutSpec;
  handler: () => unknown;
}

/**
 * A per-instance shortcut registry. Register bindings, then feed it keyboard
 * events via {@link Keymap.dispatch}. Two `<WindowsXP>` instances each get their
 * own `Keymap` so their shortcuts never cross-fire.
 */
export class Keymap {
  readonly isMac: boolean;
  private entries = new Map<string, Entry>();
  private overrides: Record<string, string | null>;
  private disableGlobal: boolean;
  private warn: boolean;

  constructor(opts: KeymapOptions = {}) {
    this.isMac = opts.isMac ?? detectIsMac();
    this.overrides = opts.overrides ?? {};
    this.disableGlobal = opts.disableGlobalShortcuts ?? false;
    this.warn = opts.warnOnConflict ?? import.meta.env?.DEV ?? false;
  }

  setOverrides(overrides: Record<string, string | null>): void {
    this.overrides = overrides ?? {};
  }

  setDisableGlobalShortcuts(disable: boolean): void {
    this.disableGlobal = disable;
  }

  /** The effective combo for an id after overrides: the string, or `null` if disabled. */
  effectiveCombo(spec: ShortcutSpec): string | null {
    if (Object.prototype.hasOwnProperty.call(this.overrides, spec.id)) {
      return this.overrides[spec.id]; // string (remap) or null (disable)
    }
    return spec.combo;
  }

  /** Register a binding; returns an unregister function. Re-registering the same id replaces it. */
  register(spec: ShortcutSpec, handler: () => unknown): () => void {
    if (this.warn) {
      const combo = this.effectiveCombo(spec);
      if (combo) {
        const key = conflictKey(spec, combo);
        for (const { spec: other } of this.entries.values()) {
          if (other.id === spec.id) continue;
          const otherCombo = this.effectiveCombo(other);
          if (otherCombo && conflictKey(other, otherCombo) === key) {
            console.warn(
              `[windows-xp] keymap conflict: "${spec.id}" and "${other.id}" both bind ${normalizeCombo(combo)} in scope "${spec.scope}"${spec.appId ? ` (app ${spec.appId})` : ''}.`
            );
          }
        }
      }
    }
    this.entries.set(spec.id, { spec, handler });
    return () => {
      const cur = this.entries.get(spec.id);
      if (cur && cur.handler === handler) this.entries.delete(spec.id);
    };
  }

  /** Feed a keyboard event. Returns true if a binding handled it. */
  dispatch(e: KeyboardEvent, ctx: DispatchContext): boolean {
    const entries = [...this.entries.values()].sort(
      (a, b) => (b.spec.priority ?? 0) - (a.spec.priority ?? 0)
    );
    for (const { spec, handler } of entries) {
      const combo = this.effectiveCombo(spec);
      if (!combo) continue; // disabled via override
      if (spec.scope === 'global' && this.disableGlobal) continue;
      if (spec.scope === 'app' && spec.appId !== ctx.focusedAppId) continue;
      if (spec.scope === 'desktop' && ctx.inWindow) continue;
      if (ctx.inInput && !spec.allowInInput) continue;
      if (comboMatchesEvent(parseCombo(combo), e, this.isMac)) {
        // A high-priority temporary binding may decline when its mode is
        // inactive, allowing dispatch to fall through to the regular binding.
        if (handler() === false) continue;
        if (spec.preventDefault !== false) e.preventDefault();
        return true;
      }
    }
    return false;
  }

  /** Snapshot of active (id, combo, scope) — used by docs/tests. */
  list(): { id: string; combo: string | null; scope: KeymapScope; appId?: string }[] {
    return [...this.entries.values()].map(({ spec }) => ({
      id: spec.id,
      combo: this.effectiveCombo(spec),
      scope: spec.scope,
      appId: spec.appId,
    }));
  }
}

/** True when `el` is a text-entry surface where global shortcuts should stand down. */
export function isTextEntryElement(el: Element | null): boolean {
  if (!el) return false;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  return (el as HTMLElement).isContentEditable === true;
}

/**
 * True when `el` sits inside a window, dialog, menu or resize handle — i.e. NOT
 * on the bare desktop plane. Mirrors the focus guard the Desktop already uses, so
 * `desktop`-scope shortcuts don't fire while a window/dialog is focused.
 */
export function isInsideWindow(el: Element | null): boolean {
  if (!el) return false;
  return !!el.closest(
    '[data-xp-context-boundary], [data-testid="taskbar"], .windows-xp-portal, .react-resizable-handle'
  );
}
