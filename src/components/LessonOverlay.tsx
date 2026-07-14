/**
 * Guided-lesson presentation (#141): spotlight + instruction balloon + docked
 * lesson panel. Reads the runtime via {@link useLesson}; resolves the current
 * step's anchor element each frame so the spotlight tracks window drag/resize.
 * Renders nothing when no lesson is running.
 *
 * Positioning of the instruction balloon is delegated to `@floating-ui/react`
 * (offset/flip/shift) so it never leaves the frame; the dim + ring stay
 * hand-drawn since a spotlight cutout is not a tooltip. The event-driven
 * verification engine lives in `LessonContext` — this file is presentation only.
 *
 * Layering: mounted inside `DesktopContainer` (below the max-z taskbar). The dim
 * shades are click-through so the learner drives the real UI to advance steps.
 * Anchors inside the taskbar (Start button, clock) sit above this overlay, so
 * they stay naturally lit while the desktop dims around them.
 */
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styled, { css, keyframes } from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useFloating, offset, flip, shift, autoUpdate } from '@floating-ui/react';
import { COLORS } from '../constants';
import { useLesson } from '../context/LessonContext';
import { CloseBtn } from './Window/WindowControls';
import { findDesktopRoot, resolveAnchorEl } from '../lesson/anchor';

const TASKBAR_CLEARANCE = COLORS.TASKBAR_HEIGHT + 8;
// Above windows (base z 10000, climbing), below the taskbar (max int).
const OVERLAY_Z = 2147480000;

const Root = styled.div`
  position: absolute;
  inset: 0;
  z-index: ${OVERLAY_Z};
  pointer-events: none;
  overflow: hidden;
`;

// Dim via element opacity over an opaque fill — composites reliably where an
// `rgba()` background did not in this stacking context.
const Shade = styled.div`
  position: absolute;
  background: black;
  opacity: 0.45;
  pointer-events: none;
`;

const ringShake = keyframes`
  0%, 100% { margin-left: 0; }
  20% { margin-left: -5px; }
  40% { margin-left: 5px; }
  60% { margin-left: -3px; }
  80% { margin-left: 3px; }
`;

const Ring = styled.div<{ $shake: number }>`
  position: absolute;
  border: 2px solid ${COLORS.DIALOG_BLUE};
  border-radius: 2px;
  box-shadow: 0 0 6px rgba(10, 80, 200, 0.7);
  transition:
    left 90ms linear,
    top 90ms linear,
    width 90ms linear,
    height 90ms linear;
  pointer-events: none;
  ${p =>
    p.$shake > 0
      ? css`
          animation: ${ringShake} 320ms ease;
        `
      : ''}
`;

// Watch-mode ghost cursor: an XP-style pointer that glides to each step's
// anchor, then a click pulse fires as the step auto-plays. Portaled to the body
// at the top z-index so it floats above the taskbar (whose Start button/clock
// are common anchors), using viewport coordinates.
const GhostCursor = styled.div`
  position: fixed;
  width: 20px;
  height: 28px;
  pointer-events: none;
  transition:
    left 1100ms cubic-bezier(0.4, 0, 0.2, 1),
    top 1100ms cubic-bezier(0.4, 0, 0.2, 1);
  filter: drop-shadow(1px 1px 1px rgba(0, 0, 0, 0.5));
  z-index: 2147483647;
`;

const clickPulse = keyframes`
  from { transform: scale(0.3); opacity: 0.7; }
  to { transform: scale(1.6); opacity: 0; }
`;

const ClickPulse = styled.div`
  position: absolute;
  width: 34px;
  height: 34px;
  margin: -17px 0 0 -17px;
  border: 2px solid ${COLORS.DIALOG_BLUE};
  border-radius: 50%;
  pointer-events: none;
  animation: ${clickPulse} 500ms ease-out;
`;

const WatchButton = styled.button`
  margin-top: 8px;
  width: 100%;
  padding: 3px 6px;
  background: ${COLORS.BUTTON_GRADIENT};
  border: 1px solid ${COLORS.BUTTON_BORDER};
  border-radius: 3px;
  font-family: Tahoma, sans-serif;
  font-size: 11px;
  color: black;
  cursor: pointer;
  &:hover {
    box-shadow: ${COLORS.BUTTON_HOVER_SHADOW};
  }
`;

