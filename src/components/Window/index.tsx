import React, { Suspense } from 'react';
import { createPortal } from 'react-dom';
import styled, { keyframes } from 'styled-components';
import { useWindowManagerActions, useActiveWindowId } from '../../context/WindowManagerContext';
import { WindowIdProvider } from '../../context/WindowIdContext';
import { sounds } from '../../utils/soundManager';
import { WindowState } from '../../types';
import { TIME, WINDOW_DEFAULTS } from '../../constants';
import { resolveOSTheme, useOSTheme } from '../../themes/useOSTheme';
import ErrorBoundary from '../ErrorBoundary';
import WindowChrome from './WindowChrome';
import WindowControls from './WindowControls';
import ResizableWrapper from './ResizableWrapper';
import { useModalInteraction } from '../../context/ModalContext';
import { useOptionalOSPackage } from '../../os/OSPackageContext';
import { useAppRegistry } from '../../context/AppRegistryContext';
import OSMenuBar from '../OSMenuBar';

interface WindowProps {
  windowState: WindowState;
}

interface CaptionRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface CaptionTransitionState {
  host: HTMLElement;
  from: CaptionRect;
  to: CaptionRect;
}

const captionRectTransition = keyframes`
  from {
    left: var(--xp-caption-from-left);
    top: var(--xp-caption-from-top);
    width: var(--xp-caption-from-width);
    height: var(--xp-caption-from-height);
  }
  to {
    left: var(--xp-caption-to-left);
    top: var(--xp-caption-to-top);
    width: var(--xp-caption-to-width);
    height: var(--xp-caption-to-height);
  }
`;

const WindowSurface = styled.div<{ $transitioning: boolean }>`
  width: 100%;
  height: 100%;
  position: relative;
  visibility: ${({ $transitioning }) => ($transitioning ? 'hidden' : 'visible')};
`;

const CaptionAnimation = styled.div`
  position: absolute;
  box-sizing: border-box;
  pointer-events: none;
  overflow: hidden;
  border: 2px solid ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_BORDER};
  background: transparent;
  box-shadow: inset 0 0 0 1px white;
  will-change: left, top, width, height;
  animation: ${captionRectTransition} ${TIME.ANIMATION_DURATION}ms linear both;

  &::before {
    content: '';
    position: absolute;
    inset: 1px 1px auto;
    height: min(
      ${({ theme }) => resolveOSTheme(theme).tokens.TITLE_BAR_HEIGHT}px,
      calc(100% - 2px)
    );
    background: ${({ theme }) => resolveOSTheme(theme).tokens.TITLE_BAR_GRADIENT};
  }
`;

const ModalBlocker = styled.div`
  position: absolute;
  inset: 0;
  z-index: 2000;
`;

/**
 * Frameless window body (WindowProps.frameless): no OS chrome at all - the app
 * draws its own skin (QQ2006 panel/chat). The app must supply its own drag
 * handle (an element with class `title-bar`) and window buttons; focus and
 * dragging stay with the engine's ResizableWrapper/Draggable machinery.
 */
