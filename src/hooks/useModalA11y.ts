import { useCallback, useEffect, useRef } from 'react';

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Modal keyboard a11y (#124), shared by every ModalProvider dialog:
 *
 * - **Focus restore**: remembers what was focused when the dialog opened and
 *   returns focus there on close, so keyboard users aren't dumped at the top of
 *   the desktop.
 * - **Focus trap**: Tab / Shift+Tab cycle within the dialog and never escape to
 *   the desktop behind it (also the XP behavior — the parent is inert, DLG-01).
 * - **Esc = cancel**: routed to the dialog's cancel action.
 *
 * Initial focus stays with each dialog (it already focuses its default control).
 * Attach `containerRef` to the dialog's overlay and spread `onKeyDown` on it.
 */
export function useModalA11y(onCancel?: () => void): {
  containerRef: React.RefObject<HTMLDivElement>;
  onKeyDown: (e: React.KeyboardEvent) => void;
} {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previouslyFocused =
      typeof document !== 'undefined' ? (document.activeElement as HTMLElement | null) : null;
    return () => {
      // Restore focus to the invoker once the dialog unmounts.
      previouslyFocused?.focus?.();
    };
  }, []);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCancel?.();
        return;
      }
      if (e.key !== 'Tab') return;
      const el = containerRef.current;
      if (!el) return;
      // Hidden-subtree filtering (offsetParent) is intentionally omitted: it
      // returns null under jsdom (no layout), and these dialogs never contain
      // hidden focusables. The selector already excludes disabled controls.
      const nodes = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [onCancel]
  );

  return { containerRef, onKeyDown };
}