const Balloon = styled.div`
  width: max-content;
  max-width: 260px;
  background: ${COLORS.SURFACE};
  border: 1px solid ${COLORS.BUTTON_BORDER};
  box-shadow: 2px 2px 6px rgba(0, 0, 0, 0.4);
  padding: 8px 10px;
  font-family: Tahoma, sans-serif;
  font-size: 11px;
  color: black;
  pointer-events: none;
`;

const BalloonInstruction = styled.div`
  font-weight: bold;
  margin-bottom: 4px;
`;

const Hint = styled.div`
  margin-top: 4px;
  padding-left: 14px;
  position: relative;
  &::before {
    content: '💡';
    position: absolute;
    left: 0;
  }
`;

const Panel = styled.div`
  position: absolute;
  right: 12px;
  bottom: ${TASKBAR_CLEARANCE}px;
  width: 220px;
  background: ${COLORS.SURFACE};
  border: 1px solid ${COLORS.BUTTON_BORDER};
  box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.4);
  font-family: Tahoma, sans-serif;
  font-size: 11px;
  color: black;
  pointer-events: auto;
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  background: ${COLORS.TITLE_BAR_GRADIENT};
  color: white;
  font-weight: bold;
  padding: 2px 3px 2px 8px;
`;

const PanelTitle = styled.span`
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const PanelBody = styled.div`
  padding: 8px;
`;

const Progress = styled.div`
  color: ${COLORS.BUTTON_SHADOW};
  margin-bottom: 6px;
`;

const StepList = styled.ol`
  margin: 6px 0 0;
  padding-left: 18px;
`;

const StepItem = styled.li<{ $state: 'done' | 'current' | 'todo' }>`
  margin: 2px 0;
  color: ${p => (p.$state === 'todo' ? COLORS.BUTTON_SHADOW : 'black')};
  font-weight: ${p => (p.$state === 'current' ? 'bold' : 'normal')};
  list-style-type: ${p => (p.$state === 'done' ? "'✓ '" : 'decimal')};
