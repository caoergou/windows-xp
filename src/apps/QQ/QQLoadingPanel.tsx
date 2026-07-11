import React from 'react';
import { LoadingRoot } from './styles';
import { qqImg } from './assets';

interface QQLoadingPanelProps {
  onCancel: () => void;
}

/**
 * 「登录中」窄条窗（190×580 同主面板形态）—— 原版蓝色滚动进度、QQ 大 logo、
 * 「正在登录」与「取消登录」。登录成功后此窗原地变成主面板（经典记忆点）。
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
