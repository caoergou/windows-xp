import React from 'react';
import { LoadingRoot } from './styles';
import { qqImg } from './assets';

interface QQLoadingPanelProps {
  onCancel: () => void;
  /** Window minimize (the logging window has its own 16px min/close buttons). */
  onMinimize?: () => void;
  /** Window close. */
  onClose?: () => void;
}

/**
 * "Logging in" narrow bar window (190x580, same shape as the main panel) -
 * original blue scrolling progress, large QQ logo, "正在登录" and "取消登录".
 * After successful login this window morphs into the main panel in-place
 * (classic memory point). Rendered frameless: the 190px header artwork doubles
 * as the title bar (drag via the `.title-bar` class) with its own min/close.
 */
const QQLoadingPanel: React.FC<QQLoadingPanelProps> = ({ onCancel, onMinimize, onClose }) => {
  // Same bubble-guard as QQFrame: frame button clicks must not reach the
  // engine's click-to-focus WindowContainer (#292).
  const btn =
    (fn?: () => void) =>
    (e: React.MouseEvent): void => {
      e.stopPropagation();
      fn?.();
    };

  return (
    <LoadingRoot data-testid="qq-loading">
      <div className="qq-logging-title title-bar qq-flex-bg">
        <div className="qq-logging-title-left" />
        <div className="qq-logging-title-center" />
        <div className="qq-logging-title-right" />
        <div className="qq-logging-title-btns">
          <button
            className="qq-logging-min"
            title="最小化"
            aria-label="最小化"
            onClick={btn(onMinimize)}
          />
          <button
            className="qq-logging-close"
            title="关闭"
            aria-label="关闭"
            onClick={btn(onClose)}
          />
        </div>
      </div>
      <div className="qq-logging-body qq-flex-bg">
        <div className="qq-body-left" />
        <div className="qq-body-center" />
        <div className="qq-body-right" />
      </div>
      <div className="qq-logging-bottom qq-flex-bg">
        <div className="qq-bottom-left" />
        <div className="qq-bottom-center" />
        <div className="qq-bottom-right" />
      </div>
      <div className="qq-logging-main">
        <img src={qqImg('logging/BITMAP1710_1.png')} alt="QQ" />
        <img src={qqImg('logging/START_GIF1704_1.gif')} alt="" />
        <p>正在登录</p>
        <button className="qq-logging-cancel" title="取消登录" onClick={onCancel} />
      </div>
    </LoadingRoot>
  );
};

export default QQLoadingPanel;