`;

interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

export const LessonOverlay: React.FC = () => {
  const { t } = useTranslation();
  const {
    status,
    lesson,
    step,
    stepIndex,
    totalSteps,
    visibleHints,
    nudgeSeq,
    score,
    stop,
    isWatch,
    watchPaused,
    demoSeq,
    pauseWatch,
    resumeWatch,
  } = useLesson();
  const rootRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<Box | null>(null);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const [blockSeq, setBlockSeq] = useState(0);
  const anchorElRef = useRef<Element | null>(null);

  // Balloon placement is delegated to floating-ui (viewport-fixed, auto-flipped
  // and shifted so it always stays on screen). Its reference is the live anchor
  // element, tracked below.
  const { refs, floatingStyles } = useFloating({
    placement: 'bottom-start',
    strategy: 'fixed',
    middleware: [offset(12), flip({ padding: 8 }), shift({ padding: 8 })],
    whileElementsMounted: (ref, float, update) =>
      autoUpdate(ref, float, update, { animationFrame: true }),
  });

  const running = status === 'running';

  // Track the current step's anchor: resolve its element (feeding both the
  // floating reference and the dim/ring rect) every frame so it follows window
  // drag/resize and appears once a just-opened app mounts it.
  useEffect(() => {
    if (!running) {
      setRect(null);
      setCursorPos(null);
      anchorElRef.current = null;
      refs.setReference(null);
      return undefined;
    }
    const rootEl = rootRef.current;
    const scope = findDesktopRoot(rootEl);
    let raf = 0;
    const tick = () => {
      const origin = rootEl?.getBoundingClientRect();
      const el = step?.anchor ? resolveAnchorEl(scope, step.anchor) : null;
      if (el !== anchorElRef.current) {
        anchorElRef.current = el;
        refs.setReference(el as HTMLElement | null);
      }
      if (el && origin) {
        const r = el.getBoundingClientRect();
        const next = {
          left: r.left - origin.left,
          top: r.top - origin.top,
          width: r.width,
          height: r.height,
        };
        setRect(prev =>
          prev &&
          prev.left === next.left &&
          prev.top === next.top &&
          prev.width === next.width &&
          prev.height === next.height
            ? prev
            : next
        );
        const vx = r.left + r.width / 2;
        const vy = r.top + r.height / 2;
        setCursorPos(prev => (prev && prev.x === vx && prev.y === vy ? prev : { x: vx, y: vy }));
      } else {
        setRect(prev => (prev === null ? prev : null));
        setCursorPos(prev => (prev === null ? prev : null));
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [running, step?.anchor, stepIndex, refs]);

  if (status === 'idle' || !lesson) return null;

  // Four dim rects framing the lit anchor (or a full cover when there's none).
  // Positioned with right/bottom insets so they never depend on a measured size.
  const shades: React.CSSProperties[] = rect
    ? [
        { left: 0, right: 0, top: 0, height: Math.max(0, rect.top - 4) },
        { left: 0, right: 0, top: rect.top + rect.height + 4, bottom: 0 },
        {
          left: 0,
          width: Math.max(0, rect.left - 4),
          top: Math.max(0, rect.top - 4),
          height: rect.height + 8,
        },
        {
          left: rect.left + rect.width + 4,
          right: 0,
          top: Math.max(0, rect.top - 4),
          height: rect.height + 8,
        },
      ]
    : [{ inset: 0 }];

  // `shield`: off-target clicks are absorbed by the dim shades (with a shake)
  // instead of reaching the UI, so the learner can only click the lit target.
  const shieldOn = running && step?.onWrongAction === 'shield';
  const shakeSeq = nudgeSeq + blockSeq;

  return (
    <Root ref={rootRef} data-testid="lesson-overlay">
      {running &&
        shades.map((s, i) => (
          <Shade
            key={i}
            data-testid="lesson-shade"
            style={{ ...s, pointerEvents: shieldOn ? 'auto' : 'none' }}
            onClick={
              shieldOn
                ? e => {
                    e.preventDefault();
                    e.stopPropagation();
                    setBlockSeq(n => n + 1);
                  }
                : undefined
            }
          />
        ))}

      {running && rect && (
        <Ring
          data-testid="lesson-spotlight"
          key={shakeSeq}
          $shake={shakeSeq}
          style={{
            left: rect.left - 4,
            top: rect.top - 4,
            width: rect.width + 8,
            height: rect.height + 8,
          }}
        />
      )}

      {running &&
        isWatch &&
        cursorPos &&
        createPortal(
          <GhostCursor
            data-testid="lesson-ghost-cursor"
            style={{ left: cursorPos.x, top: cursorPos.y }}
          >
            <ClickPulse key={demoSeq} />
            <svg width="20" height="28" viewBox="0 0 12 19" aria-hidden>
              <path
                d="M1 1 L1 15 L4.5 11.5 L7 17.5 L9 16.5 L6.5 11 L11 11 Z"
                fill="white"
                stroke="black"
                strokeWidth="1"
                strokeLinejoin="round"
              />
            </svg>
          </GhostCursor>,
          document.body
        )}

      {running && step && anchorElRef.current && (
        <Balloon
          ref={refs.setFloating}
          style={floatingStyles}
          key={nudgeSeq}
          data-testid="lesson-balloon"
        >
          <BalloonInstruction>{t(step.instruction)}</BalloonInstruction>
          {visibleHints.map((h, i) => (
            <Hint key={i}>{t(h)}</Hint>
          ))}
        </Balloon>
      )}

      <Panel data-testid="lesson-panel">
        <PanelHeader>
          <PanelTitle>{t(lesson.title)}</PanelTitle>
          <CloseBtn onClick={stop} aria-label={t('lesson.close')} title={t('lesson.close')} />
        </PanelHeader>
        <PanelBody>
          {running ? (
            <>
              <Progress>
                {t('lesson.progress', { current: stepIndex + 1, total: totalSteps })}
              </Progress>
              <StepList>
                {lesson.steps.map((s, i) => (
                  <StepItem
                    key={i}
                    $state={i < stepIndex ? 'done' : i === stepIndex ? 'current' : 'todo'}
                  >
                    {t(s.instruction)}
                  </StepItem>
                ))}
              </StepList>
              {isWatch && (
                <WatchButton
                  data-testid="lesson-watch-toggle"
                  onClick={() => (watchPaused ? resumeWatch() : pauseWatch())}
                >
                  {watchPaused ? t('lesson.watch.resume') : t('lesson.watch.pause')}
                </WatchButton>
              )}
            </>
          ) : (
            <div data-testid="lesson-complete">
              <div style={{ fontWeight: 'bold', marginBottom: 4 }}>{t('lesson.done')}</div>
              {score && <div>{t('lesson.score', { score: score.score })}</div>}
            </div>
          )}
        </PanelBody>
      </Panel>
    </Root>
  );
};

export default LessonOverlay;
