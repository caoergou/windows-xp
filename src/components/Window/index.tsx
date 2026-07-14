import React, { Suspense } from 'react';
import { useWindowManagerActions, useActiveWindowId } from '../../context/WindowManagerContext';
import { WindowIdProvider } from '../../context/WindowIdContext';
import { sounds } from '../../utils/soundManager';
import { WindowState } from '../../types';
import { WINDOW_DEFAULTS } from '../../constants';
import ErrorBoundary from '../ErrorBoundary';
import WindowChrome from './WindowChrome';
import WindowControls from './WindowControls';
import ResizableWrapper from './ResizableWrapper';

interface WindowProps {
  windowState: WindowState;
}

const Window: React.FC<WindowProps> = ({ windowState }) => {
  // Narrow subscriptions (#80): actions are referentially stable and the
  // active id changes only when focus moves, so with React.memo a drag or
  // update of one window no longer re-renders the others - our data arrives
  // via the windowState prop.
  const { closeWindow, minimizeWindow, maximizeWindow, resizeWindow, focusWindow, moveWindow } =
    useWindowManagerActions();
  const activeWindowId = useActiveWindowId();

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
  } = windowState;

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
    [maximizeWindow, id, isMaximized]
  );
  const handleClose = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      closeWindow(id);
    },
    [closeWindow, id]
  );

  // A minimize-to-tray hide (isHidden) keeps the window MOUNTED but invisible so
  // the app's tray registration and state survive — unmounting it (as a plain
  // taskbar-minimize does) would tear down the very tray icon needed to restore
  // it (#refine-qq). A normal minimize still unmounts (restored via the taskbar).
  if (isMinimized && !isHidden) return null;

  const isResizable = windowProps?.resizable !== false;
  const currentWidth = width || 600;
  const currentHeight = height || 400;
  const minWidth = windowProps?.minWidth ?? WINDOW_DEFAULTS.MIN_WIDTH;
  const minHeight = windowProps?.minHeight ?? WINDOW_DEFAULTS.MIN_HEIGHT;
  const isFocused = id === activeWindowId;

  const chrome = (
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
  );

  if (isMaximized && !isHidden) {
    return (
      <div
        className="xp-window"
        style={{
          zIndex,
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: 'calc(100% - 30px)',
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {chrome}
      </div>
    );
  }

  return (
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
  );
};

export default React.memo(Window);
