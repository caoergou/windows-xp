import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { QQModalLayer } from './styles';
import { qqImg } from './assets';

export type QQCloseChoice = 'hide' | 'exit';

interface QQCloseDialogProps {
  /** After "确定", callback with the selected option (hide to tray / quit program). */
  onConfirm: (choice: QQCloseChoice) => void;
  /** Cancel closing (click "取消" or the title-bar x). */
  onCancel: () => void;
}

/**
 * Confirmation dialog when closing QQ (#refine-qq) - recreates classic QQ2006:
 * two radio options "Hide to the taskbar notification area / Quit program"
 * + OK / Cancel, ported to body, centered on screen.
 * "Remember my choice" is a decorative realism item (not persisted), consistent
 * with other QQ business buttons that are visible but not wired up.
 */
const QQCloseDialog: React.FC<QQCloseDialogProps> = ({ onConfirm, onCancel }) => {
  const [choice, setChoice] = useState<QQCloseChoice>('hide');

  return createPortal(
    <QQModalLayer
      data-testid="qq-close-dialog"
      onMouseDown={e => {
        if (e.target === e.currentTarget) onCancel();
        e.stopPropagation();
      }}
      onClick={e => e.stopPropagation()}
      onFocus={e => e.stopPropagation()}
    >
      <div className="qq-dlg" style={{ width: 320 }} onMouseDown={e => e.stopPropagation()}>
        <div className="qq-dlg-title">
          <img src={qqImg('im/icon.png')} alt="" />
          <span>QQ2006</span>
          <button className="title-x" title="取消" onClick={onCancel}>
            ✕
          </button>
        </div>
        <div className="qq-dlg-body">
          <div>您希望在关闭 QQ 主面板时：</div>
          <label className="qq-dlg-radio">
            <input
              type="radio"
              name="qq-close"
              checked={choice === 'hide'}
              onChange={() => setChoice('hide')}
            />
            隐藏到任务栏通知区域
          </label>
          <label className="qq-dlg-radio">
            <input
              type="radio"
              name="qq-close"
              checked={choice === 'exit'}
              onChange={() => setChoice('exit')}
            />
            退出程序
          </label>
          <label className="qq-dlg-radio" style={{ opacity: 0.85 }}>
            <input type="checkbox" />
            以后不再提示
          </label>
        </div>
        <div className="qq-dlg-btns">
          <button
            className="qq-btn"
            data-testid="qq-close-confirm"
            onClick={() => onConfirm(choice)}
          >
            确定
          </button>
          <button className="qq-btn" onClick={onCancel}>
            取消
          </button>
        </div>
      </div>
    </QQModalLayer>,
    document.body
  );
};

export default QQCloseDialog;
