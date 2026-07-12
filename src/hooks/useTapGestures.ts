import { useMemo, useRef } from 'react';

/**
 * Touch gesture mapping (#125).
 *
 * XP never had touch, so this is a **usability layer**, not a fidelity feature:
 * it lets the existing mouse metaphor be driven by a finger without changing any
 * mouse behavior. The hook is purely additive — it returns `onTouchStart/Move/End`
 * handlers you spread onto an element alongside its existing mouse handlers, and
 * synthesizes three intents from raw touches:
 *
 * - **tap** → a click/select
 * - **double-tap** (two taps within `doubleTapMs`) → a double-click / open
 * - **long-press** (held ~`longPressMs` without moving) → a right-click menu
 *
 * Coordinates from the triggering touch are passed back so callers can position a
 * context menu exactly where the finger is. A gesture that resolves to a
 * double-tap or long-press suppresses the trailing single `tap`, and the handlers
 * are only ever wired to touch events, so mouse and keyboard paths are untouched.
 */

export interface TapPoint {
  x: number;
  y: number;
}

export interface TapGestureOptions {
  /** Fired on a quick touch that neither moved far nor became a long-press. */
  onTap?: (point: TapPoint) => void;
  /** Fired when two taps land within `doubleTapMs` at roughly the same spot. */
  onDoubleTap?: (point: TapPoint) => void;
  /** Fired when a touch is held ~`longPressMs` without moving past `moveTolerance`. */
  onLongPress?: (point: TapPoint) => void;
  /** Hold duration (ms) that turns a press into a long-press. Default 500. */
  longPressMs?: number;
  /** Max time (ms) between two taps to count as a double-tap. Default 300. */
  doubleTapMs?: number;
  /** Movement (px) beyond which a press is treated as a drag/scroll, not a tap. Default 10. */
  moveTolerance?: number;
}

export interface TapGestureHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

/**
 * Map raw touch events to tap / double-tap / long-press intents. Returns handlers
 * to spread onto the target element; see the module doc for the contract.
 */
export function useTapGestures(options: TapGestureOptions): TapGestureHandlers {
  const {
    onTap,
    onDoubleTap,
    onLongPress,
    longPressMs = 500,
    doubleTapMs = 300,
    moveTolerance = 10,
  } = options;

  // Latest callbacks/config, read through a ref so the returned handlers are
  // stable and never carry a stale closure.
  const cfg = useRef({ onTap, onDoubleTap, onLongPress, longPressMs, doubleTapMs, moveTolerance });
  cfg.current = { onTap, onDoubleTap, onLongPress, longPressMs, doubleTapMs, moveTolerance };

  const state = useRef({
    startX: 0,
    startY: 0,
    startTime: 0,
    moved: false,
    longPressFired: false,
    longPressTimer: 0 as number | ReturnType<typeof setTimeout>,
    lastTapTime: 0,
    lastTapX: 0,
    lastTapY: 0,
  });

  return useMemo<TapGestureHandlers>(() => {
    const clearTimer = () => {
      if (state.current.longPressTimer) {
        clearTimeout(state.current.longPressTimer);
        state.current.longPressTimer = 0;
      }
    };

    const onTouchStart = (e: React.TouchEvent) => {
      // Only single-finger gestures; a second finger is pinch/zoom (viewport).
      if (e.touches.length !== 1) {
        clearTimer();
        return;
      }
      const t = e.touches[0];
      const s = state.current;
      s.startX = t.clientX;
      s.startY = t.clientY;
      s.startTime = Date.now();
      s.moved = false;
      s.longPressFired = false;

      clearTimer();
      if (cfg.current.onLongPress) {
        s.longPressTimer = setTimeout(() => {
          if (!state.current.moved) {
            state.current.longPressFired = true;
            cfg.current.onLongPress?.({ x: state.current.startX, y: state.current.startY });
          }
        }, cfg.current.longPressMs);
      }
    };

    const onTouchMove = (e: React.TouchEvent) => {
      const s = state.current;
      const t = e.touches[0];
      if (!t) return;
      if (
        Math.abs(t.clientX - s.startX) > cfg.current.moveTolerance ||
        Math.abs(t.clientY - s.startY) > cfg.current.moveTolerance
      ) {
        s.moved = true;
        clearTimer();
      }
    };

    const onTouchEnd = (e: React.TouchEvent) => {
      const s = state.current;
      clearTimer();

      // A long-press already fired; swallow the trailing tap and its synthetic
      // mouse/click events so the press doesn't also select/open.
      if (s.longPressFired) {
        e.preventDefault();
        s.longPressFired = false;
        return;
      }
      if (s.moved) return;

      const now = Date.now();
      const point = { x: s.startX, y: s.startY };
      const isDoubleTap =
        cfg.current.onDoubleTap != null &&
        now - s.lastTapTime <= cfg.current.doubleTapMs &&
        Math.abs(s.startX - s.lastTapX) <= cfg.current.moveTolerance * 2 &&
        Math.abs(s.startY - s.lastTapY) <= cfg.current.moveTolerance * 2;

      if (isDoubleTap) {
        // Stop the browser from also delivering its own dblclick/zoom.
        e.preventDefault();
        s.lastTapTime = 0;
        cfg.current.onDoubleTap?.(point);
        return;
      }

      s.lastTapTime = now;
      s.lastTapX = s.startX;
      s.lastTapY = s.startY;
      if (cfg.current.onTap) {
        // We own this tap — suppress the compatibility mouse click so the
        // element's existing onClick doesn't fire it a second time.
        e.preventDefault();
        cfg.current.onTap(point);
      }
    };

    return { onTouchStart, onTouchMove, onTouchEnd };
  }, []);
}
