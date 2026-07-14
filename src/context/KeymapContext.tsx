import React, { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import { useWindowManager } from './WindowManagerContext';
import { Keymap, isTextEntryElement, isInsideWindow, type ShortcutSpec } from '../utils/keymap';

/**
 * Keymap wiring (#132).
 *
 * Builds one {@link Keymap} per `<WindowsXP>` instance, installs a single
 * `keydown` listener, and lets any component register a binding with
 * {@link useShortcut}. The registry is the one place that knows every global /
 * desktop / app shortcut, so conflicts are detectable and a host can remap or
 * disable any binding via the `keymap` prop (`disableGlobalShortcuts` is sugar
 * for disabling the whole global scope).
 *
 * Engine-side: pure mechanism, no styling — the shortcut *values* (which combo
 * does what) live with each app; this module only routes events.
 */

const KeymapContext = createContext<Keymap | null>(null);

export const KeymapProvider: React.FC<{
  /** Per-id overrides: a new combo string, or `null` to disable that binding. */
  keymap?: Record<string, string | null>;
  /** Disable every `global`-scope binding. */
  disableGlobalShortcuts?: boolean;
  children: React.ReactNode;
}> = ({ keymap, disableGlobalShortcuts, children }) => {
  const { windows, activeWindowId } = useWindowManager();

  const km = useMemo(
    () => new Keymap({ overrides: keymap ?? {}, disableGlobalShortcuts: !!disableGlobalShortcuts }),
    // The instance is created once; overrides/flags are pushed in via effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    km.setOverrides(keymap ?? {});
  }, [km, keymap]);

  useEffect(() => {
    km.setDisableGlobalShortcuts(!!disableGlobalShortcuts);
  }, [km, disableGlobalShortcuts]);

  // Keep the focused appId fresh in a ref so the single listener never restages.
  const focusedAppIdRef = useRef<string | undefined>(undefined);
  focusedAppIdRef.current = windows.find(w => w.id === activeWindowId)?.appId;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement;
      km.dispatch(e, {
        focusedAppId: focusedAppIdRef.current,
        inInput: isTextEntryElement(active),
        inWindow: isInsideWindow(active),
      });
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [km]);

  return <KeymapContext.Provider value={km}>{children}</KeymapContext.Provider>;
};

/** Access the instance's {@link Keymap} (or null outside a provider). */
export const useKeymapRegistry = (): Keymap | null => useContext(KeymapContext);

/**
 * Register a keyboard shortcut for the lifetime of the calling component.
 *
 * The handler is read through a ref, so it always sees fresh props/state without
 * re-registering. Pass `spec = null` to register nothing (e.g. a binding gated
 * on a condition). A no-op when used outside a {@link KeymapProvider}.
 */
export function useShortcut(spec: ShortcutSpec | null, handler: () => void): void {
  const km = useContext(KeymapContext);
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!km || !spec) return;
    return km.register(spec, () => handlerRef.current());
    // Re-register only when the binding's identity/shape changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    km,
    spec?.id,
    spec?.combo,
    spec?.scope,
    spec?.appId,
    spec?.allowInInput,
    spec?.preventDefault,
  ]);
}

export interface ShortcutBinding {
  spec: ShortcutSpec;
  handler: () => void;
}

/**
 * Register a whole set of bindings at once (e.g. all of one app's shortcuts) —
 * a single hook call, so it satisfies the rules of hooks where a `useShortcut`
 * loop wouldn't. Handlers are read live through a ref; the set re-registers only
 * when its shape (`bindingsKey`) changes, so pass a stable key.
 */
export function useShortcuts(bindings: ShortcutBinding[], bindingsKey: string): void {
  const km = useContext(KeymapContext);
  const ref = useRef(bindings);
  ref.current = bindings;

  useEffect(() => {
    if (!km) return;
    const offs = ref.current.map(({ spec }, i) =>
      km.register(spec, () => ref.current[i]?.handler())
    );
    return () => offs.forEach(off => off());
  }, [km, bindingsKey]);
}
