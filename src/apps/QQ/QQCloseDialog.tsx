import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { QQModalLayer } from './styles';
import { qqImg } from './assets';

export type QQCloseChoice = 'hide' | 'exit';

interface QQCloseDialogProps {
  /** 「确定」后带着所选项回调（隐藏到托盘 / 退出程序）。 */
  onConfirm: (choice: QQCloseChoice) => void;
  /** 取消关闭（点「取消」或标题栏 ×）。 */
  onCancel: () => void;
}

/**
 * 关闭 QQ 时的确认对话框（#refine-qq）——还原经典 QQ2006：两个单选项
 * 「隐藏到任务栏通知区域 / 退出程序」+ 确定 / 取消，Portal 到 body、屏幕居中。
 * 「记住我的选择」为拟真装饰项（不落库），与其余在幕不落地的 QQ 业务按钮一致。
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
