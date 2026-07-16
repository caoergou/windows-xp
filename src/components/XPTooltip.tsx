import React, { useCallback, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styled, { keyframes } from 'styled-components';
import { FONTS } from '../constants';

/**
 * Canonical XP tooltip (#99, FIDELITY CUR-03 / STY-14): pale-yellow InfoWindow
 * background `#FFFFE1`, 1px black border, Tahoma ~8pt, ~500ms hover delay, and
 * a soft fade-in — replacing the browser-native `title=` tooltip (grey, OS
 * font, no XP styling) for spots that want the authentic look.
 *
 * Usage: `<XPTooltip text="Show desktop"><button>…</button></XPTooltip>`.
 * The bubble renders into a body portal so it is never clipped by an
 * `overflow:hidden` window.
 */

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const Bubble = styled.div`
  position: fixed;
  z-index: 2147483000;
  max-width: 240px;
  padding: 1px 4px 2px;
  background: #ffffe1;
  border: 1px solid #000;
  color: #000;
  font-family: ${FONTS.UI};
  font-size: 11px;
  line-height: 1.35;
  box-shadow: 1px 1px 1px rgba(0, 0, 0, 0.25);
  pointer-events: none;
  animation: ${fadeIn} 0.12s ease-out;
`;

const Anchor = styled.span`
  display: inline-flex;
`;

export interface XPTooltipProps {
  text: React.ReactNode;
  /** Hover delay before showing, ms (XP default ~500). */
  delay?: number;
  children: React.ReactElement;
  className?: string;
}

export const XPTooltip: React.FC<XPTooltipProps> = ({ text, delay = 500, children, className }) => {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const anchorRef = useRef<HTMLSpanElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const show = useCallback(() => {
    clear();
    timer.current = setTimeout(() => {
      const el = anchorRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      // XP shows the tip just below and slightly right of the pointer/target.
      setPos({ x: r.left + 12, y: r.bottom + 4 });
    }, delay);
  }, [clear, delay]);

  const hide = useCallback(() => {
    clear();
    setPos(null);
  }, [clear]);

  return (
    <>
      <Anchor
        ref={anchorRef}
        className={className}
        onMouseEnter={show}
        onMouseLeave={hide}
        onMouseDown={hide}
      >
        {children}
      </Anchor>
      {pos &&
        text != null &&
        createPortal(
          <Bubble style={{ left: pos.x, top: pos.y }} role="tooltip">
            {text}
          </Bubble>,
          document.body
        )}
    </>
  );
};
