import React, { useEffect, useRef, useState } from 'react';
import { ChatRoot } from './styles';
import { qqAvatar } from './assets';
import { qqStore } from './qqStore';
import { useQQStore } from './useQQStore';
import { useApp } from '../../hooks/useApp';
import { useActiveWindowId } from '../../context/WindowManagerContext';
import { useWindowId } from '../../context/WindowIdContext';
import { useXPEventBus } from '../../context/EventBusContext';
import { renderMessageNodes, QQ_EMOJI_LIST } from '../../utils/emojiRenderer';

interface QQChatProps {
  buddyId: string;
  windowId?: string;
}

/**
 * QQ 聊天窗口 —— 还原 QQ2006 聊天窗：大工具条、对方信息条、两行式消息流
 * （对方蓝昵称行 / 自己绿昵称行，无气泡）、表情小工具条、输入框、右侧 QQ 秀 +
 * 个人空间栏。消息正文经 emojiRenderer 渲染经典表情。
 */
const QQChat: React.FC<QQChatProps> = ({ buddyId, windowId }) => {
  const api = useApp(windowId);
  const ctxWindowId = useWindowId();
  const wid = windowId ?? ctxWindowId;
  const bus = useXPEventBus();
  const activeWindowId = useActiveWindowId();
  const state = useQQStore();
  const buddy = state.buddies.find(b => b.id === buddyId);
  const me = state.me;
  const thread = state.threads[buddyId] ?? [];
  const typing = !!state.typing[buddyId];

  const listRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // 设定窗口标题 + 派发打开事件（一次）。
  useEffect(() => {
    if (buddy) api.window.setTitle(`与 ${buddy.nickname} 聊天中`);
    bus.emit({ type: 'qq:open', buddyId });
    return () => {
      if (qqStore.getState().focusedChat === buddyId) qqStore.setFocusedChat(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buddyId]);

  // 本窗获得焦点时，标记为当前聊天并清零未读。
  useEffect(() => {
    if (activeWindowId && activeWindowId === wid) {
      qqStore.setFocusedChat(buddyId);
    }
  }, [activeWindowId, wid, buddyId]);

  // 新消息 / 打字状态变化时滚到底部。
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [thread.length, typing]);

  const send = () => {
    const text = inputRef.current?.value ?? '';
    if (!text.trim()) return;
    qqStore.sendFromMe(buddyId, text.trim());
    if (inputRef.current) inputRef.current.value = '';
    setShowEmoji(false);
  };

  // 在光标处插入 `[微笑]` 表情码（输入框为非受控，直接改 value 并复位光标）。
  const insertEmoji = (code: string) => {
    const el = inputRef.current;
    if (!el) return;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    el.value = el.value.slice(0, start) + code + el.value.slice(end);
    const caret = start + code.length;
    el.focus();
    el.setSelectionRange(caret, caret);
    setShowEmoji(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    // 默认 Enter 发送，Shift+Enter 换行（经典 QQ 行为）。
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  if (!buddy || !me) {
    return <ChatRoot data-testid="qq-chat" />;
  }

  return (
    <ChatRoot data-testid="qq-chat">
      {/* 大工具条 */}
      <div className="qq-im-big-toolbar">
        <button className="im-big-msg" onClick={() => api.sound.play('qqSystem')}>
          短信
        </button>
        <button className="im-big-video">视频</button>
        <button className="im-big-audio">语音</button>
        <button className="im-big-file">传文件</button>
        <button className="im-big-3d">3D秀</button>
        <button className="im-big-invite">邀请</button>
      </div>

      <div className="qq-im-contant">
        <div className="qq-im-main">
          <div className="qq-im-chat">
            <div className="qq-im-chat-msg">
              <div className="qq-im-friend-info" title="查看资料">
                <img src={qqAvatar(buddy.avatar)} alt="" />
                {buddy.nickname}({buddy.number})：{buddy.signature || ''}
              </div>
              <ul className="qq-im-chat-msg-list" data-testid="qq-chat-messages" ref={listRef}>
                {thread.map(m => {
                  const nick = m.from === 'me' ? me.nickname : buddy.nickname;
                  return (
                    <li key={m.id} className={m.from === 'me' ? 'my' : ''}>
                      <p>
                        {nick}
                        <span>{m.time}</span>
                      </p>
                      <p>{renderMessageNodes(m.text)}</p>
                    </li>
                  );
                })}
                {typing && (
                  <li className="qq-im-typing" data-testid="qq-chat-typing">
                    对方正在输入…
                  </li>
                )}
              </ul>
            </div>

            {/* 聊天记录查看器：当前会话历史（含收发双方、时间戳）覆盖在消息区上。 */}
            {showHistory && (
              <div className="qq-im-history" data-testid="qq-chat-history">
                <div className="qq-im-history-head">
                  <span>消息记录 — {buddy.nickname}</span>
                  <button onClick={() => setShowHistory(false)}>关闭</button>
                </div>
                <div className="qq-im-history-list">
                  {thread.length === 0 && (
                    <div className="qq-im-history-empty">暂无聊天记录</div>
                  )}
                  {thread.map(m => (
                    <div key={m.id} className={`row${m.from === 'me' ? ' my' : ''}`}>
                      <div className="meta">
                        {m.from === 'me' ? me.nickname : buddy.nickname}
                        <span>{m.time}</span>
                      </div>
                      <div className="body">{renderMessageNodes(m.text)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 表情选择面板：经典黄脸网格，点选把 [微笑] 码插入输入框。 */}
            {showEmoji && (
              <div className="qq-emoji-picker" data-testid="qq-emoji-picker">
                {QQ_EMOJI_LIST.map(({ code, emoji }) => (
                  <button
                    key={code}
                    type="button"
                    title={code}
                    onClick={() => insertEmoji(code)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {/* 小工具条 */}
            <div className="qq-im-chat-toolbar">
              <button className="im-toolbar-font" title="字体" />
              <button
                className="im-toolbar-face"
                title="表情"
                data-testid="qq-chat-face"
                onClick={() => setShowEmoji(v => !v)}
              />
              <button className="im-toolbar-other" title="魔法表情" />
              <span className="sep" />
              <button className="im-toolbar-picture" title="发送图片" />
              <button className="im-toolbar-catch" title="屏幕捕捉" />
              <button className="im-toolbar-scene" title="聊天场景" />
              <button className="im-toolbar-bag" title="超级礼物" />
              <button className="im-toolbar-ptt" title="语音消息" />
            </div>

            <textarea
              className="qq-im-chat-send"
              data-testid="qq-chat-input"
              ref={inputRef}
              onKeyDown={onKeyDown}
              placeholder=""
            />
          </div>

          <div className="qq-im-btns">
            <button
              className="qq-btn"
              data-testid="qq-chat-history-btn"
              onClick={() => setShowHistory(v => !v)}
            >
              聊天记录(H)
            </button>
            <button className="qq-btn">消息模式(T)</button>
            <span />
            <button className="qq-btn" onClick={() => api.window.close()}>
              关闭(C)
            </button>
            <button className="qq-btn" data-testid="qq-chat-send" onClick={send}>
              发送(S)
            </button>
          </div>
        </div>

        {/* 右侧栏：QQ 秀 + 个人空间 */}
        <div className="qq-im-side">
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <button className="qq-im-side-btn">对方形象</button>
            <div className="qq-im-show qq-im-show-1" />
          </div>
          <div className="qq-im-zone">
            <button className="qq-im-side-btn">个人空间</button>
            <div>摘要：{buddy.signature || '若无法为你撑起晴空，那我便陪你共沐风雨'}</div>
            <div>
              日记：<span>48</span>条/<span>169</span>评论
            </div>
            <div>
              相册：<span>12</span>张/<span>23</span>评论
            </div>
            <div>
              收藏：<span>62</span>个
            </div>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <button className="qq-im-side-btn">我的形象</button>
            <div className="qq-im-show qq-im-show-3" />
          </div>
        </div>
      </div>
    </ChatRoot>
  );
};

export default QQChat;
