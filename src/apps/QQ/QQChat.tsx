import React, { useEffect, useRef, useState } from 'react';
import { ChatRoot } from './styles';
import { qqAvatar, qqEmoticon } from './assets';
import { qqStore } from './qqStore';
import { useQQStore } from './useQQStore';
import { useApp } from '../../hooks/useApp';
import { useActiveWindowId } from '../../context/WindowManagerContext';
import { useWindowId } from '../../context/WindowIdContext';
import { useXPEventBus } from '../../context/EventBusContext';
import { renderMessageNodes, QQ_EMOJI_LIST } from './emojiRenderer';
import QQFrame from './QQFrame';

interface QQChatProps {
  buddyId: string;
  windowId?: string;
}

/**
 * QQ chat window - recreation of the QQ2006 chat window: large toolbar, partner info bar,
 * two-line message flow (partner blue nickname line / self green nickname line, no bubbles),
 * emoji mini-toolbar, input box, right-side QQ Show + personal-space bar.
 * Message bodies are rendered by emojiRenderer for classic emoticons.
 * The window is frameless (QQ-CLASSIC-UI §2): QQFrame draws the self-skinned
 * 26px title bar and bottom border in place of the XP chrome.
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

  // Set window title + dispatch open event (once).
  useEffect(() => {
    if (buddy) api.window.setTitle(`与 ${buddy.nickname} 聊天中`);
    bus.emit({ type: 'qq:open', buddyId });
    return () => {
      if (qqStore.getState().focusedChat === buddyId) qqStore.setFocusedChat(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buddyId]);

  // When this window gains focus, mark it as the current chat and clear unread messages.
  useEffect(() => {
    if (activeWindowId && activeWindowId === wid) {
      qqStore.setFocusedChat(buddyId);
    }
  }, [activeWindowId, wid, buddyId]);

  // Scroll to the bottom on new messages / typing-status changes.
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

  // Insert the "[微笑]" emoticon code at the cursor (the input is uncontrolled, so mutate value directly and restore cursor).
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
    // Default: Enter sends, Shift+Enter inserts a newline (classic QQ behavior).
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  if (!buddy || !me) {
    return (
      <QQFrame
        variant="chat"
        onMinimize={() => api.window.minimize()}
        onClose={() => api.window.close()}
      >
        <ChatRoot data-testid="qq-chat" />
      </QQFrame>
    );
  }

  return (
    <QQFrame
      variant="chat"
      title={`与 ${buddy.nickname} 聊天中`}
      onMinimize={() => api.window.minimize()}
      onMaximize={() => api.window.maximize()}
      onClose={() => api.window.close()}
    >
      <ChatRoot data-testid="qq-chat">
        {/* Large toolbar */}
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

              {/* Chat history viewer: current conversation history (sender/receiver, timestamps) overlays the message area. */}
              {showHistory && (
                <div className="qq-im-history" data-testid="qq-chat-history">
                  <div className="qq-im-history-head">
                    <span>消息记录 — {buddy.nickname}</span>
                    <button onClick={() => setShowHistory(false)}>关闭</button>
                  </div>
                  <div className="qq-im-history-list">
                    {thread.length === 0 && <div className="qq-im-history-empty">暂无聊天记录</div>}
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

              {/* Emoji picker panel: classic QQ emoticon image grid; clicking inserts the "[微笑]" code into the input box. */}
              {showEmoji && (
                <div className="qq-emoji-picker" data-testid="qq-emoji-picker">
                  {QQ_EMOJI_LIST.map(({ code, file }) => {
                    const src = qqEmoticon(file);
                    return (
                      <button key={code} type="button" title={code} onClick={() => insertEmoji(code)}>
                        <img className="qq-emoji-picker-img" src={src} alt={code} />
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Mini toolbar */}
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

          {/* Right sidebar: QQ Show + personal space */}
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
    </QQFrame>
  );
};

export default QQChat;
