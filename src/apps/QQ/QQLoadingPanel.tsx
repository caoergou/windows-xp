import React from 'react';
import { LoadingRoot } from './styles';
import { qqImg } from './assets';

interface QQLoadingPanelProps {
  onCancel: () => void;
}

/**
 * "Logging in" narrow bar window (190x580, same shape as the main panel) -
 * original blue scrolling progress, large QQ logo, "正在登录" and "取消登录".
 * After successful login this window morphs into the main panel in-place
 * (classic memory point).
 */
const QQLoadingPanel: React.FC<QQLoadingPanelProps> = ({ onCancel }) => (
  <LoadingRoot data-testid="qq-loading">
    <div className="qq-logging-body qq-flex-bg">
      <div className="qq-body-left" />
      <div className="qq-body-center" />
      <div className="qq-body-right" />
    </div>
    <div className="qq-logging-main">
      <img src={qqImg('logging/BITMAP1710_1.png')} alt="QQ" />
      <img src={qqImg('logging/START_GIF1704_1.gif')} alt="" />
      <p>正在登录</p>
      <button className="qq-logging-cancel" title="取消登录" onClick={onCancel} />
    </div>
  </LoadingRoot>
);

export default QQLoadingPanel;
