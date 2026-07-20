import React from 'react';
import WindowChrome from '../../../components/Window/WindowChrome';
import WindowControls from '../../../components/Window/WindowControls';
import type { WindowDecorationProps } from '../../../os/contract';

const XPWindowDecoration: React.FC<WindowDecorationProps> = ({
  windowState,
  isFocused,
  isResizable,
  onFocus,
  onMinimize,
  onMaximize,
  onClose,
  children,
}) => (
  <WindowChrome
    windowState={windowState}
    isFocused={isFocused}
    isResizable={isResizable}
    onFocus={onFocus}
    onMaximize={onMaximize}
    controls={
      <WindowControls
        isFocused={isFocused}
        isResizable={isResizable}
        isMaximized={!!windowState.isMaximized}
        onMinimize={onMinimize}
        onMaximize={onMaximize}
        onClose={onClose}
      />
    }
    style={{ width: '100%', height: '100%' }}
  >
    {children}
  </WindowChrome>
);

export default XPWindowDecoration;
