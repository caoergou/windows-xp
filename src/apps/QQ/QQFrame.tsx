import React from 'react';
import { QQFrameRoot } from './styles';

interface QQFrameProps {
  /**
   * 'panel': QQ2006 main-panel title bar (24px, "QQ 2006" logo slice +
   * minimize / skin-color / close).
   * 'chat': chat-window title bar (26px, sticky-note icon + title text +
   * minimize / maximize / close) plus the 8px bottom border strip.
   */
  variant: 'panel' | 'chat';
  /** Title text (chat variant only; the panel title is baked into the skin image). */
  title?: string;
  onMinimize?: () => void;
  onMaximize?: () => void;
  onClose?: () => void;
  children: React.ReactNode;
}

/**
 * QQ2006 self-drawn window chrome, restored from mengkunsoft/QQ2006 (see
 * docs/QQ-CLASSIC-UI.md §1/§2). Rendered in place of the OS window chrome
 * (WindowProps.frameless): the engine still owns dragging - the title bar
 * carries the `.title-bar` class that the Draggable handle matches - and
 * focus, while the buttons call the real window operations handed down by
 * the app (close/minimize guards fire as usual, e.g. the panel's
 * hide-to-tray flow).
 */
const QQFrame: React.FC<QQFrameProps> = ({
  variant,
  title,
  onMinimize,
  onMaximize,
  onClose,
  children,
}) => {
  // The engine's WindowContainer focuses the window on ANY click bubbling up
  // from the content; a frame button click must not bubble past its own action
  // (a minimize click would otherwise hide the window and immediately re-focus
  // it back visible, #292).
  const btn =
    (fn?: () => void) =>
    (e: React.MouseEvent): void => {
      e.stopPropagation();
      fn?.();
    };

  return (
    <QQFrameRoot $variant={variant} data-testid={`qq-frame-${variant}`}>
      <div className="qqf-title title-bar">
        <div className="qqf-title-left" />
        <div className="qqf-title-center" />
        <div className="qqf-title-right" />
        {variant === 'chat' && (
          <>
            <div className="qqf-title-icon" />
            <div className="qqf-title-text">{title}</div>
          </>
        )}
        <div className="qqf-title-btns">
          {onMinimize && (
            <button className="qqf-min" aria-label="最小化" onClick={btn(onMinimize)} />
          )}
          {variant === 'panel' && <button className="qqf-color" aria-label="更换皮肤" />}
          {variant === 'chat' && onMaximize && (
            <button className="qqf-max" aria-label="最大化" onClick={btn(onMaximize)} />
          )}
          {onClose && <button className="qqf-close" aria-label="关闭" onClick={btn(onClose)} />}
        </div>
      </div>
      <div className="qqf-body">{children}</div>
      {variant === 'chat' && (
        <div className="qqf-bottom">
          <div className="qqf-bottom-left" />
          <div className="qqf-bottom-center" />
          <div className="qqf-bottom-right" />
        </div>
      )}
    </QQFrameRoot>
  );
};

export default QQFrame;
