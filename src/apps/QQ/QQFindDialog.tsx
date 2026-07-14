import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { QQModalLayer } from './styles';
import { qqImg, qqAvatar } from './assets';
import { QQ_STATUS_LABEL } from './statusMeta';
import type { RuntimeBuddy } from './qqStore';

interface QQFindDialogProps {
  buddies: RuntimeBuddy[];
  /** 双击/回车选中一个好友：打开聊天并关闭对话框。 */
  onOpenChat: (buddyId: string) => void;
  onClose: () => void;
}

/**
 * 查找联系人对话框（#refine-qq）——底部「查找」按钮 / 主菜单入口触发。按昵称或
 * 号码即时过滤好友，双击（或选中后回车）打开聊天窗口。Portal 到 body、屏幕居中。
 */
const QQFindDialog: React.FC<QQFindDialogProps> = ({ buddies, onOpenChat, onClose }) => {
  const [query, setQuery] = useState('');
  const [sel, setSel] = useState<string | null>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return buddies;
    return buddies.filter(
      b => b.nickname.toLowerCase().includes(q) || b.number.toLowerCase().includes(q)
    );
  }, [query, buddies]);

  const open = (id: string) => {
    onOpenChat(id);
    onClose();
  };

  return createPortal(
    <QQModalLayer
      data-testid="qq-find-dialog"
      onMouseDown={e => {
        if (e.target === e.currentTarget) onClose();
        e.stopPropagation();
      }}
      onClick={e => e.stopPropagation()}
      onFocus={e => e.stopPropagation()}
    >
      <div className="qq-dlg" style={{ width: 300 }} onMouseDown={e => e.stopPropagation()}>
        <div className="qq-dlg-title">
          <img src={qqImg('im/icon.png')} alt="" />
          <span>查找联系人</span>
          <button className="title-x" title="关闭" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="qq-dlg-body">
          <div className="qq-dlg-row">
            <span>昵称/号码：</span>
            <input
              className="qq-find-input"
              data-testid="qq-find-input"
              autoFocus
              value={query}
              onChange={e => {
                setQuery(e.target.value);
                setSel(null);
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' && (sel ?? results[0]?.id)) open(sel ?? results[0].id);
              }}
            />
          </div>
          <ul className="qq-find-results" data-testid="qq-find-results">
            {results.length === 0 && <div className="qq-find-empty">没有找到匹配的联系人</div>}
            {results.map(b => (
              <li
                key={b.id}
                className={sel === b.id ? 'sel' : ''}
                data-testid={`qq-find-item-${b.id}`}
                onClick={() => setSel(b.id)}
                onDoubleClick={() => open(b.id)}
              >
                <img src={qqAvatar(b.avatar)} alt="" />
                <div>
                  <div className="fr-name">{b.nickname}</div>
                  <div className="fr-sub">
                    {b.number}（{QQ_STATUS_LABEL[b.currentStatus]}）
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="qq-dlg-btns">
          <button
            className="qq-btn"
            disabled={!sel && results.length === 0}
            onClick={() => (sel ?? results[0]?.id) && open(sel ?? results[0].id)}
          >
            发送消息
          </button>
          <button className="qq-btn" onClick={onClose}>
            关闭
          </button>
        </div>
      </div>
    </QQModalLayer>,
    document.body
  );
};

export default QQFindDialog;
