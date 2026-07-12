import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * Small-screen / portrait viewport strategy (#215).
 *
 * The shell is authored against a fixed baseline (1024×768). On a container that
 * can't fit it — a phone — we render at the baseline and CSS-scale the whole
 * stage to fit, letterboxed, so nothing reflows (fidelity is the product spine;
 * the decision record is `docs/VIEWPORT.md`). This hook owns the policy → scale
 * resolution only; it is engine-pure (no styling, no color). The letterbox and
 * the `transform` live in the view layer.
 */

export type ViewportPolicy = 'auto' | 'scale' | 'native' | 'warn';

/** The XP baseline the shell is designed against. */
export const VIEWPORT_BASE_WIDTH = 1024;
export const VIEWPORT_BASE_HEIGHT = 768;

export interface ViewportScale {
  /** Whether a scale transform should be applied (false ⇒ the untouched layout). */
  active: boolean;
  /** The scale factor (1 when inactive). */
  scale: number;
  baseWidth: number;
  baseHeight: number;
  orientation: 'portrait' | 'landscape';
  /** Portrait + scaled — landscape would scale larger, so nudge to rotate. */
  showRotateHint: boolean;
}

const canUseDOM = typeof window !== 'undefined' && typeof document !== 'undefined';

function measure(el: HTMLElement | null): { w: number; h: number } {
  if (el) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return { w: r.width, h: r.height };
  }
  if (canUseDOM) return { w: window.innerWidth, h: window.innerHeight };
  return { w: VIEWPORT_BASE_WIDTH, h: VIEWPORT_BASE_HEIGHT };
}

function resolve(policy: ViewportPolicy, w: number, h: number): ViewportScale {
  const orientation: ViewportScale['orientation'] = h >= w ? 'portrait' : 'landscape';
  const fit = Math.min(w / VIEWPORT_BASE_WIDTH, h / VIEWPORT_BASE_HEIGHT);
  const base = {
    baseWidth: VIEWPORT_BASE_WIDTH,
    baseHeight: VIEWPORT_BASE_HEIGHT,
    orientation,
    showRotateHint: false,
  };

  if (policy === 'native' || policy === 'warn') {
    return { ...base, active: false, scale: 1 };
  }
  if (policy === 'scale') {
    // Always fit the baseline into the container (may upscale to fill an
    // embedded box); clamp to a sane ceiling.
    const scale = Math.min(Math.max(fit, 0.1), 3);
    return { ...base, active: true, scale, showRotateHint: orientation === 'portrait' && scale < 1 };
  }
  // 'auto': only step in when the baseline width can't fit — i.e. a phone. Any
  // container at least a baseline wide keeps the pixel-identical native layout,
  // so desktop/tablet-landscape see zero change.
  const active = w < VIEWPORT_BASE_WIDTH;
  if (!active) return { ...base, active: false, scale: 1 };
  const scale = Math.min(fit, 1);
  return { ...base, active: true, scale, showRotateHint: orientation === 'portrait' };
}

export function useViewportScale(
  policy: ViewportPolicy = 'auto',
  containerRef?: React.RefObject<HTMLElement>
): ViewportScale {
  const [size, setSize] = useState(() => {
    const { w, h } = measure(containerRef?.current ?? null);
    return { w, h };
  });
  const raf = useRef<number | null>(null);

  const update = useCallback(() => {
    if (raf.current != null) return;
    raf.current = requestAnimationFrame(() => {
      raf.current = null;
      const { w, h } = measure(containerRef?.current ?? null);
      setSize((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
    });
  }, [containerRef]);

  useEffect(() => {
    if (!canUseDOM) return;
    update();
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    let ro: ResizeObserver | undefined;
    const el = containerRef?.current;
    if (el && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(update);
      ro.observe(el);
    }
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
      ro?.disconnect();
      if (raf.current != null) cancelAnimationFrame(raf.current);
    };
  }, [update, containerRef]);

  return useMemo(() => resolve(policy, size.w, size.h), [policy, size.w, size.h]);
}