const FramelessBody = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
`;

const Window: React.FC<WindowProps> = ({ windowState }) => {
  // Narrow subscriptions (#80): actions are referentially stable and the
  // active id changes only when focus moves, so with React.memo a drag or
  // update of one window no longer re-renders the others - our data arrives
  // via the windowState prop.
  const { closeWindow, minimizeWindow, maximizeWindow, resizeWindow, focusWindow, moveWindow } =
    useWindowManagerActions();
  const activeWindowId = useActiveWindowId();
  const { blockedWindowId, signalBlockedInteraction } = useModalInteraction();
  const osTheme = useOSTheme();
  const os = useOptionalOSPackage();
  const behavior = os?.behavior ?? {
    menuModel: 'in-window',
    maximizeSemantics: 'fill',
    windowAnimations: 'caption',
    focusRules: 'click-to-focus',
  };
  const WindowDecoration = os?.chrome.WindowDecoration;
  const { registry } = useAppRegistry();
  const appDefinition = registry?.[windowState.appId];

  const {
    id,
    component,
    zIndex,
    isMinimized,
    isMaximized,
    isHidden,
    width,
    height,
    left,
    top,
    props: windowProps,
    transition,
    transitionTarget,
    interactionMode,
  } = windowState;
  const surfaceRef = React.useRef<HTMLDivElement>(null);
  const [captionTransition, setCaptionTransition] = React.useState<CaptionTransitionState | null>(
    null
  );

  const handleFocus = React.useCallback(() => focusWindow(id), [focusWindow, id]);
  const handleMinimize = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      sounds.minimize();
      minimizeWindow(id);
    },
    [minimizeWindow, id]
  );
  const handleMaximize = React.useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (isMaximized) {
        sounds.restore();
      }
      maximizeWindow(id);
    },
    [id, isMaximized, maximizeWindow]
  );
  const handleClose = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      closeWindow(id);
    },
    [closeWindow, id]
  );

  const isResizable = windowProps?.resizable !== false;
  const currentWidth = width || 600;
  const currentHeight = height || 400;
  const minWidth = windowProps?.minWidth ?? WINDOW_DEFAULTS.MIN_WIDTH;
  const minHeight = windowProps?.minHeight ?? WINDOW_DEFAULTS.MIN_HEIGHT;
  const isModalBlocked = blockedWindowId === id;
  const isFocused = id === activeWindowId && !isModalBlocked;

  React.useLayoutEffect(() => {
    if (!transition || behavior.windowAnimations === 'none' || !surfaceRef.current) {
      setCaptionTransition(null);
      return;
    }

    const host = surfaceRef.current.closest<HTMLElement>('[data-testid="desktop"]');
    if (!host) return;
    const normalRect: CaptionRect = {
      left: left ?? 0,
      top: top ?? 0,
      width: currentWidth,
      height: currentHeight,
    };
    const maximizedRect: CaptionRect =
      behavior.maximizeSemantics === 'zoom'
        ? {
            left: host.clientWidth * 0.1,
            top: host.clientHeight * 0.05,
            width: host.clientWidth * 0.8,
            height: host.clientHeight * 0.8,
          }
        : {
            left: 0,
            top: 0,
            width: host.clientWidth,
            height: host.clientHeight - osTheme.tokens.TASKBAR_HEIGHT,
          };
    let from: CaptionRect;
    let to: CaptionRect;

    if (transition === 'minimize' || transition === 'restore') {
      if (!transitionTarget) return;
      const windowRect = isMaximized ? maximizedRect : normalRect;
      from = transition === 'minimize' ? windowRect : transitionTarget;
      to = transition === 'minimize' ? transitionTarget : windowRect;
    } else {
      from = transition === 'maximize' ? normalRect : maximizedRect;
      to = transition === 'maximize' ? maximizedRect : normalRect;
    }

    setCaptionTransition({ host, from, to });
  }, [
    currentHeight,
    currentWidth,
    isMaximized,
    left,
    behavior.windowAnimations,
    behavior.maximizeSemantics,
    osTheme,
    top,
    transition,
    transitionTarget,
  ]);

  const captionAnimation = React.useMemo(() => {
    if (!transition || !captionTransition) return null;
    const { host, from, to } = captionTransition;
    const style = {
      zIndex: 10000 + zIndex,
      '--xp-caption-from-left': `${from.left}px`,
      '--xp-caption-from-top': `${from.top}px`,
      '--xp-caption-from-width': `${from.width}px`,
      '--xp-caption-from-height': `${from.height}px`,
      '--xp-caption-to-left': `${to.left}px`,
      '--xp-caption-to-top': `${to.top}px`,
      '--xp-caption-to-width': `${to.width}px`,
      '--xp-caption-to-height': `${to.height}px`,
    } as React.CSSProperties;
    return createPortal(
      <CaptionAnimation
        style={style}
        data-window-transition={transition}
        data-testid={`window-caption-transition-${id}`}
        aria-hidden="true"
      />,
      host
    );
  }, [captionTransition, id, transition, zIndex]);

  const transitionStyle = React.useMemo(() => {
    if (!captionTransition) return undefined;
    return {
      visibility: 'hidden',
    } as React.CSSProperties;
  }, [captionTransition]);

  // A minimize-to-tray hide (isHidden) keeps the window mounted so the app's
  // tray registration and state survive. Plain minimized windows unmount after
  // their transition completes.
  if (isMinimized && !isHidden) return null;

  const chrome = (
    <WindowSurface
      ref={surfaceRef}
      className={
        interactionMode === 'size-ns'
          ? 'resize-ns'
          : interactionMode === 'size-ew'
            ? 'resize-ew'
            : interactionMode
              ? 'xp-move'
              : undefined
      }
      $transitioning={Boolean(transition && captionTransition)}
      style={transitionStyle}
      data-testid={`window-surface-${id}`}
      onMouseEnter={behavior.focusRules === 'focus-follows-pointer' ? handleFocus : undefined}
    >
      {windowProps?.frameless ? (
        <FramelessBody data-testid={`window-frameless-${id}`}>
          <ErrorBoundary windowId={id}>
            <Suspense fallback={<div style={{ padding: 20 }}>Loading...</div>}>
              <WindowIdProvider windowId={id}>{component}</WindowIdProvider>
            </Suspense>
          </ErrorBoundary>
        </FramelessBody>
      ) : WindowDecoration ? (
        <WindowDecoration
          windowState={windowState}
          isFocused={isFocused}
          isResizable={isResizable}
          onFocus={handleFocus}
          onMinimize={handleMinimize}
          onMaximize={handleMaximize}
          onClose={handleClose}
        >
          {behavior.menuModel === 'in-window' && appDefinition?.menus && (
            <OSMenuBar
              menus={appDefinition.menus}
              onCommand={commandId => appDefinition.onMenuCommand?.(commandId, id)}
            />
          )}
          <ErrorBoundary windowId={id}>
            <Suspense fallback={<div style={{ padding: 20 }}>Loading...</div>}>
              <WindowIdProvider windowId={id}>{component}</WindowIdProvider>
            </Suspense>
          </ErrorBoundary>
        </WindowDecoration>
      ) : (
        <WindowChrome
          windowState={windowState}
          isFocused={isFocused}
          isResizable={isResizable}
          onFocus={handleFocus}
          onMaximize={handleMaximize}
          controls={
            <WindowControls
              isFocused={isFocused}
              isResizable={isResizable}
              isMaximized={!!isMaximized}
              onMinimize={handleMinimize}
              onMaximize={handleMaximize}
              onClose={handleClose}
            />
          }
          style={{ width: '100%', height: '100%' }}
        >
          <ErrorBoundary windowId={id}>
            <Suspense fallback={<div style={{ padding: 20 }}>Loading...</div>}>
              <WindowIdProvider windowId={id}>{component}</WindowIdProvider>
            </Suspense>
          </ErrorBoundary>
        </WindowChrome>
      )}
      {isModalBlocked && (
        <ModalBlocker
          data-testid={`modal-blocker-${id}`}
          onMouseDown={event => {
            event.preventDefault();
            event.stopPropagation();
            signalBlockedInteraction();
          }}
        />
      )}
    </WindowSurface>
  );

  if (isMaximized && !isHidden) {
    const maximizedStyle: React.CSSProperties =
      behavior.maximizeSemantics === 'zoom'
        ? {
            top: '5%',
            left: '10%',
            width: '80%',
            height: '80%',
          }
        : {
            top: 0,
            left: 0,
            width: '100%',
            height: 'calc(100% - 30px)',
          };
    return (
      <>
        <div
          className="xp-window"
          data-window-id={id}
          style={{
            zIndex,
            position: 'absolute',
            ...maximizedStyle,
          }}
          onMouseDown={e => e.stopPropagation()}
        >
          {chrome}
        </div>
        {captionAnimation}
      </>
    );
  }

  return (
    <>
      <ResizableWrapper
        id={id}
        left={left ?? 100}
        top={top ?? 100}
        width={currentWidth}
        height={currentHeight}
        minWidth={minWidth}
        minHeight={minHeight}
        zIndex={zIndex}
        isResizable={isResizable}
        hidden={isHidden}
        onFocus={handleFocus}
        onMove={moveWindow}
        onResize={resizeWindow}
      >
        {chrome}
      </ResizableWrapper>
      {captionAnimation}
    </>
  );
};

export default React.memo(Window);
