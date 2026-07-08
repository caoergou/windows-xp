import React, { Suspense } from 'react';
import { useWindowManager } from '../../context/WindowManagerContext';
import { WindowState } from '../../types';
import ErrorBoundary from '../ErrorBoundary';
import WindowChrome from './WindowChrome';
import WindowControls from './WindowControls';
import ResizableWrapper from './ResizableWrapper';

interface WindowProps {
  windowState: WindowState;
}

const Window: React.FC<WindowProps> = ({ windowState }) => {
  const {
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    resizeWindow,
    focusWindow,
    moveWindow,
    activeWindowId,
  } = useWindowManager();

  const {
    id,
    component,
    zIndex,
    isMinimized,
    isMaximized,
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
      minimizeWindow(id);
    },
    [minimizeWindow, id]
  );
  const handleMaximize = React.useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      maximizeWindow(id);
    },
    [maximizeWindow, id]
  );
  const handleClose = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      closeWindow(id);
    },
    [closeWindow, id]
  );

  if (isMinimized) return null;

  const isResizable = windowProps?.resizable !== false;
  const currentWidth = width || 600;
  const currentHeight = height || 400;
  const isFocused = id === activeWindowId;

  // Inject windowId into the app component so it can access useApp(windowId)
  const injectedComponent = React.cloneElement(
    component as React.ReactElement<{ windowId?: string }>,
    { windowId: id }
  );

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
          {injectedComponent}
        </Suspense>
      </ErrorBoundary>
    </WindowChrome>
  );

  if (isMaximized) {
    return (
      <div
        style={{
          zIndex,
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: 'calc(100% - 30px)',
        }}
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
      zIndex={zIndex}
      isResizable={isResizable}
      onFocus={handleFocus}
      onMove={moveWindow}
      onResize={resizeWindow}
    >
      {chrome}
    </ResizableWrapper>
  );
};

export default React.memo(Window);
